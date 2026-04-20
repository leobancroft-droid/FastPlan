import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { FoodEntry, MealKey } from "./NutritionTracker";

interface ScannedItem {
  label: string;
  emoji: string;
  serving: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface ScanResponse {
  items: ScannedItem[];
  note?: string;
}

interface Props {
  onAdded?: () => void;
}

function getApiBase(): string {
  const domain =
    (process.env.EXPO_PUBLIC_DOMAIN as string | undefined) ?? "";
  if (!domain) return "/api";
  if (domain.startsWith("http")) return `${domain.replace(/\/$/, "")}/api`;
  return `https://${domain}/api`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pickMealForNow(): MealKey {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snacks";
}

const MEALS: { key: MealKey; label: string; emoji: string }[] = [
  { key: "breakfast", label: "Breakfast", emoji: "☕" },
  { key: "lunch", label: "Lunch", emoji: "🍝" },
  { key: "dinner", label: "Dinner", emoji: "🥗" },
  { key: "snacks", label: "Snacks", emoji: "🍎" },
];

export function AiFoodScanner({ onAdded }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [meal, setMeal] = useState<MealKey>(pickMealForNow());
  const [excluded, setExcluded] = useState<Set<number>>(new Set());

  function reset() {
    setImageUri(null);
    setImageBase64(null);
    setLoading(false);
    setResult(null);
    setExcluded(new Set());
    setMeal(pickMealForNow());
  }

  function handleClose() {
    if (loading) return;
    reset();
    setOpen(false);
  }

  async function handleOpen() {
    reset();
    setOpen(true);
  }

  async function withModalDismissed<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setOpen(false);
    await new Promise((r) => setTimeout(r, Platform.OS === "ios" ? 550 : 200));
    try {
      return await fn();
    } finally {
      setOpen(true);
    }
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera permission needed", "Allow camera access to scan a meal.");
      return;
    }
    try {
      const r = await withModalDismissed(() =>
        ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions
            ? ImagePicker.MediaTypeOptions.Images
            : ("images" as any),
          quality: 0.6,
          base64: true,
          allowsEditing: false,
        }),
      );
      if (r && !r.canceled && r.assets?.[0]) {
        await handleAssetSelected(r.assets[0]);
      }
    } catch (err) {
      Alert.alert(
        "Camera unavailable",
        err instanceof Error ? err.message : "Could not open the camera.",
      );
    }
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos permission needed", "Allow photo access to scan a meal.");
      return;
    }
    try {
      const r = await withModalDismissed(() =>
        ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions
            ? ImagePicker.MediaTypeOptions.Images
            : ("images" as any),
          quality: 0.6,
          base64: true,
          allowsEditing: false,
        }),
      );
      if (r && !r.canceled && r.assets?.[0]) {
        await handleAssetSelected(r.assets[0]);
      }
    } catch (err) {
      Alert.alert(
        "Library unavailable",
        err instanceof Error ? err.message : "Could not open your photo library.",
      );
    }
  }

  async function handleAssetSelected(asset: ImagePicker.ImagePickerAsset) {
    setImageUri(asset.uri);
    setResult(null);
    setExcluded(new Set());
    setLoading(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 768 } }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      if (manipulated.base64) {
        setImageBase64(manipulated.base64);
        await runScan(manipulated.base64, "image/jpeg");
        return;
      }
    } catch (err) {
      // fall back to the original asset if manipulation fails
    }
    if (asset.base64) {
      setImageBase64(asset.base64);
      await runScan(asset.base64, "image/jpeg");
    } else {
      setLoading(false);
      Alert.alert("Could not read photo", "Please try a different image.");
    }
  }

  async function runScan(base64: string, mimeType: string) {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(`${getApiBase()}/scan-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
        signal: controller.signal,
      });
      let data: ScanResponse | { error?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        const errMsg =
          (data && typeof data === "object" && "error" in data && data.error) ||
          `Server error (${res.status})`;
        throw new Error(String(errMsg));
      }
      const ok = (data && "items" in data ? data : { items: [], note: "" }) as ScanResponse;
      setResult(ok);
      if (Platform.OS !== "web" && ok.items.length > 0) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      const msg = isAbort
        ? "The scan timed out. Please try again with a clearer photo."
        : err instanceof Error
          ? err.message
          : "Could not analyze the photo.";
      Alert.alert("Scan failed", msg.length > 220 ? msg.slice(0, 220) + "…" : msg);
      setResult(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  function toggleItem(idx: number) {
    const next = new Set(excluded);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setExcluded(next);
  }

  async function handleAdd() {
    if (!result) return;
    const accepted = result.items.filter((_, i) => !excluded.has(i));
    if (accepted.length === 0) {
      handleClose();
      return;
    }
    const today = todayStr();
    try {
      const stored = await AsyncStorage.getItem("nutrition_log");
      const existing: FoodEntry[] = stored ? JSON.parse(stored) : [];
      const newEntries: FoodEntry[] = accepted.map((it, i) => ({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        label: it.label,
        emoji: it.emoji,
        meal,
        kcal: it.kcal,
        carbs: it.carbs,
        protein: it.protein,
        fat: it.fat,
        date: today,
        timestamp: new Date().toISOString(),
      }));
      const next = [...newEntries, ...existing].slice(0, 1000);
      await AsyncStorage.setItem("nutrition_log", JSON.stringify(next));
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onAdded?.();
      handleClose();
    } catch {
      Alert.alert("Error", "Could not save these foods.");
    }
  }

  const acceptedCount = result ? result.items.length - excluded.size : 0;
  const totals = result
    ? result.items.reduce(
        (acc, it, i) => {
          if (excluded.has(i)) return acc;
          acc.kcal += it.kcal;
          acc.carbs += it.carbs;
          acc.protein += it.protein;
          acc.fat += it.fat;
          return acc;
        },
        { kcal: 0, carbs: 0, protein: 0, fat: 0 }
      )
    : { kcal: 0, carbs: 0, protein: 0, fat: 0 };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.launcher,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && { opacity: 0.85 },
        ]}
      >
        <View style={[styles.launcherIcon, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="camera" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.launcherTitle, { color: colors.foreground }]}>
            Scan a meal with AI
          </Text>
          <Text style={[styles.launcherDesc, { color: colors.mutedForeground }]}>
            Snap a photo and we'll estimate the calories.
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.headerRow}>
              <Pressable onPress={handleClose} hitSlop={10}>
                <Feather name="x" size={22} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.title, { color: colors.foreground }]}>AI Food Scan</Text>
              <View style={{ width: 22 }} />
            </View>

            {!imageUri ? (
              <View style={styles.pickWrap}>
                <Text style={[styles.intro, { color: colors.mutedForeground }]}>
                  Take a photo of your meal or pick one from your library. We'll identify the
                  items and estimate the calories.
                </Text>
                <Pressable
                  onPress={pickFromCamera}
                  style={({ pressed }) => [
                    styles.bigBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Feather name="camera" size={20} color="#fff" />
                  <Text style={styles.bigBtnText}>Take photo</Text>
                </Pressable>
                <Pressable
                  onPress={pickFromLibrary}
                  style={({ pressed }) => [
                    styles.bigBtn,
                    { backgroundColor: colors.muted },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Feather name="image" size={20} color={colors.foreground} />
                  <Text style={[styles.bigBtnText, { color: colors.foreground }]}>
                    Choose from library
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                style={styles.resultScroll}
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

                {loading && (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                      Analyzing your meal…
                    </Text>
                  </View>
                )}

                {!loading && result && (
                  <>
                    {result.items.length === 0 ? (
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        {result.note || "No food detected. Try another photo."}
                      </Text>
                    ) : (
                      <>
                        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                          Add to
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.mealRow}
                        >
                          {MEALS.map((m) => {
                            const active = m.key === meal;
                            return (
                              <Pressable
                                key={m.key}
                                onPress={() => setMeal(m.key)}
                                style={({ pressed }) => [
                                  styles.mealChip,
                                  {
                                    backgroundColor: active ? colors.primary : colors.muted,
                                    borderColor: active ? colors.primary : colors.border,
                                  },
                                  pressed && { opacity: 0.85 },
                                ]}
                              >
                                <Text style={styles.mealEmoji}>{m.emoji}</Text>
                                <Text
                                  style={[
                                    styles.mealLabel,
                                    { color: active ? "#fff" : colors.foreground },
                                  ]}
                                >
                                  {m.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>

                        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                          Detected items
                        </Text>
                        {result.items.map((it, i) => {
                          const off = excluded.has(i);
                          return (
                            <Pressable
                              key={i}
                              onPress={() => toggleItem(i)}
                              style={({ pressed }) => [
                                styles.itemRow,
                                {
                                  backgroundColor: colors.muted,
                                  borderColor: off ? colors.border : colors.primary + "55",
                                  opacity: off ? 0.5 : 1,
                                },
                                pressed && { opacity: 0.85 },
                              ]}
                            >
                              <Text style={styles.itemEmoji}>{it.emoji}</Text>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[styles.itemLabel, { color: colors.foreground }]}
                                  numberOfLines={1}
                                >
                                  {it.label}
                                </Text>
                                <Text
                                  style={[styles.itemSub, { color: colors.mutedForeground }]}
                                  numberOfLines={1}
                                >
                                  {it.serving} · {it.carbs}c / {it.protein}p / {it.fat}f
                                </Text>
                              </View>
                              <Text style={[styles.itemKcal, { color: colors.foreground }]}>
                                {it.kcal} kcal
                              </Text>
                              <Feather
                                name={off ? "circle" : "check-circle"}
                                size={20}
                                color={off ? colors.mutedForeground : colors.primary}
                                style={{ marginLeft: 8 }}
                              />
                            </Pressable>
                          );
                        })}

                        {result.note ? (
                          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                            {result.note}
                          </Text>
                        ) : null}

                        <View
                          style={[
                            styles.totalsCard,
                            { backgroundColor: colors.muted, borderColor: colors.border },
                          ]}
                        >
                          <Text style={[styles.totalsLabel, { color: colors.mutedForeground }]}>
                            {acceptedCount} item{acceptedCount === 1 ? "" : "s"} selected
                          </Text>
                          <Text style={[styles.totalsKcal, { color: colors.foreground }]}>
                            {totals.kcal} kcal
                          </Text>
                          <Text style={[styles.totalsSub, { color: colors.mutedForeground }]}>
                            {totals.carbs}g carbs · {totals.protein}g protein · {totals.fat}g fat
                          </Text>
                        </View>
                      </>
                    )}

                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => {
                          setImageUri(null);
                          setImageBase64(null);
                          setResult(null);
                          setExcluded(new Set());
                        }}
                        style={({ pressed }) => [
                          styles.secondaryBtn,
                          { backgroundColor: colors.muted },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
                          Retake
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleAdd}
                        disabled={acceptedCount === 0}
                        style={({ pressed }) => [
                          styles.primaryBtn,
                          {
                            backgroundColor:
                              acceptedCount === 0 ? colors.muted : colors.primary,
                          },
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.primaryBtnText,
                            { color: acceptedCount === 0 ? colors.mutedForeground : "#fff" },
                          ]}
                        >
                          Add to log
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  launcher: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  launcherIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  launcherTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  launcherDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 28,
    maxHeight: "92%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  pickWrap: { gap: 12, paddingVertical: 12 },
  intro: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 4,
  },
  bigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bigBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  resultScroll: { maxHeight: "100%" },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    backgroundColor: "#000",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 24,
  },
  loadingText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  mealRow: { gap: 8, paddingVertical: 4 },
  mealChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  mealEmoji: { fontSize: 14 },
  mealLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemEmoji: { fontSize: 22 },
  itemLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  itemSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  itemKcal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  noteText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 4,
  },
  totalsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
    alignItems: "center",
    gap: 4,
  },
  totalsLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  totalsKcal: { fontSize: 24, fontFamily: "Inter_700Bold" },
  totalsSub: { fontSize: 12, fontFamily: "Inter_500Medium" },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  primaryBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
