import { Feather } from "@expo/vector-icons";
import React from "react";
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
import { useFasting } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { streak, longestStreak, fastsCompleted, scheduledFasts, resetAll } = useFasting();

  const topPadding = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 + 24 : 24;

  function handleReset() {
    Alert.alert(
      "Reset All Data?",
      "This will erase your scheduled fasts, history, streaks, badges, and trackers. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetAll },
      ]
    );
  }

  const broken = scheduledFasts.filter((f) => f.status === "broken").length;
  const skipped = scheduledFasts.filter((f) => f.status === "skipped").length;
  const totalScheduled = scheduledFasts.length;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Settings</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>YOUR STATS</Text>
        <StatRow label="Fasts completed" value={String(fastsCompleted)} icon="check-circle" colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatRow label="Total scheduled" value={String(totalScheduled)} icon="calendar" colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatRow label="Current streak" value={`${streak} days`} icon="zap" colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatRow label="Longest streak" value={`${longestStreak} days`} icon="award" colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatRow label="Broken fasts" value={String(broken)} icon="x-circle" colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatRow label="Skipped fasts" value={String(skipped)} icon="slash" colors={colors} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>HOW IT WORKS</Text>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="calendar" size={16} color={colors.primary} />
          </View>
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Schedule a fast</Text>
            <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
              Pick a preset (16:8, OMAD, 48h…) or set a custom length, choose when it starts.
            </Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: colors.fastPrimary + "20" }]}>
            <Feather name="play" size={16} color={colors.fastPrimary} />
          </View>
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Run the timer</Text>
            <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
              Watch your progress ring fill as your fast runs. End it any time.
            </Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: colors.streakGold + "20" }]}>
            <Feather name="zap" size={16} color={colors.streakGold} />
          </View>
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Build your streak</Text>
            <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
              Complete fasts on consecutive days to grow your streak and unlock badges.
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.resetBtn, { borderColor: colors.destructive + "50" }]}
        onPress={handleReset}
      >
        <Feather name="trash-2" size={18} color={colors.destructive} />
        <Text style={[styles.resetText, { color: colors.destructive }]}>Reset All Data</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatRow({ label, value, icon, colors }: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        <Feather name={icon} size={16} color={colors.mutedForeground} />
        <Text style={[styles.statLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  pageTitle: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 4 },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 4,
  },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 12 },
  divider: { height: 1, marginVertical: 8 },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  statLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  statLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  infoItem: { flexDirection: "row", gap: 14, marginBottom: 14, alignItems: "flex-start" },
  infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  infoDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
  },
  resetText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
