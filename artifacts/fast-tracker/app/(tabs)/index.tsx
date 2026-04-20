import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OnboardingQuestionnaire } from "@/components/OnboardingQuestionnaire";
import { PlanReadyIntro } from "@/components/PlanReadyIntro";
import { QuoteCard } from "@/components/QuoteCard";
import { StreakCounter } from "@/components/StreakCounter";
import { WaterTracker } from "@/components/WaterTracker";
import { WeightTracker } from "@/components/WeightTracker";
import { EmotionTracker } from "@/components/EmotionTracker";
import { FastTimerCard } from "@/components/FastTimerCard";
import { ScheduleFastModal } from "@/components/ScheduleFastModal";
import { useFasting } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    activeFast,
    fastQuote,
    onboardingComplete,
    completeOnboarding,
    planIntroSeen,
    markPlanIntroSeen,
    fastsCompleted,
    streak,
    longestStreak,
  } = useFasting();
  const [scheduleModal, setScheduleModal] = useState<null | "schedule" | "start-now">(null);

  const showOnboarding = !onboardingComplete;
  const showPlanIntro = onboardingComplete && !planIntroSeen;

  const isFasting = !!activeFast;
  const bg = isFasting ? colors.fastBg : colors.background;
  const textColor = isFasting ? colors.fastText : colors.foreground;
  const mutedColor = isFasting ? colors.fastMuted : colors.mutedForeground;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const topPadding = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 + 24 : 24;

  return (
    <>
      <OnboardingQuestionnaire
        visible={showOnboarding}
        onComplete={(answers) => completeOnboarding(answers)}
      />
      <PlanReadyIntro visible={showPlanIntro} onContinue={markPlanIntroSeen} />
      <ScheduleFastModal
        visible={scheduleModal !== null}
        mode={scheduleModal ?? "schedule"}
        onClose={() => setScheduleModal(null)}
      />

      <ScrollView
        style={[styles.scroll, { backgroundColor: bg }]}
        contentContainerStyle={[styles.content, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dateLabel, { color: mutedColor }]}>{todayLabel}</Text>
            <Text style={[styles.pageTitle, { color: textColor }]}>Your fasts</Text>
          </View>
        </View>

        <FastTimerCard
          onSchedule={() => setScheduleModal("schedule")}
          onStartNow={() => setScheduleModal("start-now")}
        />

        {isFasting && (
          <>
            <View style={styles.spacing} />
            <QuoteCard quote={fastQuote} isFastDay={true} />
          </>
        )}

        <View style={styles.spacing} />

        <View style={styles.statsStrip}>
          <StatTile label="Completed" value={String(fastsCompleted)} colors={colors} />
          <StatTile label="Streak" value={`${streak}d`} colors={colors} />
          <StatTile label="Best" value={`${longestStreak}d`} colors={colors} />
        </View>

        <View style={styles.spacing} />
        <StreakCounter streak={streak} longestStreak={longestStreak} isFastDay={isFasting} />

        <View style={styles.spacing} />
        <WaterTracker />

        <View style={styles.spacing} />
        <WeightTracker />

        <View style={styles.spacing} />
        <EmotionTracker />
      </ScrollView>
    </>
  );
}

function StatTile({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.statTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  headerRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 16 },
  dateLabel: { fontSize: 13, fontFamily: "Inter_500Medium", letterSpacing: 0.5, marginBottom: 4 },
  pageTitle: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  spacing: { height: 18 },
  statsStrip: { flexDirection: "row", gap: 10 },
  statTile: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
});
