export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type FastStructure = "modified" | "hybrid" | "full";
export type Tone = "supportive" | "balanced" | "strict";

export interface UserProfile {
  difficulty: Difficulty;
  structure: FastStructure;
  structureLabel: string;
  structureDetail: string;
  eatingWindow: string;
  eatingWindowDetail: string;
  tone: Tone;
  toneLabel: string;
  notificationStyle: string;
  primaryGoal: string;
  encouragement: string;
}

type Answers = Record<string, string | string[]>;

const EXPERIENCE_SCORE: Record<string, number> = {
  Never: 0,
  "Tried it a few times": 1,
  "Done it consistently": 2,
  "Very experienced": 3,
};

const HUNGER_SCORE: Record<string, number> = {
  "I struggle with hunger": 0,
  "I can manage it": 1,
  "I'm comfortable being hungry": 2,
  "Hunger doesn't bother me": 3,
};

const EATING_SCORE: Record<string, number> = {
  "3+ meals + snacks": 0,
  "3 meals, no snacks": 1,
  "2 meals a day": 2,
  "Already doing some fasting": 3,
};

const STYLE_SCORE: Record<string, number> = {
  "Gentle (ease into it)": 0,
  "Balanced (challenge but manageable)": 2,
  "Aggressive (results-focused)": 3,
};

function asString(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? v[0] ?? "" : v;
}

export function derivePersonalProfile(answers: Answers | null): UserProfile | null {
  if (!answers) return null;

  const experience = asString(answers.experience);
  const hunger = asString(answers.hungerComfort);
  const eatingStyle = asString(answers.eatingStyle);
  const fastingStyle = asString(answers.fastingStyle);
  const eatingTime = asString(answers.eatingTime);
  const structurePref = asString(answers.structure);
  const goal = asString(answers.goal);

  const score =
    (EXPERIENCE_SCORE[experience] ?? 0) +
    (HUNGER_SCORE[hunger] ?? 0) +
    (EATING_SCORE[eatingStyle] ?? 0) +
    (STYLE_SCORE[fastingStyle] ?? 0);

  let difficulty: Difficulty;
  if (score <= 3) difficulty = "Beginner";
  else if (score <= 7) difficulty = "Intermediate";
  else difficulty = "Advanced";

  let structure: FastStructure;
  let structureLabel: string;
  let structureDetail: string;

  if (difficulty === "Beginner") {
    structure = "modified";
    structureLabel = "Modified Fast (≤500 cal)";
    structureDetail =
      "On fast days, eat one small meal up to 500 calories. Stay hydrated with water, tea, or black coffee.";
  } else if (difficulty === "Intermediate") {
    structure = "hybrid";
    structureLabel = "Hybrid ADF";
    structureDetail =
      "Alternate between full water fasts and modified ≤500 cal days. Listen to your body and adjust weekly.";
  } else {
    structure = "full";
    structureLabel = "Full Fast (water only)";
    structureDetail =
      "On fast days, water, tea, and black coffee only. No calories until your next eating day begins.";
  }

  let eatingWindow: string;
  let eatingWindowDetail: string;
  switch (eatingTime) {
    case "Morning + afternoon":
      eatingWindow = "8:00 AM – 4:00 PM";
      eatingWindowDetail = "Front-load your calories. Lighter dinner or skip it on eating days.";
      break;
    case "Afternoon + evening":
      eatingWindow = "12:00 PM – 8:00 PM";
      eatingWindowDetail = "Classic 8-hour window. Skip breakfast, lunch around noon, finish by 8 PM.";
      break;
    case "Evening only":
      eatingWindow = "5:00 PM – 9:00 PM";
      eatingWindowDetail = "Compressed window. One large meal in the evening, plus a small snack.";
      break;
    case "Flexible":
    default:
      eatingWindow = "Flexible 8-hour window";
      eatingWindowDetail = "Pick the same 8-hour window each eating day to build rhythm.";
      break;
  }

  let tone: Tone;
  if (
    structurePref === "I want strict guidance" ||
    fastingStyle === "Aggressive (results-focused)"
  ) {
    tone = "strict";
  } else if (
    structurePref === "Some structure, some flexibility" ||
    fastingStyle === "Balanced (challenge but manageable)"
  ) {
    tone = "balanced";
  } else {
    tone = "supportive";
  }

  let toneLabel: string;
  let notificationStyle: string;
  switch (tone) {
    case "strict":
      toneLabel = "Strict & Direct";
      notificationStyle = "Firm reminders. No excuses. Daily accountability nudges.";
      break;
    case "balanced":
      toneLabel = "Balanced Coach";
      notificationStyle = "Friendly reminders with clear goals. Celebrates wins, flags slips.";
      break;
    case "supportive":
    default:
      toneLabel = "Warm & Supportive";
      notificationStyle = "Gentle, encouraging messages. Focus on progress, not perfection.";
      break;
  }

  const encouragement = buildEncouragement(goal, difficulty, tone);

  return {
    difficulty,
    structure,
    structureLabel,
    structureDetail,
    eatingWindow,
    eatingWindowDetail,
    tone,
    toneLabel,
    notificationStyle,
    primaryGoal: goal || "Build a healthier rhythm",
    encouragement,
  };
}

function buildEncouragement(goal: string, difficulty: Difficulty, tone: Tone): string {
  const goalPhrase = goal ? goal.toLowerCase() : "your goal";
  if (tone === "strict") {
    return `${difficulty} plan locked in. Show up every day for ${goalPhrase}.`;
  }
  if (tone === "balanced") {
    return `Your ${difficulty.toLowerCase()} plan is ready. Steady progress beats perfection.`;
  }
  return `Take it one day at a time. Your ${difficulty.toLowerCase()} plan supports ${goalPhrase}.`;
}
