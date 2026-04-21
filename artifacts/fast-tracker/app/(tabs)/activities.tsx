import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NutritionTracker } from "@/components/NutritionTracker";
import { AiFoodScanner } from "@/components/AiFoodScanner";
import { useColors } from "@/hooks/useColors";
import { fetchTodayHealthSnapshot, isHealthAvailable, requestHealthPermissions } from "@/lib/healthSync";

interface Activity {
  id: string;
  label: string;
  emoji: string;
  kcal: number;
  date: string;
  timestamp: string;
}

interface ActivityPreset {
  id: string;
  label: string;
  emoji: string;
  kcalPerMin: number;
}

const PRESETS: ActivityPreset[] = [
  { id: "walking", label: "Walking, general", emoji: "🚶", kcalPerMin: 4 },
  { id: "cycling", label: "Cycling, general", emoji: "🚴", kcalPerMin: 8 },
  { id: "running", label: "Running, general", emoji: "🏃", kcalPerMin: 10 },
  { id: "strength", label: "Strength Training", emoji: "💪", kcalPerMin: 6 },
  { id: "elliptical", label: "Elliptical, Crosstrainer", emoji: "🏋️", kcalPerMin: 7 },
  { id: "hiking", label: "Hiking, general", emoji: "🥾", kcalPerMin: 6 },
  { id: "yoga", label: "Yoga", emoji: "🧘", kcalPerMin: 3 },
  { id: "swimming", label: "Swimming, general", emoji: "🏊", kcalPerMin: 8 },
  { id: "aikido", label: "Aikido", emoji: "🥋", kcalPerMin: 7 },
  { id: "aqua_jogging", label: "Aqua Jogging", emoji: "🌊", kcalPerMin: 8 },
  { id: "basketball", label: "Basketball", emoji: "🏀", kcalPerMin: 8 },
  { id: "boxing", label: "Boxing", emoji: "🥊", kcalPerMin: 9 },
  { id: "dancing", label: "Dancing", emoji: "💃", kcalPerMin: 5 },
  { id: "football", label: "Football", emoji: "⚽", kcalPerMin: 8 },
  { id: "golf", label: "Golf", emoji: "⛳", kcalPerMin: 4 },
  { id: "pilates", label: "Pilates", emoji: "🤸", kcalPerMin: 4 },
  { id: "rowing", label: "Rowing", emoji: "🚣", kcalPerMin: 7 },
  { id: "skating", label: "Skating", emoji: "⛸️", kcalPerMin: 6 },
  { id: "skiing", label: "Skiing", emoji: "⛷️", kcalPerMin: 7 },
  { id: "tennis", label: "Tennis", emoji: "🎾", kcalPerMin: 7 },
];

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STEPS_GOAL = 10000;
const KCAL_PER_STEP = 0.04;
const MILES_PER_STEP = 0.0005;

