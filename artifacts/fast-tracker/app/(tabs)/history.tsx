import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlannedCalendar } from "@/components/PlannedCalendar";
import { useFasting } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history, streak, longestStreak, startDate } = useFasting();

  const topPadding = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 + 24 : 24;

  const completedFasts = history.filter((d) => d.status === "completed" && d.type === "fast").length;
  const completedEats = history.filter((d) => d.status === "completed" && d.type === "eat").length;
  const skipped = history.filter((d) => d.status === "skipped").length;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Schedule</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.fastPrimary + "18", borderColor: colors.fastPrimary + "30" }]}>
          <Feather name="moon" size={20} color={colors.fastPrimary} />
          <Text style={[styles.statNum, { color: colors.fastPrimary }]}>{completedFasts}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Fasts</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.eatPrimary + "18", borderColor: colors.eatPrimary + "30" }]}>
          <Feather name="sun" size={20} color={colors.eatPrimary} />
          <Text style={[styles.statNum, { color: colors.eatPrimary }]}>{completedEats}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Eat Days</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
          <Feather name="zap" size={20} color={colors.success} />
          <Text style={[styles.statNum, { color: colors.success }]}>{longestStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Best</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "25" }]}>
          <Feather name="x" size={20} color={colors.destructive} />
          <Text style={[styles.statNum, { color: colors.destructive }]}>{skipped}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Skipped</Text>
        </View>
      </View>

      {startDate ? (
        <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
          <PlannedCalendar startDate={startDate} history={history} />
        </View>
      ) : (
        <View style={styles.empty}>
          <Feather name="calendar" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No schedule yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Pick a start date on the Today tab to see your plan.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  pageTitle: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 4 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: "center", gap: 4, borderWidth: 1.5 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  calendarCard: {
    borderRadius: 20, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
