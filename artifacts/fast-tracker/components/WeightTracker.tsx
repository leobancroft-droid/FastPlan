import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFasting, getTodayStr, getDiffDays } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

const KG_PER_LB = 0.45359237;
const STEP_KG = 0.5;
const KCAL_PER_KG = 7700;
const TIMEFRAME_OPTIONS: { label: string; weeks: number }[] = [
  { label: "4 wks", weeks: 4 },
  { label: "8 wks", weeks: 8 },
  { label: "12 wks", weeks: 12 },
  { label: "26 wks", weeks: 26 },
];

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTargetDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function kgToDisplay(kg: number, unit: "kg" | "lb"): number {
  return unit === "kg" ? kg : kg / KG_PER_LB;
}

function displayToKg(value: number, unit: "kg" | "lb"): number {
  return unit === "kg" ? value : value * KG_PER_LB;
}

function formatVal(v: number): string {
  return v.toFixed(1);
}

interface WeightTrackerProps {
  onCalorieGoalChange?: (kcal: number) => void;
}

export function WeightTracker({ onCalorieGoalChange }: WeightTrackerProps = {}) {
  const colors = useColors();
  const { weightKg, weightGoalKg, weightUnit, weightTargetDate, setWeightKg, setWeightGoalKg, setWeightUnit, setWeightTargetDate } = useFasting();
  const [editorOpen, setEditorOpen] = useState(false);

  const hasWeight = weightKg !== null;
  const currentDisplay = hasWeight ? formatVal(kgToDisplay(weightKg!, weightUnit)) : "—";
  const goalDisplay = weightGoalKg !== null ? formatVal(kgToDisplay(weightGoalKg, weightUnit)) : null;

  const diffKg = hasWeight && weightGoalKg !== null ? weightKg! - weightGoalKg : null;
  const isLossGoal = diffKg !== null && diffKg > 0;
  const isGainGoal = diffKg !== null && diffKg < 0;
  const reached = diffKg !== null && Math.abs(diffKg) < 0.1;

  const todayStr = getTodayStr();
  const daysToTarget = weightTargetDate ? Math.max(1, getDiffDays(todayStr, weightTargetDate)) : null;
  const targetInPast = weightTargetDate ? getDiffDays(todayStr, weightTargetDate) <= 0 : false;
  const maintenanceKcal = hasWeight ? Math.round(weightKg! * 30) : null;
  let suggestedKcal: number | null = null;
  if (
    !reached &&
    diffKg !== null &&
    daysToTarget !== null &&
    !targetInPast &&
    maintenanceKcal !== null
  ) {
    const dailyDelta = (diffKg * KCAL_PER_KG) / daysToTarget;
    const raw = maintenanceKcal - dailyDelta;
    suggestedKcal = Math.max(1200, Math.min(4000, Math.round(raw / 10) * 10));
  }
  const weeklyChangeKg =
    diffKg !== null && daysToTarget !== null && !targetInPast
      ? (diffKg / daysToTarget) * 7
      : null;

  async function adjust(deltaKg: number) {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    const base = weightKg ?? weightGoalKg ?? 70;
    const next = Math.max(20, Math.min(300, base + deltaKg));
    await setWeightKg(Math.round(next * 10) / 10);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBubble, { backgroundColor: colors.success + "22" }]}>
            <Feather name="trending-down" size={16} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Weight</Text>
        </View>
        <Pressable onPress={() => setEditorOpen(true)} hitSlop={10}>
          <Text style={[styles.moreBtn, { color: colors.success }]}>Target</Text>
        </Pressable>
      </View>

      <Text style={[styles.goalLabel, { color: colors.mutedForeground }]}>
        {goalDisplay ? `Goal: ${goalDisplay} ${weightUnit}` : "No goal set — tap More"}
      </Text>

      <View style={styles.row}>
        <Pressable
          onPress={() => adjust(-STEP_KG)}
          disabled={!hasWeight && weightGoalKg === null}
          style={[styles.iconBtn, { borderColor: colors.border, opacity: !hasWeight && weightGoalKg === null ? 0.4 : 1 }]}
        >
          <Feather name="minus" size={20} color={colors.foreground} />
        </Pressable>

        <Pressable onPress={() => setEditorOpen(true)} style={styles.amountWrap}>
          <Text style={[styles.amount, { color: colors.foreground }]}>
            {currentDisplay}
            <Text style={[styles.amountUnit, { color: colors.mutedForeground }]}> {weightUnit}</Text>
          </Text>
        </Pressable>

        <Pressable
          onPress={() => adjust(STEP_KG)}
          style={[styles.iconBtn, { borderColor: colors.border }]}
        >
          <Feather name="plus" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {diffKg !== null && (
        <Text style={[styles.diff, { color: reached ? colors.success : colors.mutedForeground }]}>
          {reached
            ? "Goal reached"
            : `${formatVal(Math.abs(kgToDisplay(Math.abs(diffKg), weightUnit)))} ${weightUnit} ${isLossGoal ? "to lose" : isGainGoal ? "to gain" : ""}`}
        </Text>
      )}

      {!reached && weightTargetDate && daysToTarget !== null && !targetInPast && (
        <View style={[styles.planBox, { backgroundColor: colors.success + "12", borderColor: colors.success + "33" }]}>
          <View style={styles.planRow}>
            <Feather name="calendar" size={13} color={colors.success} />
            <Text style={[styles.planRowText, { color: colors.foreground }]}>
              Reach by {formatTargetDate(weightTargetDate)}
            </Text>
            <Text style={[styles.planRowMeta, { color: colors.mutedForeground }]}>
              · {daysToTarget}d
            </Text>
          </View>
          {suggestedKcal !== null && (
            <View style={styles.planRow}>
              <Feather name="target" size={13} color={colors.success} />
              <Text style={[styles.planRowText, { color: colors.foreground }]}>
                Eat ~{suggestedKcal} kcal/day
              </Text>
              {weeklyChangeKg !== null && (
                <Text style={[styles.planRowMeta, { color: colors.mutedForeground }]}>
                  · {formatVal(Math.abs(kgToDisplay(Math.abs(weeklyChangeKg), weightUnit)))} {weightUnit}/wk
                </Text>
              )}
            </View>
          )}
        </View>
      )}
      {!reached && weightTargetDate && targetInPast && (
        <Text style={[styles.diff, { color: colors.mutedForeground }]}>Target date passed — set a new one</Text>
      )}

      <WeightEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        weightKg={weightKg}
        goalKg={weightGoalKg}
        unit={weightUnit}
        targetDate={weightTargetDate}
        onSave={async (curKg, goalKg, unit, targetDate) => {
          await setWeightUnit(unit);
          await setWeightKg(curKg);
          await setWeightGoalKg(goalKg);
          await setWeightTargetDate(targetDate);

          if (curKg !== null && goalKg !== null && targetDate !== null) {
            const days = Math.max(1, getDiffDays(getTodayStr(), targetDate));
            if (days > 0) {
              const diff = curKg - goalKg;
              const maint = Math.round(curKg * 30);
              const dailyDelta = (diff * KCAL_PER_KG) / days;
              const raw = maint - dailyDelta;
              const clamped = Math.max(1200, Math.min(4000, Math.round(raw / 10) * 10));
              await AsyncStorage.setItem("calorie_goal", String(clamped));
              onCalorieGoalChange?.(clamped);
            }
          }
        }}
      />
    </View>
  );
}

