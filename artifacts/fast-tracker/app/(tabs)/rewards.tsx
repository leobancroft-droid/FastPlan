import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BadgeCard } from "@/components/BadgeCard";
import { useFasting } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

export default function RewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { badges, streak } = useFasting();

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
});
