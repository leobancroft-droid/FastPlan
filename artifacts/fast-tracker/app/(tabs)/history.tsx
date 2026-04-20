import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScheduleFastModal } from "@/components/ScheduleFastModal";
import { useFasting, type ScheduledFast } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

type Tab = "upcoming" | "history";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { scheduledFasts, cancelFast, fastsCompleted, longestStreak } = useFasting();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 + 24 : 24;

  const upcoming = useMemo(
    () =>
      scheduledFasts
        .filter((f) => f.status === "scheduled" || f.status === "active")
        .sort((a, b) => new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime()),
    [scheduledFasts]
  );

  const past = useMemo(
    () =>
      scheduledFasts
        .filter((f) => f.status === "completed" || f.status === "broken" || f.status === "skipped")
        .sort((a, b) => new Date(b.plannedStart).getTime() - new Date(a.plannedStart).getTime()),
    [scheduledFasts]
  );

  const broken = scheduledFasts.filter((f) => f.status === "broken").length;
  const skipped = scheduledFasts.filter((f) => f.status === "skipped").length;

  const list = tab === "upcoming" ? upcoming : past;

  return (
    <>
      <ScheduleFastModal visible={scheduleOpen} mode="schedule" onClose={() => setScheduleOpen(false)} />
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Schedule</Text>
          <Pressable
            onPress={() => setScheduleOpen(true)}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard color={colors.success} icon="check-circle" value={fastsCompleted} label="Completed" />
          <StatCard color={colors.streakGold} icon="zap" value={longestStreak} label="Best" />
          <StatCard color={colors.destructive} icon="x" value={broken} label="Broken" />
          <StatCard color={colors.mutedForeground} icon="slash" value={skipped} label="Skipped" />
        </View>

        <View style={[styles.tabBar, { backgroundColor: colors.muted }]}>
          {(["upcoming", "history"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tabItem,
                tab === t && { backgroundColor: colors.card, shadowOpacity: 0.1 },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === t ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {t === "upcoming" ? `Upcoming (${upcoming.length})` : `History (${past.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        {list.length === 0 ? (
          <View style={styles.empty}>
            <Feather name={tab === "upcoming" ? "calendar" : "clock"} size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {tab === "upcoming" ? "Nothing scheduled" : "No fasts yet"}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {tab === "upcoming"
                ? "Tap the + button above to schedule your next fast."
                : "Your completed and broken fasts will appear here."}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {list.map((f) => (
              <FastRow
                key={f.id}
                fast={f}
                colors={colors}
                onCancel={() => {
                  Alert.alert("Cancel scheduled fast?", "This will remove it from your schedule.", [
                    { text: "Keep", style: "cancel" },
                    { text: "Cancel", style: "destructive", onPress: () => cancelFast(f.id) },
                  ]);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function StatCard({ color, icon, value, label }: { color: string; icon: React.ComponentProps<typeof Feather>["name"]; value: number; label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: color + "18", borderColor: color + "30" }]}>
      <Feather name={icon} size={18} color={color} />
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function FastRow({
  fast,
  colors,
  onCancel,
}: {
  fast: ScheduledFast;
  colors: ReturnType<typeof useColors>;
  onCancel: () => void;
}) {
  const start = new Date(fast.plannedStart);
  const end = new Date(fast.plannedEnd);
  const dateStr = start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const timeStr = `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} → ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

  let statusColor = colors.mutedForeground;
  let statusLabel = "Scheduled";
  let statusIcon: React.ComponentProps<typeof Feather>["name"] = "clock";
  if (fast.status === "active") {
    statusColor = colors.primary;
    statusLabel = "Active";
    statusIcon = "play";
  } else if (fast.status === "completed") {
    statusColor = colors.success;
    statusLabel = "Completed";
    statusIcon = "check";
  } else if (fast.status === "broken") {
    statusColor = colors.destructive;
    statusLabel = "Broken";
    statusIcon = "x";
  } else if (fast.status === "skipped") {
    statusColor = colors.mutedForeground;
    statusLabel = "Skipped";
    statusIcon = "slash";
  }

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: statusColor + "20" }]}>
        <Feather name={statusIcon} size={18} color={statusColor} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTopLine}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>{fast.presetLabel}</Text>
          <Text style={[styles.rowStatus, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
          {dateStr} · {timeStr}
        </Text>
      </View>
      {(fast.status === "scheduled" || fast.status === "active") && (
        <Pressable onPress={onCancel} hitSlop={8} style={{ paddingLeft: 8 }}>
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4, borderWidth: 1.5 },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  tabBar: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 4 },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 3,
  },
  tabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rowTopLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  rowTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  rowStatus: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  rowSub: { fontSize: 12, fontFamily: "Inter_500Medium" },
  empty: { alignItems: "center", paddingVertical: 50, gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 20 },
});
