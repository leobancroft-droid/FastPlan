import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onResult: (product: ScannedProduct) => void;
}

export interface ScannedProduct {
  barcode: string;
  label: string;
  emoji: string;
  serving: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface OffNutriments {
  ["energy-kcal_100g"]?: number;
  ["energy-kcal_serving"]?: number;
  ["energy-kcal"]?: number;
  carbohydrates_100g?: number;
  carbohydrates_serving?: number;
  proteins_100g?: number;
  proteins_serving?: number;
  fat_100g?: number;
  fat_serving?: number;
}

interface OffProduct {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: OffNutriments;
  image_front_small_url?: string;
}

interface OffResponse {
  status: number;
  product?: OffProduct;
}

function emojiForCategory(name: string): string {
  const n = name.toLowerCase();
  if (/(milk|yogurt|cheese|dairy)/.test(n)) return "🥛";
  if (/(coffee|espresso)/.test(n)) return "☕";
  if (/(tea)/.test(n)) return "🍵";
  if (/(soda|cola|pepsi|sprite)/.test(n)) return "🥤";
  if (/(juice)/.test(n)) return "🧃";
  if (/(beer|ale|lager)/.test(n)) return "🍺";
  if (/(wine)/.test(n)) return "🍷";
  if (/(water)/.test(n)) return "💧";
  if (/(chocolat|candy|sweet)/.test(n)) return "🍫";
  if (/(cookie|biscuit)/.test(n)) return "🍪";
  if (/(chip|crisp)/.test(n)) return "🍟";
  if (/(bread|toast|baguette)/.test(n)) return "🍞";
  if (/(cereal|granola|oat)/.test(n)) return "🥣";
  if (/(yog)/.test(n)) return "🥛";
  if (/(bar)/.test(n)) return "🍫";
  if (/(pizza)/.test(n)) return "🍕";
  if (/(burger)/.test(n)) return "🍔";
  if (/(pasta|spaghetti|noodle)/.test(n)) return "🍝";
  if (/(rice)/.test(n)) return "🍚";
  if (/(salad)/.test(n)) return "🥗";
  if (/(soup)/.test(n)) return "🍲";
  if (/(fruit|apple|banana|berry)/.test(n)) return "🍎";
  return "🍽️";
}

export async function lookupBarcode(barcode: string): Promise<ScannedProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode
  )}.json?fields=product_name,product_name_en,brands,serving_size,serving_quantity,nutriments`;
  const res = await fetch(url, {
    headers: { "User-Agent": "AltFast/1.0 (replit)" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as OffResponse;
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  const name =
    (p.product_name_en && p.product_name_en.trim()) ||
    (p.product_name && p.product_name.trim()) ||
    "Scanned product";
  const brand = p.brands?.split(",")[0]?.trim();
  const label = brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} — ${name}` : name;

  const n = p.nutriments ?? {};
  let kcal = 0;
  let carbs = 0;
  let protein = 0;
  let fat = 0;
  let serving = "";

  if (typeof n["energy-kcal_serving"] === "number" && n["energy-kcal_serving"]! > 0) {
    kcal = Math.round(n["energy-kcal_serving"]!);
    carbs = Math.round(n.carbohydrates_serving ?? 0);
    protein = Math.round(n.proteins_serving ?? 0);
    fat = Math.round(n.fat_serving ?? 0);
    serving = p.serving_size?.trim() || (p.serving_quantity ? `${p.serving_quantity} g` : "1 serving");
  } else if (typeof n["energy-kcal_100g"] === "number" && n["energy-kcal_100g"]! > 0) {
    kcal = Math.round(n["energy-kcal_100g"]!);
    carbs = Math.round(n.carbohydrates_100g ?? 0);
    protein = Math.round(n.proteins_100g ?? 0);
    fat = Math.round(n.fat_100g ?? 0);
    serving = "100 g";
  } else if (typeof n["energy-kcal"] === "number" && n["energy-kcal"]! > 0) {
    kcal = Math.round(n["energy-kcal"]!);
    serving = p.serving_size?.trim() || "1 serving";
  } else {
    return null;
  }

  return {
    barcode,
    label: label.slice(0, 60),
    emoji: emojiForCategory(label),
    serving,
    kcal,
    carbs,
    protein,
    fat,
  };
}

