import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BadgeCard } from "@/components/BadgeCard";
import { DayBadge } from "@/components/DayBadge";
import { NutritionTracker } from "@/components/NutritionTracker";
import { OnboardingQuestionnaire } from "@/components/OnboardingQuestionnaire";
import { PlanCard } from "@/components/PlanCard";
import { PlannedCalendar } from "@/components/PlannedCalendar";
import { PlanReadyIntro } from "@/components/PlanReadyIntro";
import { QuoteCard } from "@/components/QuoteCard";
import { StartDatePicker } from "@/components/StartDatePicker";
import { StreakCounter } from "@/components/StreakCounter";
import { WaterTracker } from "@/components/WaterTracker";
import { WeightTracker } from "@/components/WeightTracker";
import { EmotionTracker } from "@/components/EmotionTracker";
import { useFasting, getTodayStr } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

const KCAL_PER_STEP = 0.04;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { today, history, streak, longestStreak, badges, fastQuote, markComplete, markSkipped, setDayStatus, startDate, setStartDateExplicit, onboardingComplete, completeOnboarding, userProfile, planIntroSeen, markPlanIntroSeen } = useFasting();
  const [loading, setLoading] = useState(false);
  const [burned, setBurned] = useState(0);
  const [nutritionRefresh, setNutritionRefresh] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [s, sDate, a] = await Promise.all([
            AsyncStorage.getItem("steps_today"),
            AsyncStorage.getItem("steps_date"),
            AsyncStorage.getItem("activities_log"),
          ]);
          if (cancelled) return;
          const today = todayStr();
          const steps = s && sDate === today ? Number(s) || 0 : 0;
          const stepKcal = Math.round(steps * KCAL_PER_STEP);
          const acts: { kcal: number; date: string }[] = a ? JSON.parse(a) : [];
          const actKcal = acts
            .filter((x) => x.date === today)
            .reduce((sum, x) => sum + (x.kcal || 0), 0);
          setBurned(stepKcal + actKcal);
        } catch {}
      })();
      return () => {
        cancelled = true;
      };
    }, [nutritionRefresh])
  );

  const recentBadges = badges
    .slice()
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
    .slice(0, 4);

  const btnScale = useSharedValue(1);
  const checkScale = useSharedValue(0);

  const showOnboarding = !onboardingComplete;
  const showPlanIntro = onboardingComplete && !planIntroSeen;
  const showPicker = onboardingComplete && planIntroSeen && !startDate;

  const isFastDay = today?.type === "fast";
  const isCompleted = today?.status === "completed";
  const isSkipped = today?.status === "skipped";

  const bg = isFastDay ? colors.fastBg : colors.eatBg;
  const textColor = isFastDay ? colors.fastText : colors.eatText;
  const mutedColor = isFastDay ? colors.fastMuted : colors.mutedForeground;
  const primaryColor = isFastDay ? colors.fastPrimary : colors.eatPrimary;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const btnAnim = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const checkAnim = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }], opacity: checkScale.value }));

  async function handleComplete() {
    if (isCompleted || loading) return;
    setLoading(true);
    btnScale.value = withSequence(withSpring(0.92), withSpring(1.05), withSpring(1));
    checkScale.value = withSequence(withSpring(1.4), withSpring(1));
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await markComplete();
    setLoading(false);
  }

  function handleStatusChange() {
    if (!isCompleted && !isSkipped) return;
    const todayStr = getTodayStr();
    const buttons: { text: string; style?: "cancel" | "destructive"; onPress?: () => void }[] = [];
    if (isCompleted) {
      buttons.push({
        text: "Mark as Skipped",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await setDayStatus(todayStr, "skipped");
        },
      });
    }
    if (isSkipped) {
      buttons.push({
        text: "Mark as Complete",
        onPress: async () => {
          if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await setDayStatus(todayStr, "completed");
        },
      });
    }
    buttons.push({
      text: "Reset to Pending",
      onPress: async () => {
        if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await setDayStatus(todayStr, "clear");
      },
    });
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert(
      "Change today's status",
      `Today is currently marked as ${isCompleted ? "complete" : "skipped"}.`,
      buttons,
    );
  }

  function handleSkip() {
    if (isCompleted || isSkipped) return;
    Alert.alert("Skip Today?", "Skipping will reset your streak. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Skip",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await markSkipped();
        },
      },
    ]);
  }

  const topPadding = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 + 24 : 24;

  return (
    <>
      <OnboardingQuestionnaire
        visible={showOnboarding}
        onComplete={(answers) => completeOnboarding(answers)}
      />
      <PlanReadyIntro visible={showPlanIntro} onContinue={markPlanIntroSeen} />
      <StartDatePicker
        visible={showPicker}
        onConfirm={(dateStr) => setStartDateExplicit(dateStr)}
      />

      <ScrollView
        style={[styles.scroll, { backgroundColor: bg }]}
        contentContainerStyle={[styles.content, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.dateLabel, { color: mutedColor }]}>{todayLabel}</Text>

        <View style={styles.hero}>
          <Pressable
            onPress={handleStatusChange}
            disabled={!isCompleted && !isSkipped}
            hitSlop={10}
            style={({ pressed }) => [{ alignItems: "center", gap: 12, opacity: pressed && (isCompleted || isSkipped) ? 0.7 : 1 }]}
          >
            <DayBadge type={today?.type ?? "eat"} large completed={isCompleted} skipped={isSkipped} />
            {(isCompleted || isSkipped) && (
              <Text style={[styles.dayPrefix, { color: primaryColor }]}>
                {isFastDay ? "FAST DAY" : "EAT DAY"}
              </Text>
            )}
            <Text style={[styles.dayTitle, { color: textColor }]}>
              {isSkipped ? "Day Skipped" : isCompleted ? "Day Complete" : isFastDay ? "Fast Day" : "Eat Day"}
            </Text>
            {(isCompleted || isSkipped) && (
              <Text style={[styles.dayHint, { color: mutedColor }]}>Tap to change status</Text>
            )}
          </Pressable>
          <Text style={[styles.daySubtitle, { color: mutedColor }]}>
            {getDaySubtitle(isFastDay, userProfile?.tone)}
          </Text>
          <QuoteCard quote={fastQuote} isFastDay={isFastDay} />
        </View>

        <StreakCounter streak={streak} longestStreak={longestStreak} isFastDay={isFastDay} />

        <View style={styles.spacing} />

        <WaterTracker />

        <View style={styles.spacing} />

        <EmotionTracker />

        <View style={styles.spacing} />

        <WeightTracker onCalorieGoalChange={() => setNutritionRefresh((n) => n + 1)} />

        {!isFastDay && (
          <>
            <View style={styles.spacing} />
            <View style={[styles.eatTips, { backgroundColor: colors.eatPrimary + "15" }]}>
              <Text style={[styles.tipsTitle, { color: colors.eatPrimary }]}>Today's Tip</Text>
              <Text style={[styles.tipsText, { color: textColor }]}>
                Enjoy balanced meals. Tomorrow is a fast day — stay mindful and don't overindulge.
              </Text>
            </View>
          </>
        )}

        <View style={styles.spacing} />

        <Text style={[styles.sectionTitle, { color: textColor }]}>Summary</Text>

        <NutritionTracker
          key={nutritionRefresh}
          burned={burned}
        />

        {startDate && (
          <>
            <View style={styles.spacing} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Fasting Plan</Text>
            <PlannedCalendar startDate={startDate} history={history} />
          </>
        )}

        {recentBadges.length > 0 && (
          <>
            <View style={styles.spacing} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Rewards</Text>
            <View style={styles.badgeRow}>
              {recentBadges.map((b) => (
                <BadgeCard key={b.id} badge={b} />
              ))}
            </View>
          </>
        )}

        <View style={styles.spacing} />

        {!isCompleted && !isSkipped ? (
          <>
            <Animated.View style={btnAnim}>
              <Pressable
                style={[styles.completeBtn, { backgroundColor: primaryColor }]}
                onPress={handleComplete}
                disabled={loading}
              >
                <Animated.View style={[styles.checkCircle, checkAnim]}>
                  <Feather name="check" size={20} color="#fff" />
                </Animated.View>
                <Text style={styles.completeBtnText}>
                  {isFastDay ? "Complete Fast Day" : "Complete Eat Day"}
                </Text>
              </Pressable>
            </Animated.View>
            <Pressable style={styles.skipBtn} onPress={handleSkip}>
              <Text style={[styles.skipText, { color: mutedColor }]}>Skip today</Text>
            </Pressable>
          </>
        ) : isCompleted ? (
          <>
            <View style={[styles.doneCard, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
              <Feather name="check-circle" size={32} color={colors.success} />
              <Text style={[styles.doneTitle, { color: colors.success }]}>Day Complete!</Text>
              <Text style={[styles.doneDesc, { color: mutedColor }]}>
                Great work. Come back tomorrow for your {isFastDay ? "eat" : "fast"} day.
              </Text>
            </View>
            <Pressable style={styles.skipBtn} onPress={handleStatusChange}>
              <Text style={[styles.skipText, { color: mutedColor }]}>Change status</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={[styles.doneCard, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}>
              <Feather name="x-circle" size={32} color={colors.destructive} />
              <Text style={[styles.doneTitle, { color: colors.destructive }]}>Day Skipped</Text>
              <Text style={[styles.doneDesc, { color: mutedColor }]}>No worries. Start fresh tomorrow.</Text>
            </View>
            <Pressable style={styles.skipBtn} onPress={handleStatusChange}>
              <Text style={[styles.skipText, { color: mutedColor }]}>Change status</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </>
  );
}

function getDaySubtitle(isFastDay: boolean, tone: "supportive" | "balanced" | "strict" | undefined): string {
  if (isFastDay) {
    if (tone === "strict") return "Stay disciplined and execute the plan.";
    if (tone === "balanced") return "Stay focused. You committed to today — see it through.";
    return "No calories today. Be kind to yourself — you've got this.";
  }
  if (tone === "strict") return "Refuel with intention. Tomorrow's fast starts at midnight.";
  if (tone === "balanced") return "Eat well today. Tomorrow's fast will be easier for it.";
  return "Enjoy your food mindfully. You earned this day.";
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  dateLabel: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", marginBottom: 24, letterSpacing: 0.5 },
  hero: { alignItems: "center", marginBottom: 32, gap: 12 },
  dayPrefix: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginTop: -4, marginBottom: -4 },
  dayHint: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: -4, opacity: 0.7 },
  dayTitle: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  daySubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, paddingHorizontal: 16 },
  spacing: { height: 20 },
  sectionTitle: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3, marginBottom: 12 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  eatTips: { borderRadius: 16, padding: 20 },
  tipsTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 6 },
  tipsText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  completeBtn: {
    borderRadius: 20, paddingVertical: 18, paddingHorizontal: 32,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6, marginBottom: 12,
  },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  completeBtnText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.2 },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  doneCard: { borderRadius: 20, padding: 28, alignItems: "center", gap: 10, borderWidth: 1.5 },
  doneTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  doneDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
});