export default function ActivitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [connected, setConnected] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [steps, setSteps] = useState(0);
  const [healthKcal, setHealthKcal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stepsEditOpen, setStepsEditOpen] = useState(false);
  const [nutritionRefresh, setNutritionRefresh] = useState(0);

  const todayStr = getTodayStr();

  useEffect(() => {
    (async () => {
      try {
        const [c, a, s, sDate, hk, hkDate] = await Promise.all([
          AsyncStorage.getItem("health_connected"),
          AsyncStorage.getItem("activities_log"),
          AsyncStorage.getItem("steps_today"),
          AsyncStorage.getItem("steps_date"),
          AsyncStorage.getItem("health_active_kcal_today"),
          AsyncStorage.getItem("health_active_kcal_date"),
        ]);
        setConnected(c === "true");
        if (a) setActivities(JSON.parse(a));
        if (s && sDate === todayStr) setSteps(Number(s) || 0);
        if (hk && hkDate === todayStr) setHealthKcal(Number(hk) || 0);
      } catch {}
      setLoaded(true);
    })();
  }, [todayStr]);

  async function persistConnected(v: boolean) {
    setConnected(v);
    await AsyncStorage.setItem("health_connected", String(v));
  }

  async function persistActivities(next: Activity[]) {
    setActivities(next);
    await AsyncStorage.setItem("activities_log", JSON.stringify(next.slice(0, 500)));
  }

  async function persistSteps(v: number) {
    setSteps(v);
    await AsyncStorage.multiSet([
      ["steps_today", String(v)],
      ["steps_date", todayStr],
    ]);
  }

  async function persistHealthKcal(v: number) {
    setHealthKcal(v);
    await AsyncStorage.multiSet([
      ["health_active_kcal_today", String(v)],
      ["health_active_kcal_date", todayStr],
    ]);
  }

  async function syncFromHealth(): Promise<boolean> {
    const snap = await fetchTodayHealthSnapshot();
    if (!snap) return false;
    await persistSteps(snap.steps);
    await persistHealthKcal(snap.activeKcal);
    return true;
  }

  useEffect(() => {
    if (!loaded || !connected) return;
    void syncFromHealth();
  }, [loaded, connected, todayStr]);

  useFocusEffect(
    useCallback(() => {
      if (!loaded || !connected) return;
      void syncFromHealth();
    }, [loaded, connected, todayStr])
  );

  async function handleConnect() {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (Platform.OS === "ios" && isHealthAvailable()) {
      const ok = await requestHealthPermissions();
      if (!ok) return;
      await persistConnected(true);
      await syncFromHealth();
      return;
    }
    await persistConnected(true);
    if (steps === 0) await persistSteps(8005);
    if (healthKcal === 0) await persistHealthKcal(285);
  }

  function handleAddActivity(preset: ActivityPreset, minutes: number) {
    const kcal = Math.round(preset.kcalPerMin * minutes);
    const next: Activity[] = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: preset.label,
        emoji: preset.emoji,
        kcal,
        date: todayStr,
        timestamp: new Date().toISOString(),
      },
      ...activities,
    ];
    persistActivities(next);
  }

  function handleRemoveActivity(id: string) {
    const next = activities.filter((a) => a.id !== id);
    persistActivities(next);
  }

  const todayActivities = useMemo(
    () => activities.filter((a) => a.date === todayStr),
    [activities, todayStr]
  );

  const distanceMi = (steps * MILES_PER_STEP).toFixed(1);
  const stepKcal = Math.round(steps * KCAL_PER_STEP);
  const stepsProgress = Math.min(1, steps / STEPS_GOAL);

  const topPadding = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 + 24 : 24;

  if (!loaded) return null;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding, paddingBottom: bottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Summary</Text>
      <NutritionTracker
        key={nutritionRefresh}
        burned={healthKcal + stepKcal + todayActivities.reduce((s, a) => s + a.kcal, 0)}
      />
      <AiFoodScanner onAdded={() => setNutritionRefresh((n) => n + 1)} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Steps</Text>
        {connected && (
          <Pressable onPress={() => setStepsEditOpen(true)} hitSlop={10}>
            <Text style={[styles.moreBtn, { color: colors.primary }]}>Add</Text>
          </Pressable>
        )}
      </View>

      {!connected ? (
        <View style={[styles.connectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.connectIcon, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="heart" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.connectTitle, { color: colors.foreground }]}>
            Connect to {Platform.OS === "android" ? "Health Connect" : "Apple Health"}
          </Text>
          <Text style={[styles.connectDesc, { color: colors.mutedForeground }]}>
            Sync your steps, distance, and calories burned to see your activity automatically.
          </Text>
          <View style={styles.permissionList}>
            <PermissionRow icon="activity" label="Steps" colors={colors} />
            <PermissionRow icon="map" label="Walking + Running Distance" colors={colors} />
            <PermissionRow icon="zap" label="Active Energy" colors={colors} />
          </View>
          <Pressable
            onPress={handleConnect}
            style={({ pressed }) => [
              styles.connectBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.connectBtnText}>Connect</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              await handleConnect();
              if (Platform.OS === "ios") {
                Linking.openURL("x-apple-health://").catch(() => {
                  Linking.openSettings().catch(() => {});
                });
              } else {
                Linking.openSettings().catch(() => {});
              }
            }}
            style={({ pressed }) => [
              styles.settingsBtn,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Feather name="settings" size={16} color={colors.foreground} />
            <Text style={[styles.settingsBtnText, { color: colors.foreground }]}>
              Open Health App
            </Text>
          </Pressable>
          <Text style={[styles.connectHint, { color: colors.mutedForeground }]}>
            You can change this any time in your device settings.
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.stepsValue, { color: colors.foreground }]}>
              {steps.toLocaleString()} steps
            </Text>
            <Text style={[styles.stepsSub, { color: colors.mutedForeground }]}>
              {distanceMi} mi, {stepKcal} kcal
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stepsProgress * 100}%`, backgroundColor: "#ec4899" },
                ]}
              />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Add Workout</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tilesScroll}
          >
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={[styles.tileIcon, { borderColor: colors.foreground + "60" }]}>
                <Feather name="plus" size={22} color={colors.foreground} />
              </View>
              <Text style={[styles.tileLabel, { color: colors.foreground }]}>Add</Text>
            </Pressable>

            {todayActivities.map((a) => (
              <Pressable
                key={a.id}
                onLongPress={() => {
                  Alert.alert("Remove activity", `Remove ${a.label}?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: () => handleRemoveActivity(a.id) },
                  ]);
                }}
                style={({ pressed }) => [
                  styles.tile,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.tileEmoji}>{a.emoji}</Text>
                <Text style={[styles.tileLabel, { color: colors.foreground }]} numberOfLines={1}>
                  {a.kcal} kcal
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={() => {
              Alert.alert("Disconnect health data?", "Your manually logged activities will remain.", [
                { text: "Cancel", style: "cancel" },
                { text: "Disconnect", style: "destructive", onPress: () => persistConnected(false) },
              ]);
            }}
            style={styles.disconnectBtn}
          >
            <Text style={[styles.disconnectText, { color: colors.mutedForeground }]}>
              Disconnect health data
            </Text>
          </Pressable>
        </>
      )}

      <ActivityPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddActivity}
      />

      <StepsEditor
        open={stepsEditOpen}
        onClose={() => setStepsEditOpen(false)}
        steps={steps}
        onSave={persistSteps}
      />
    </ScrollView>
  );
}