export function BarcodeScannerModal({ visible, onClose, onResult }: Props) {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const handledRef = useRef<string | null>(null);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (visible) {
      handledRef.current = null;
      setScanning(true);
      setError(null);
      setManualMode(isWeb);
      setManualCode("");
    } else {
      setScanning(false);
    }
  }, [visible, isWeb]);

  async function ensurePermission() {
    if (isWeb) return false;
    if (permission?.granted) return true;
    const r = await requestPermission();
    return r.granted;
  }

  useEffect(() => {
    if (visible && !isWeb) {
      void ensurePermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function handleScanned(barcode: string) {
    if (handledRef.current === barcode || lookingUp) return;
    handledRef.current = barcode;
    setScanning(false);
    setLookingUp(true);
    setError(null);
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      const product = await lookupBarcode(barcode);
      if (!product) {
        setError(`No nutrition data found for ${barcode}.`);
        setLookingUp(false);
        // allow rescan
        setTimeout(() => {
          handledRef.current = null;
          setScanning(true);
        }, 1200);
        return;
      }
      onResult(product);
    } catch (e) {
      setError("Lookup failed. Check your connection and try again.");
      setLookingUp(false);
      setTimeout(() => {
        handledRef.current = null;
        setScanning(true);
      }, 1200);
    }
  }

  function handleManualSubmit() {
    const code = manualCode.replace(/\D/g, "");
    if (code.length < 6) {
      setError("Enter a valid barcode (digits only).");
      return;
    }
    void handleScanned(code);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={[styles.root, { backgroundColor: "#000" }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.headerBtn}>
            <Feather name="x" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Scan barcode</Text>
          <Pressable
            onPress={() => setManualMode((v) => !v)}
            hitSlop={12}
            style={styles.headerBtn}
          >
            <Feather name={manualMode ? "camera" : "edit-3"} size={22} color="#fff" />
          </Pressable>
        </View>

        {manualMode || isWeb ? (
          <View style={styles.manualWrap}>
            <Text style={styles.manualHint}>
              {isWeb
                ? "Camera scanning isn't available in the web preview. Enter a barcode to look up its nutrition."
                : "Type a barcode to look it up."}
            </Text>
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="e.g. 5449000000996"
              placeholderTextColor="#888"
              keyboardType="number-pad"
              style={styles.manualInput}
              autoFocus
            />
            <Pressable
              onPress={handleManualSubmit}
              disabled={lookingUp}
              style={({ pressed }) => [
                styles.manualBtn,
                { backgroundColor: colors.primary, opacity: lookingUp ? 0.6 : 1 },
                pressed && { opacity: 0.85 },
              ]}
            >
              {lookingUp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.manualBtnText}>Look up</Text>
              )}
            </Pressable>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Text style={styles.poweredBy}>Powered by Open Food Facts</Text>
          </View>
        ) : !permission ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={styles.permText}>
              We need camera access to scan barcodes.
            </Text>
            <Pressable
              onPress={() => void requestPermission()}
              style={({ pressed }) => [
                styles.manualBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.manualBtnText}>Grant access</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={
                scanning ? ({ data }) => void handleScanned(data) : undefined
              }
              barcodeScannerSettings={{
                barcodeTypes: [
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "code128",
                  "code39",
                  "qr",
                ],
              }}
            />
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.scanFrame} />
              <Text style={styles.overlayHint}>
                {lookingUp ? "Looking up product…" : "Align the barcode in the frame"}
              </Text>
              {error ? <Text style={styles.overlayError}>{error}</Text> : null}
            </View>
            {lookingUp && (
              <View style={styles.lookupOverlay} pointerEvents="none">
                <ActivityIndicator color="#fff" size="large" />
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 24,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 10,
  },
  headerBtn: { width: 32, alignItems: "center" },
  title: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  permText: { color: "#fff", fontSize: 15, textAlign: "center" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  scanFrame: {
    width: "85%",
    aspectRatio: 1.6,
    borderColor: "#fff",
    borderWidth: 3,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  overlayHint: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginTop: 16,
    textAlign: "center",
  },
  overlayError: {
    color: "#fca5a5",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  lookupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  manualWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 14,
  },
  manualHint: { color: "#bbb", fontSize: 14, lineHeight: 20 },
  manualInput: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  manualBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  manualBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  errorText: { color: "#fca5a5", fontSize: 13 },
  poweredBy: {
    color: "#666",
    fontSize: 11,
    marginTop: "auto",
    textAlign: "center",
    paddingBottom: 24,
  },
});
