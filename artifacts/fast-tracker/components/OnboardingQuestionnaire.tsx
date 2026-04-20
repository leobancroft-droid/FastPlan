import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

const EAT_MONSTER = require("@/assets/images/eat-monster.png");
const FAST_MONSTER = require("@/assets/images/fast-monster.png");
const COMPLETE_MONSTER = require("@/assets/images/complete-monster.png");
const SKIPPED_MONSTER = require("@/assets/images/skipped-monster.png");

export type OnboardingAnswers = Record<string, string | string[]>;

type QuestionType = "single" | "multi";

interface Question {
  id: string;
  emoji: string;
  title: string;
  type: QuestionType;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    id: "goal",
    emoji: "target",
    title: "What's your main goal?",
    type: "single",
    options: [
      "Lose weight",
      "Improve metabolic health",
      "Boost energy & focus",
      "Build discipline",
      "Try fasting for the first time",
    ],
  },
  {
    id: "experience",
    emoji: "clock",
    title: "Have you fasted before?",
    type: "single",
    options: ["Never", "Tried it a few times", "Done it consistently", "Very experienced"],
  },
  {
    id: "lifestyle",
    emoji: "activity",
    title: "What best describes your current lifestyle?",
    type: "single",
    options: [
      "Sedentary (little movement)",
      "Lightly active (walks, occasional exercise)",
      "Active (gym 3–5x/week)",
      "Very active (daily training/physical job)",
    ],
  },
  {
    id: "eatingStyle",
    emoji: "coffee",
    title: "How do you usually eat now?",
    type: "single",
    options: ["3+ meals + snacks", "3 meals, no snacks", "2 meals a day", "Already doing some fasting"],
  },
  {
    id: "hungerComfort",
    emoji: "heart",
    title: "How do you feel about hunger?",
    type: "single",
    options: [
      "I struggle with hunger",
      "I can manage it",
      "I'm comfortable being hungry",
      "Hunger doesn't bother me",
    ],
  },
  {
    id: "challenge",
    emoji: "alert-circle",
    title: "What's your biggest challenge?",
    type: "single",
    options: ["Cravings", "Consistency", "Energy dips", "Social eating", "Motivation"],
  },
  {
    id: "fastingStyle",
    emoji: "sliders",
    title: "Preferred fasting style?",
    type: "single",
    options: ["Gentle (ease into it)", "Balanced (challenge but manageable)", "Aggressive (results-focused)"],
  },
  {
    id: "eatingTime",
    emoji: "sun",
    title: "When would you prefer to eat on eating days?",
    type: "single",
    options: ["Morning + afternoon", "Afternoon + evening", "Evening only", "Flexible"],
  },
  {
    id: "structure",
    emoji: "grid",
    title: "How important is structure?",
    type: "single",
    options: [
      "I want strict guidance",
      "Some structure, some flexibility",
      "Mostly flexible",
      "Fully flexible",
    ],
  },
  {
    id: "daysPerWeek",
    emoji: "calendar",
    title: "How many days per week can you commit?",
    type: "single",
    options: ["2–3 days", "3–4 days", "5+ days", "I'll follow whatever works best"],
  },
  {
    id: "conditions",
    emoji: "check-square",
    title: "Any of these apply to you?",
    type: "multi",
    options: ["High stress lifestyle", "Poor sleep", "Frequent travel", "Shift work", "None"],
  },
  {
    id: "success",
    emoji: "award",
    title: "What would success look like in 30 days?",
    type: "single",
    options: [
      "Noticeable weight loss",
      "Better control over eating",
      "More energy",
      "Improved routine",
      "Just getting started",
    ],
  },
];

interface OnboardingQuestionnaireProps {
  visible: boolean;
  onComplete: (answers: OnboardingAnswers) => void;
}

