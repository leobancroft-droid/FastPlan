import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are a nutrition vision assistant. Given a photo of a meal, identify each distinct food or beverage item visible, estimate a reasonable serving size, and approximate macros.

Return STRICT JSON matching this schema, with NO prose, NO markdown:
{
  "items": [
    {
      "label": "string (short food name, e.g. 'Grilled chicken breast')",
      "emoji": "string (single emoji that best represents the food)",
      "serving": "string (e.g. '150 g', '1 cup', '1 slice')",
      "kcal": number,
      "carbs": number,
      "protein": number,
      "fat": number
    }
  ],
  "note": "string (optional one-sentence caveat about confidence, or empty string)"
}

Rules:
- All numeric values are integers, in grams for macros and kcal for calories.
- If the image contains no recognizable food, return { "items": [], "note": "No food detected" }.
- Combine obvious composite items (e.g. a burger) into one entry rather than splitting into bun/patty.
- Keep labels concise (max 5 words).`;

router.post("/scan-food", async (req: Request, res: Response) => {
  const { imageBase64, mimeType } = req.body ?? {};
  if (typeof imageBase64 !== "string" || imageBase64.length < 100) {
    return res.status(400).json({ error: "imageBase64 is required" });
  }
  const mime = typeof mimeType === "string" && mimeType.startsWith("image/") ? mimeType : "image/jpeg";
  const dataUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:${mime};base64,${imageBase64}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this meal photo and return the JSON." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const finish = response.choices[0]?.finish_reason;
    if (!raw.trim()) {
      logger.warn({ finish, usage: response.usage }, "scan-food: empty model response");
      return res.status(502).json({
        error:
          finish === "length"
            ? "The model ran out of tokens before answering. Try a simpler photo."
            : "The AI returned an empty response. Please try again.",
      });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      logger.warn({ raw: raw.slice(0, 500) }, "scan-food: model returned invalid JSON");
      return res.status(502).json({ error: "Could not parse AI response" });
    }

    const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
    const itemsRaw = Array.isArray(obj.items) ? obj.items : [];
    const items = itemsRaw
      .map((it) => {
        const o = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
        const num = (v: unknown) => {
          const n = Number(v);
          return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
        };
        const str = (v: unknown, fb = "") => (typeof v === "string" ? v.slice(0, 80) : fb);
        const label = str(o.label).trim();
        if (!label) return null;
        return {
          label,
          emoji: str(o.emoji, "🍽️").trim() || "🍽️",
          serving: str(o.serving, "1 serving"),
          kcal: num(o.kcal),
          carbs: num(o.carbs),
          protein: num(o.protein),
          fat: num(o.fat),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const note = typeof obj.note === "string" ? obj.note.slice(0, 240) : "";
    return res.json({ items, note });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, "scan-food failed");
    return res.status(500).json({ error: `Scan failed: ${msg.slice(0, 180)}` });
  }
});

export default router;
