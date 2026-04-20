import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { useFasting, type ScheduledFast } from "@/context/FastingContext";

interface Props {
  onSchedule: () => void;
  onStartNow: () => void;
}

function formatDuration(ms: number): { h: string; m: string; s: string } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { h: String(h).padStart(2, "0"), m: String(m).padStart(2, "0"), s: String(s).padStart(2, "0") };
}

function formatRelative(target: number, now: number): string {
  const diff = target - now;
  const abs = Math.abs(diff);
  const m = Math.floor(abs / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d}d ${h % 24}h`;
  if (h >= 1) return `${h}h ${m % 60}m`;
  if (m >= 1) return `${m}m`;
  return "less than a minute";
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FastTimerCard({ onSchedule, onStartNow }: Props) {
  const colors = useColors();
  const { activeFast, nextUpcomingFast, endActiveFast, cancelFast, startScheduledFast } = useFasting();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  if (activeFast) {
    return <ActiveFast fast={activeFast} now={now} onEnd={endActiveFast} colors={colors} />;
  }

  if (nextUpcomingFast) {
    return (
      <UpcomingFast
        fast={nextUpcomingFast}
        now={now}
        onStartNow={() => startScheduledFast(nextUpcomingFast.id)}
        onCancel={() =>
          Alert.alert("Cancel scheduled fast?", "This will remove the scheduled fast.", [
            { text: "Keep", style: "cancel" },
            { text: "Cancel fast", style: "destructive", onPress: () => cancelFast(nextUpcomingFast.id) },
          ])
        }
        colors={colors}
      />
    );
  }

  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "20" }]}>
        <Feather name="moon" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No fast scheduled</Text>
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
        Plan ahead or jump in right now.
      </Text>
      <View style={styles.emptyBtns}>
        <Pressable
          onPress={onStartNow}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Feather name="play" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>Start a fast now</Text>
        </Pressable>
        <Pressable
          onPress={onSchedule}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: colors.primary },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Feather name="calendar" size={16} color={colors.primary} />
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Schedule</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ActiveFast({
  fast,
  now,
  onEnd,
  colors,
}: {
  fast: ScheduledFast;
  now: number;
  onEnd: (broken?: boolean) => Promise<void>;
  colors: ReturnType<typeof useColors>;
}) {
  const start = fast.actualStart ? new Date(fast.actualStart).getTime() : new Date(fast.plannedStart).getTime();
  const end = new Date(fast.plannedEnd).getTime();
  const total = end - start;
  const elapsed = Math.max(0, Math.min(total, now - start));
  const remaining = Math.max(0, end - now);
  const progress = total > 0 ? elapsed / total : 0;
  const reachedGoal = now >= end;

  const elapsedT = formatDuration(elapsed);
  const remainingT = formatDuration(remaining);

  function handleEnd() {
    if (reachedGoal) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onEnd(false);
      return;
    }
    Alert.alert(
      "End fast early?",
      `You're ${Math.round(progress * 100)}% through your ${fast.presetLabel} fast. Ending now will record it as broken.`,
      [
        { text: "Keep going", style: "cancel" },
        { text: "End fast", style: "destructive", onPress: () => onEnd(true) },
      ]
    );
  }

  return (
    <View style={[styles.activeCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
      <View style={styles.activeHeader}>
        <View style={[styles.statusDot, { backgroundColor: reachedGoal ? colors.success : colors.primary }]} />
        <Text style={[styles.activeStatus, { color: reachedGoal ? colors.success : colors.primary }]}>
          {reachedGoal ? "GOAL REACHED" : "FASTING"}
        </Text>
        <Text style={[styles.activeMeta, { color: colors.mutedForeground }]}>{fast.presetLabel}</Text>
      </View>

      <View style={styles.ringWrap}>
        <ProgressRing progress={progress} color={reachedGoal ? colors.success : colors.primary} trackColor={colors.muted} />
        <View style={styles.ringInner}>
          <Text style={[styles.ringLabel, { color: colors.mutedForeground }]}>ELAPSED</Text>
          <Text style={[styles.ringTime, { color: colors.foreground }]}>
            {elapsedT.h}:{elapsedT.m}:{elapsedT.s}
          </Text>
          <Text style={[styles.ringSub, { color: colors.mutedForeground }]}>
            {reachedGoal ? "Past goal" : `${remainingT.h}h ${remainingT.m}m left`}
          </Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeCol}>
          <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>STARTED</Text>
          <Text style={[styles.timeValue, { color: colors.foreground }]}>{formatClock(fast.actualStart ?? fast.plannedStart)}</Text>
        </View>
        <View style={styles.timeCol}>
          <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>GOAL</Text>
          <Text style={[styles.timeValue, { color: colors.foreground }]}>{formatClock(fast.plannedEnd)}</Text>
        </View>
      </View>

      <Pressable
        onPress={handleEnd}
        style={({ pressed }) => [
          styles.primaryBtn,
          { backgroundColor: reachedGoal ? colors.success : colors.destructive, marginTop: 16 },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Feather name={reachedGoal ? "check" : "square"} size={16} color="#fff" />
        <Text style={styles.primaryBtnText}>{reachedGoal ? "End fast" : "Break fast early"}</Text>
      </Pressable>
    </View>
  );
}

function UpcomingFast({
  fast,
  now,
  onStartNow,
  onCancel,
  colors,
}: {
  fast: ScheduledFast;
  now: number;
  onStartNow: () => Promise<void> | void;
  onCancel: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const start = new Date(fast.plannedStart).getTime();
  const end = new Date(fast.plannedEnd).getTime();
  const overdue = now > start;

  return (
    <View style={[styles.upcomingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.upcomingHeader}>
        <Feather name="calendar" size={18} color={colors.primary} />
        <Text style={[styles.upcomingTag, { color: colors.primary }]}>NEXT FAST</Text>
        <Text style={[styles.upcomingMeta, { color: colors.mutedForeground }]}>{fast.presetLabel}</Text>
      </View>

      <Text style={[styles.upcomingHero, { color: colors.foreground }]}>
        {overdue ? "Ready to start" : `Starts in ${formatRelative(start, now)}`}
      </Text>
      <Text style={[styles.upcomingSub, { color: colors.mutedForeground }]}>
        {formatClock(fast.plannedStart)} → {formatClock(fast.plannedEnd)}
      </Text>

      <View style={styles.upcomingBtns}>
        <Pressable
          onPress={onStartNow}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.primary, flex: 1 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Feather name="play" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>{overdue ? "Start now" : "Start early"}</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.iconBtn,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

function ProgressRing({ progress, color, trackColor, size = 220, stroke = 14 }: {
  progress: number;
  color: string;
  trackColor: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, Math.max(0, progress));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 8 },
  emptyBtns: { flexDirection: "row", gap: 10, alignSelf: "stretch" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    flex: 1,
  },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
  },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  activeCard: {
    borderRadius: 24,
    borderWidth: 2,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  activeHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  activeStatus: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  activeMeta: { fontSize: 12, fontFamily: "Inter_500Medium", marginLeft: "auto" },
  ringWrap: { width: 220, height: 220, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  ringInner: { position: "absolute", alignItems: "center", justifyContent: "center" },
  ringLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginBottom: 4 },
  ringTime: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: -1, fontVariant: ["tabular-nums"] },
  ringSub: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 6 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", alignSelf: "stretch", paddingHorizontal: 16 },
  timeCol: { alignItems: "center", gap: 4 },
  timeLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  timeValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  upcomingCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 22,
    paddingHorizontal: 22,
  },
  upcomingHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  upcomingTag: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  upcomingMeta: { fontSize: 12, fontFamily: "Inter_500Medium", marginLeft: "auto" },
  upcomingHero: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  upcomingSub: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 6, marginBottom: 18 },
  upcomingBtns: { flexDirection: "row", gap: 10 },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