interface WeightEditorProps {
  open: boolean;
  onClose: () => void;
  weightKg: number | null;
  goalKg: number | null;
  unit: "kg" | "lb";
  targetDate: string | null;
  onSave: (curKg: number | null, goalKg: number | null, unit: "kg" | "lb", targetDate: string | null) => Promise<void>;
}

function WeightEditor({ open, onClose, weightKg, goalKg, unit, targetDate, onSave }: WeightEditorProps) {
  const colors = useColors();
  const [unitDraft, setUnitDraft] = useState<"kg" | "lb">(unit);
  const [curStr, setCurStr] = useState("");
  const [goalStr, setGoalStr] = useState("");
  const [targetDraft, setTargetDraft] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUnitDraft(unit);
    setCurStr(weightKg !== null ? formatVal(kgToDisplay(weightKg, unit)) : "");
    setGoalStr(goalKg !== null ? formatVal(kgToDisplay(goalKg, unit)) : "");
    setTargetDraft(targetDate);
  }, [open, weightKg, goalKg, unit, targetDate]);

  function selectedWeeks(): number | null {
    if (!targetDraft) return null;
    const days = getDiffDays(getTodayStr(), targetDraft);
    if (days <= 0) return null;
    const wk = Math.round(days / 7);
    return TIMEFRAME_OPTIONS.some((o) => o.weeks === wk) ? wk : null;
  }
  const activeWeeks = selectedWeeks();

  function pickTimeframe(weeks: number) {
    setTargetDraft(addDaysStr(getTodayStr(), weeks * 7));
  }

  const curNum = parseFloat(curStr);
  const goalNum = parseFloat(goalStr);
  const previewKcal = (() => {
    if (isNaN(curNum) || isNaN(goalNum) || !targetDraft) return null;
    const curKg = displayToKg(curNum, unitDraft);
    const goalKgVal = displayToKg(goalNum, unitDraft);
    const days = getDiffDays(getTodayStr(), targetDraft);
    if (days <= 0) return null;
    const diff = curKg - goalKgVal;
    const maint = Math.round(curKg * 30);
    const dailyDelta = (diff * KCAL_PER_KG) / days;
    const raw = maint - dailyDelta;
    return Math.max(1200, Math.min(4000, Math.round(raw / 10) * 10));
  })();

  function changeUnit(next: "kg" | "lb") {
    if (next === unitDraft) return;
    const cur = parseFloat(curStr);
    const goal = parseFloat(goalStr);
    if (!isNaN(cur)) {
      const kg = displayToKg(cur, unitDraft);
      setCurStr(formatVal(kgToDisplay(kg, next)));
    }
    if (!isNaN(goal)) {
      const kg = displayToKg(goal, unitDraft);
      setGoalStr(formatVal(kgToDisplay(kg, next)));
    }
    setUnitDraft(next);
  }

  async function handleSave() {
    const cur = parseFloat(curStr);
    const goal = parseFloat(goalStr);
    const curKg = isNaN(cur) ? null : Math.round(displayToKg(cur, unitDraft) * 10) / 10;
    const goalKgVal = isNaN(goal) ? null : Math.round(displayToKg(goal, unitDraft) * 10) / 10;
    await onSave(curKg, goalKgVal, unitDraft, targetDraft);
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%" }}
          pointerEvents="box-none"
        >
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Update Weight</Text>

          <View style={[styles.unitToggle, { backgroundColor: colors.muted }]}>
            {(["kg", "lb"] as const).map((u) => (
              <Pressable
                key={u}
                onPress={() => changeUnit(u)}
                style={[styles.unitBtn, unitDraft === u && { backgroundColor: colors.card }]}
              >
                <Text style={[styles.unitBtnText, { color: unitDraft === u ? colors.foreground : colors.mutedForeground }]}>
                  {u.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Current weight</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                value={curStr}
                onChangeText={setCurStr}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
              />
              <Text style={[styles.inputUnit, { color: colors.mutedForeground }]}>{unitDraft}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Goal weight</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                value={goalStr}
                onChangeText={setGoalStr}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
              />
              <Text style={[styles.inputUnit, { color: colors.mutedForeground }]}>{unitDraft}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Reach goal in</Text>
            <View style={styles.timeframeRow}>
              {TIMEFRAME_OPTIONS.map((opt) => {
                const active = activeWeeks === opt.weeks;
                return (
                  <Pressable
                    key={opt.weeks}
                    onPress={() => pickTimeframe(opt.weeks)}
                    style={[
                      styles.timeframeBtn,
                      { backgroundColor: active ? colors.success : colors.muted, borderColor: active ? colors.success : colors.border },
                    ]}
                  >
                    <Text style={[styles.timeframeText, { color: active ? "#fff" : colors.foreground }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
              {targetDraft && (
                <Pressable onPress={() => setTargetDraft(null)} style={[styles.timeframeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
            {targetDraft && (
              <Text style={[styles.timeframeHint, { color: colors.mutedForeground }]}>
                Target date: {formatTargetDate(targetDraft)}
              </Text>
            )}
            {previewKcal !== null && (
              <Text style={[styles.timeframeHint, { color: colors.success, fontFamily: "Inter_700Bold" }]}>
                Suggested: ~{previewKcal} kcal/day
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.cancelBtn, { backgroundColor: colors.muted }]} onPress={onClose}>
              <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.success }]} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  moreBtn: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  goalLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  amountWrap: {
    flex: 1,
    alignItems: "center",
  },
  amount: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  amountUnit: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  diff: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginTop: 2,
  },
  planBox: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  planRowText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  planRowMeta: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  timeframeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeframeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timeframeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  timeframeHint: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#999",
    opacity: 0.3,
    marginBottom: 4,
    alignSelf: "center",
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
    alignSelf: "flex-start",
  },
  unitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
  },
  unitBtnText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  inputUnit: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
