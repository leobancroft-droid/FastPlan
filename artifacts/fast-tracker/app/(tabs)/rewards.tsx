import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BadgeCard } from "@/components/BadgeCard";
import { PlanCard } from "@/components/PlanCard";
import { OnboardingQuestionnaire } from "@/components/OnboardingQuestionnaire";
import { useFasting } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

export default function RewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { badges, streak, today, userProfile, completeOnboarding, resetAll } = useFasting();
  const isFastDay = today?.type === "fast";
  const [planEditorOpen, setPlanEditorOpen] = useState(false);

  async function startFreshPlan() {
    await resetAll();
    setPlanEditorOpen(true);
  }

  function openChangePlan() {
    if (Platform.OS === "web") {
      void startFreshPlan();
      return;
    }
    Alert.alert(
      "Change Plan",
      "Retaking onboarding will reset everything — streaks, badges, history, water, weight, mood, calories and activities. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset & Continue", style: "destructive", onPress: () => { void startFreshPlan(); } },
      ]
    );
  }

  const topPadding = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 + 24 : 24;

  const unlocked = badges.filter((b) => b.unlocked).length;
  const total = badges.length;

  const next = badges.find((b) => !b.unlocked);
  const progressToNext = next
    ? Math.min((streak / next.requiredStreak) * 100, 100)
    : 100;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding, paddingBottom: bottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Rewards</Text>

      {userProfile && <PlanCard profile={userProfile} isFastDay={isFastDay} />}

      <Pressable
        onPress={openChangePlan}
        style={({ pressed }) => [
          styles.changePlanBtn,
          {
            backgroundColor: colors.card,
            borderColor: colors.primary + "55",
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={[styles.changePlanIcon, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="refresh-cw" size={16} color={colors.primary} />
        </View>
        <View style={styles.changePlanText}>
          <Text style={[styles.changePlanTitle, { color: colors.foreground }]}>Change Plan</Text>
          <Text style={[styles.changePlanSub, { color: colors.mutedForeground }]}>
            Retake onboarding to rebuild your fasting plan
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </Pressable>

      <View style={[styles.progressCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
        <View style={styles.progressHeader}>
          <Feather name="award" size={20} color={colors.primary} />
          <Text style={[styles.progressTitle, { color: colors.primary }]}>
            {unlocked}/{total} badges unlocked
          </Text>
        </View>
        {next && (
          <>
            <Text style={[styles.progressNext, { color: colors.mutedForeground }]}>
              Next: {next.name} ({next.requiredStreak - streak} days to go)
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${progressToNext}%`,
                  },
                ]}
              />
            </View>
          </>
        )}
        {!next && (
          <Text style={[styles.progressNext, { color: colors.success }]}>
            All badges unlocked! You're incredible.
          </Text>
        )}
      </View>

      <View style={styles.badgeGrid}>
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </View>

      <View style={[styles.motivationCard, { backgroundColor: colors.card }]}>
        <Feather name="trending-up" size={20} color={colors.streakGold} />
        <Text style={[styles.motivationText, { color: colors.foreground }]}>
          Every fast day completed brings you closer to the next badge. Stay consistent!
        </Text>
      </View>
      <OnboardingQuestionnaire
        visible={planEditorOpen}
        onComplete={async (answers) => {
          await completeOnboarding(answers);
          setPlanEditorOpen(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 0,
  },
  progressCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  progressNext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 0,
  },
  motivationCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  changePlanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  changePlanIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  changePlanText: {
    flex: 1,
    gap: 2,
  },
  changePlanTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  changePlanSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