export function OnboardingQuestionnaire({ visible, onComplete }: OnboardingQuestionnaireProps) {
  const c = useColors();
  const colors = {
    background: c.fastBg,
    card: c.fastCard,
    foreground: c.fastText,
    mutedForeground: c.fastMuted,
    border: c.border,
    muted: c.muted,
    primary: c.success,
  };
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [timelineWeeks, setTimelineWeeks] = useState<number | null>(null);

  const TIMELINE_OPTIONS: { label: string; weeks: number }[] = [
    { label: "1 month", weeks: 4 },
    { label: "2 months", weeks: 8 },
    { label: "3 months", weeks: 12 },
    { label: "6 months", weeks: 26 },
    { label: "1 year", weeks: 52 },
  ];

  const total = QUESTIONS.length + 2;
  const isWeightStep = step === QUESTIONS.length;
  const isTimelineStep = step === QUESTIONS.length + 1;
  const question = isWeightStep || isTimelineStep ? null : QUESTIONS[step];
  const progress = ((step + 1) / total) * 100;

  const currentAnswer = question ? answers[question.id] : undefined;
  const curNum = parseFloat(currentWeight);
  const tgtNum = parseFloat(targetWeight);
  const weightsValid = !isNaN(curNum) && curNum > 0 && !isNaN(tgtNum) && tgtNum > 0;
  const isAnswered = isWeightStep
    ? weightsValid
    : isTimelineStep
      ? timelineWeeks !== null
      : question?.type === "multi"
        ? Array.isArray(currentAnswer) && currentAnswer.length > 0
        : typeof currentAnswer === "string" && currentAnswer.length > 0;

  function selectSingle(opt: string) {
    if (!question) return;
    setAnswers((a) => ({ ...a, [question.id]: opt }));
  }

  function toggleMulti(opt: string) {
    if (!question) return;
    setAnswers((a) => {
      const existing = Array.isArray(a[question.id]) ? (a[question.id] as string[]) : [];
      let updated: string[];
      if (opt === "None") {
        updated = existing.includes("None") ? [] : ["None"];
      } else {
        const filtered = existing.filter((x) => x !== "None");
        updated = filtered.includes(opt) ? filtered.filter((x) => x !== opt) : [...filtered, opt];
      }
      return { ...a, [question.id]: updated };
    });
  }

  function handleNext() {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      const curKg = unit === "lb" ? curNum / 2.2046226218 : curNum;
      const tgtKg = unit === "lb" ? tgtNum / 2.2046226218 : tgtNum;
      const wks = timelineWeeks ?? 12;
      const today = new Date();
      const target = new Date(today.getTime() + wks * 7 * 24 * 60 * 60 * 1000);
      const targetStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
      onComplete({
        ...answers,
        weightKg: String(Math.round(curKg * 10) / 10),
        weightGoalKg: String(Math.round(tgtKg * 10) / 10),
        weightUnit: unit,
        weightTargetDate: targetStr,
        timelineWeeks: String(wks),
      });
    }
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={12}
            disabled={step === 0}
          >
            <Feather
              name="chevron-left"
              size={24}
              color={step === 0 ? "transparent" : colors.foreground}
            />
          </Pressable>
          <Text style={[styles.stepText, { color: colors.mutedForeground }]}>
            {step + 1} of {total}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>

        <View style={styles.monsterRow}>
          <Image source={FAST_MONSTER} style={styles.monster} resizeMode="contain" />
          <Image source={EAT_MONSTER} style={styles.monster} resizeMode="contain" />
          <Image source={COMPLETE_MONSTER} style={styles.monster} resizeMode="contain" />
          <Image source={SKIPPED_MONSTER} style={styles.monster} resizeMode="contain" />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isWeightStep ? (
            <Animated.View key="weights" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
              <View style={styles.questionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="trending-down" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.questionText, { color: colors.foreground }]}>
                  Your weight & target
                </Text>
              </View>
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                We'll use this to build your bespoke plan and calorie targets.
              </Text>

              <View style={styles.unitToggle}>
                {(["kg", "lb"] as const).map((u) => {
                  const active = unit === u;
                  return (
                    <Pressable
                      key={u}
                      onPress={() => setUnit(u)}
                      style={[
                        styles.unitBtn,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitBtnText,
                          { color: active ? "#fff" : colors.foreground },
                        ]}
                      >
                        {u.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.weightField}>
                <Text style={[styles.weightLabel, { color: colors.mutedForeground }]}>
                  Current weight ({unit})
                </Text>
                <TextInput
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                  keyboardType="decimal-pad"
                  placeholder={unit === "kg" ? "70" : "154"}
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.weightInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                />
              </View>

              <View style={styles.weightField}>
                <Text style={[styles.weightLabel, { color: colors.mutedForeground }]}>
                  Target weight ({unit})
                </Text>
                <TextInput
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  keyboardType="decimal-pad"
                  placeholder={unit === "kg" ? "65" : "143"}
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.weightInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                />
              </View>
            </Animated.View>
          ) : isTimelineStep ? (
            <Animated.View key="timeline" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
              <View style={styles.questionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="calendar" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.questionText, { color: colors.foreground }]}>
                  Time frame to reach your goal?
                </Text>
              </View>
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                We'll set a calorie target that fits this timeline.
              </Text>
              <View style={styles.options}>
                {TIMELINE_OPTIONS.map((opt) => {
                  const selected = timelineWeeks === opt.weeks;
                  return (
                    <Pressable
                      key={opt.weeks}
                      onPress={() => setTimelineWeeks(opt.weeks)}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: selected ? colors.primary + "12" : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: selected ? colors.primary : colors.foreground,
                            fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular",
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {selected && (
                        <Feather name="check-circle" size={18} color={colors.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {(() => {
                if (timelineWeeks === null || !weightsValid) return null;
                const curKg = unit === "lb" ? curNum / 2.2046226218 : curNum;
                const tgtKg = unit === "lb" ? tgtNum / 2.2046226218 : tgtNum;
                const days = timelineWeeks * 7;
                const diffKg = curKg - tgtKg;
                const maint = Math.round(curKg * 30);
                const dailyDelta = (diffKg * 7700) / days;
                const raw = maint - dailyDelta;
                const clamped = Math.max(1200, Math.min(4000, Math.round(raw / 10) * 10));
                const weeklyKg = (diffKg / days) * 7;
                const weeklyDisp = unit === "lb" ? weeklyKg * 2.2046226218 : weeklyKg;
                const direction = diffKg > 0 ? "lose" : diffKg < 0 ? "gain" : "maintain";
                return (
                  <View
                    style={[
                      styles.calorieCard,
                      { backgroundColor: colors.primary + "14", borderColor: colors.primary + "55" },
                    ]}
                  >
                    <Text style={[styles.calorieLabel, { color: "#fff" }]}>
                      Suggested daily intake
                    </Text>
                    <Text style={[styles.calorieValue, { color: "#ec4899" }]}>
                      {clamped} kcal
                    </Text>
                    {direction !== "maintain" && (
                      <Text style={[styles.calorieSub, { color: colors.mutedForeground }]}>
                        ≈ {Math.abs(weeklyDisp).toFixed(2)} {unit}/wk to {direction}
                      </Text>
                    )}
                    <Text style={[styles.calorieNote, { color: "#fff" }]}>
                      Remember — you can exceed your calorie suggestion when fasting regularly! Especially alternate day fasting!
                    </Text>
                  </View>
                );
              })()}
            </Animated.View>
          ) : question ? (
          <Animated.View key={question.id} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
            <View style={styles.questionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
                <Feather name={question.emoji as any} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.questionText, { color: colors.foreground }]}>
                {question.title}
              </Text>
            </View>

            {question.type === "multi" && (
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                Select all that apply
              </Text>
            )}

            <View style={styles.options}>
              {question.options.map((opt) => {
                const selected =
                  question.type === "multi"
                    ? Array.isArray(currentAnswer) && currentAnswer.includes(opt)
                    : currentAnswer === opt;

                return (
                  <Pressable
                    key={opt}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: selected ? colors.primary + "12" : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() =>
                      question.type === "multi" ? toggleMulti(opt) : selectSingle(opt)
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: selected ? colors.primary : colors.foreground,
                          fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular",
                        },
                      ]}
                    >
                      {opt}
                    </Text>
                    {selected && (
                      <Feather
                        name={question.type === "multi" ? "check-square" : "check-circle"}
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {step === 0 && (
              <View style={styles.logoWrap}>
                <Image
                  source={require("@/assets/images/fastplan-logo-white.png")}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
            )}
          </Animated.View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <Pressable
            style={[
              styles.nextBtn,
              {
                backgroundColor: isAnswered ? colors.primary : colors.muted,
                opacity: isAnswered ? 1 : 0.7,
              },
            ]}
            onPress={handleNext}
            disabled={!isAnswered}
          >
            <Text
              style={[
                styles.nextBtnText,
                { color: isAnswered ? "#fff" : colors.mutedForeground },
              ]}
            >
              {step === total - 1 ? "Finish" : "Continue"}
            </Text>
            <Feather
              name="arrow-right"
              size={18}
              color={isAnswered ? "#fff" : colors.mutedForeground}
            />
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 13, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  progressTrack: {
    height: 4,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  monsterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingTop: 20,
    paddingBottom: 8,
  },
  monster: {
    width: 56,
    height: 56,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  questionText: {
    flex: 1,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  hintText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 16,
  },
  calorieCard: {
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 4,
  },
  calorieLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  calorieValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  calorieSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  calorieNote: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 17,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  logoImg: {
    width: 120,
    height: 120,
  },
  options: {
    gap: 10,
    marginTop: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
    paddingRight: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  unitToggle: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  unitBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  weightField: {
    marginBottom: 16,
  },
  weightLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  weightInput: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
});
