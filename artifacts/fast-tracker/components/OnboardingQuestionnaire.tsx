import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

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
  const colors = useColors();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});

  const question = QUESTIONS[step];
  const total = QUESTIONS.length;
  const progress = ((step + 1) / total) * 100;

  const currentAnswer = answers[question.id];
  const isAnswered =
    question.type === "multi"
      ? Array.isArray(currentAnswer) && currentAnswer.length > 0
      : typeof currentAnswer === "string" && currentAnswer.length > 0;

  function selectSingle(opt: string) {
    setAnswers((a) => ({ ...a, [question.id]: opt }));
  }

  function toggleMulti(opt: string) {
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
      onComplete(answers);
    }
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View key={question.id} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15" }]}>
              <Feather name={question.emoji as any} size={28} color={colors.primary} />
            </View>

            <Text style={[styles.questionText, { color: colors.foreground }]}>
              {question.title}
            </Text>

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
          </Animated.View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  questionText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 16,
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
});