function PermissionRow({ icon, label, colors }: { icon: keyof typeof Feather.glyphMap; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.permRow}>
      <View style={[styles.permIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={14} color={colors.foreground} />
      </View>
      <Text style={[styles.permLabel, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

interface PickerProps {
  open: boolean;
  onClose: () => void;
  onAdd: (preset: ActivityPreset, minutes: number) => void;
}

function ActivityPicker({ open, onClose, onAdd }: PickerProps) {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ActivityPreset | null>(null);
  const [minutes, setMinutes] = useState("30");

  const filtered = useMemo(() => {
    if (!search.trim()) return PRESETS;
    const q = search.toLowerCase();
    return PRESETS.filter((p) => p.label.toLowerCase().includes(q));
  }, [search]);

  const frequent = PRESETS.slice(0, 8);

  function reset() {
    setSearch("");
    setSelected(null);
    setMinutes("30");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleConfirm() {
    if (!selected) return;
    const m = Math.max(1, Math.min(600, Number(minutes) || 30));
    onAdd(selected, m);
    reset();
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.sheetHandle} />

          <View style={styles.pickerHeader}>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Feather name="chevron-left" size={22} color={colors.primary} />
            </Pressable>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
              {selected ? "Set duration" : "Add activity"}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          {selected ? (
            <View style={styles.durationWrap}>
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedEmoji}>{selected.emoji}</Text>
                <Text style={[styles.selectedLabel, { color: colors.foreground }]}>{selected.label}</Text>
              </View>
              <Text style={[styles.durationLabel, { color: colors.mutedForeground }]}>Duration (minutes)</Text>
              <TextInput
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                style={[styles.minutesInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                maxLength={4}
              />
              <Text style={[styles.durationHint, { color: colors.mutedForeground }]}>
                ≈ {Math.round(selected.kcalPerMin * (Number(minutes) || 0))} kcal
              </Text>
              <Pressable
                onPress={handleConfirm}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.confirmBtnText}>Add Activity</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={[styles.searchWrap, { backgroundColor: colors.muted }]}>
                <Feather name="search" size={16} color={colors.mutedForeground} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search for activity"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                />
              </View>

              <ScrollView style={styles.pickerScroll} keyboardShouldPersistTaps="handled">
                {!search.trim() && (
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                    Frequently Added
                  </Text>
                )}
                {(search.trim() ? filtered : frequent).map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelected(p)}
                    style={({ pressed }) => [
                      styles.presetRow,
                      { borderBottomColor: colors.border },
                      pressed && { backgroundColor: colors.muted },
                    ]}
                  >
                    <Text style={styles.presetEmoji}>{p.emoji}</Text>
                    <Text style={[styles.presetLabel, { color: colors.foreground }]}>{p.label}</Text>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </Pressable>
                ))}

                {!search.trim() && (
                  <>
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
                      All Activities
                    </Text>
                    {PRESETS.slice(8).map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => setSelected(p)}
                        style={({ pressed }) => [
                          styles.presetRow,
                          { borderBottomColor: colors.border },
                          pressed && { backgroundColor: colors.muted },
                        ]}
                      >
                        <Text style={styles.presetEmoji}>{p.emoji}</Text>
                        <Text style={[styles.presetLabel, { color: colors.foreground }]}>{p.label}</Text>
                        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                      </Pressable>
                    ))}
                  </>
                )}
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface StepsEditorProps {
  open: boolean;
  onClose: () => void;
  steps: number;
  onSave: (n: number) => void;
}

function StepsEditor({ open, onClose, steps, onSave }: StepsEditorProps) {
  const colors = useColors();
  const [draft, setDraft] = useState(String(steps));

  useEffect(() => {
    if (open) setDraft(String(steps));
  }, [open, steps]);

  function handleSave() {
    const n = Math.max(0, Math.min(200000, Number(draft) || 0));
    onSave(n);
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.smallSheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation?.()}>
          <Text style={[styles.smallSheetTitle, { color: colors.foreground }]}>Edit steps</Text>
          <Text style={[styles.smallSheetDesc, { color: colors.mutedForeground }]}>
            Override today's step count.
          </Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            keyboardType="number-pad"
            style={[styles.minutesInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            maxLength={6}
          />
          <View style={styles.smallSheetActions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.smallSheetBtn,
                { backgroundColor: colors.muted },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.smallSheetBtnText, { color: colors.foreground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.smallSheetBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.smallSheetBtnText, { color: "#fff" }]}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  sectionTitle: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4, marginBottom: 12 },
  moreBtn: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  connectCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  connectIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  connectTitle: { fontSize: 19, fontFamily: "Inter_700Bold", textAlign: "center" },
  connectDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  permissionList: {
    alignSelf: "stretch",
    gap: 10,
    marginVertical: 12,
  },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  permIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  permLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  connectBtn: {
    alignSelf: "stretch",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  connectBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  connectHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  settingsBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  settingsBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  stepsCard: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  stepsValue: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  stepsSub: { fontSize: 15, fontFamily: "Inter_500Medium" },
  progressTrack: {
    alignSelf: "stretch",
    height: 10,
    borderRadius: 5,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  tilesScroll: {
    gap: 10,
    paddingVertical: 4,
    paddingRight: 4,
  },
  tile: {
    width: 86,
    height: 100,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 6,
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tileEmoji: { fontSize: 30, lineHeight: 36 },
  tileLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  disconnectBtn: { alignItems: "center", paddingVertical: 12, marginTop: 8 },
  disconnectText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    gap: 14,
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#999",
    opacity: 0.3,
    alignSelf: "center",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  pickerScroll: { maxHeight: 460 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  presetEmoji: { fontSize: 22 },
  presetLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  durationWrap: { gap: 12, paddingVertical: 8 },
  selectedSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
  },
  selectedEmoji: { fontSize: 32 },
  selectedLabel: { fontSize: 18, fontFamily: "Inter_700Bold" },
  durationLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: 8,
  },
  minutesInput: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: "center",
  },
  durationHint: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  smallSheet: {
    margin: 20,
    borderRadius: 20,
    padding: 22,
    gap: 12,
    alignSelf: "center",
    minWidth: 280,
  },
  smallSheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  smallSheetDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  smallSheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  smallSheetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  smallSheetBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
