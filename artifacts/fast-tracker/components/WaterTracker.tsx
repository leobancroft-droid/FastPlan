import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFasting, getTodayStr, getDiffDays } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

const HYDRATION_THRESHOLD_ML = 2000;
const HYDRATION_KEY = "hydration_streak_v1";

interface HydrationState {
  count: number;
  lastDate: string | null;
  achievedToday: boolean;
}

export function WaterTracker() {
  const colors = useColors();
  const { waterToday, waterGoal, glassSize, addGlass, removeGlass } = useFasting();
  const [hydration, setHydration] = useState<HydrationState>({ count: 0, lastDate: null, achievedToday: false });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HYDRATION_KEY);
        const today = getTodayStr();
        if (!raw) {
          setHydration({ count: 0, lastDate: null, achievedToday: false });
          return;
        }
        const parsed = JSON.parse(raw) as HydrationState;
        if (!parsed.lastDate) {
          setHydration({ count: 0, lastDate: null, achievedToday: false });
          return;
        }
        const gap = getDiffDays(parsed.lastDate, today);
        if (gap === 0) {
          setHydration(parsed);
        } else if (gap === 1) {
          setHydration({ count: parsed.count, lastDate: parsed.lastDate, achievedToday: false });
        } else {
          setHydration({ count: 0, lastDate: null, achievedToday: false });
          await AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify({ count: 0, lastDate: null, achievedToday: false }));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (waterToday < HYDRATION_THRESHOLD_ML) return;
    if (hydration.achievedToday) return;
    const today = getTodayStr();
    const wasYesterday = hydration.lastDate ? getDiffDays(hydration.lastDate, today) === 1 : false;
    const newCount = wasYesterday ? hydration.count + 1 : 1;
    const next: HydrationState = { count: newCount, lastDate: today, achievedToday: true };
    setHydration(next);
    AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify(next)).catch(() => {});
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [waterToday, hydration]);

  const goalGlasses = Math.max(1, Math.round(waterGoal / glassSize));
  const filledGlasses = Math.min(goalGlasses, Math.round(waterToday / glassSize));
  const overflow = Math.max(0, Math.round(waterToday / glassSize) - goalGlasses);
  const percent = Math.min(100, Math.round((waterToday / waterGoal) * 100));

  const blue = "#4ea7ff";
  const blueSoft = "#cfe5ff";

  async function handleAdd() {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    await addGlass();
  }
  async function handleRemove() {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    await removeGlass();
  }

  const cups = Array.from({ length: goalGlasses }, (_, i) => i < filledGlasses);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBubble, { backgroundColor: blue + "22" }]}>
            <Feather name="droplet" size={16} color={blue} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Water</Text>
          {hydration.count > 0 && (
            <View style={[styles.rewardChip, { backgroundColor: "#ffb84d22", borderColor: "#ffb84d66" }]}>
              <Feather name="award" size={12} color="#ffb84d" />
              <Text style={[styles.rewardChipText, { color: "#ffb84d" }]}>
                Day {hydration.count}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.goal, { color: colors.mutedForeground }]}>
          Goal: {(waterGoal / 1000).toFixed(2)} L
        </Text>
      </View>

      <View style={styles.amountRow}>
        <Text style={[styles.amount, { color: colors.foreground }]}>
          {(waterToday / 1000).toFixed(2)}
          <Text style={[styles.amountUnit, { color: colors.mutedForeground }]}> L</Text>
        </Text>
        <Text style={[styles.percent, { color: percent >= 100 ? colors.success : blue }]}>
          {percent}%
        </Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: percent >= 100 ? colors.success : blue }]} />
      </View>

      <View style={styles.cups}>
        {cups.map((filled, i) => (
          <Pressable
            key={i}
            onPress={() => (i < filledGlasses ? handleRemove() : handleAdd())}
            style={({ pressed }) => [styles.cupBtn, pressed && { opacity: 0.6 }]}
          >
            <Cup filled={filled} blue={blue} blueSoft={blueSoft} border={colors.border} />
          </Pressable>
        ))}
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={handleRemove}
          disabled={waterToday <= 0}
          style={[styles.ctrlBtn, { backgroundColor: colors.muted, opacity: waterToday <= 0 ? 0.4 : 1 }]}
        >
          <Feather name="minus" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.ctrlLabel, { color: colors.mutedForeground }]}>
          {glassSize} mL per glass
        </Text>
        <Pressable
          onPress={handleAdd}
          style={[styles.ctrlBtn, { backgroundColor: blue }]}
        >
          <Feather name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      {overflow > 0 && (
        <Text style={[styles.overflow, { color: colors.success }]}>
          +{overflow} extra glass{overflow === 1 ? "" : "es"} — great job!
        </Text>
      )}
    </View>
  );
}

function Cup({ filled, blue, blueSoft, border }: { filled: boolean; blue: string; blueSoft: string; border: string }) {
  return (
    <View style={cupStyles.outer}>
      <View
        style={[
          cupStyles.cup,
          {
            borderColor: filled ? blue : border,
            backgroundColor: "transparent",
          },
        ]}
      >
        {filled && (
          <View style={[cupStyles.fill, { backgroundColor: blue }]} />
        )}
        {!filled && (
          <View style={[cupStyles.fill, { backgroundColor: blueSoft, opacity: 0.35 }]} />
        )}
      </View>
    </View>
  );
}

const cupStyles = StyleSheet.create({
  outer: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  cup: {
    width: 26,
    height: 32,
    borderWidth: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  fill: {
    width: "100%",
    height: "100%",
  },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  goal: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  amount: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  amountUnit: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  percent: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  cups: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    justifyContent: "space-between",
  },
  cupBtn: {
    padding: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  overflow: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginTop: 2,
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 6,
  },
  rewardChipText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
});
