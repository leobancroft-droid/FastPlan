import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DayBadge } from "@/components/DayBadge";
import { QuoteCard } from "@/components/QuoteCard";
import { StartDatePicker } from "@/components/StartDatePicker";
import { StreakCounter } from "@/components/StreakCounter";
import { useFasting } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { today, streak, longestStreak, fastQuote, markComplete, markSkipped, startDate, setStartDateExplicit } = useFasting();
  const [loading, setLoading] = useState(false);

  const btnScale = useSharedValue(1);
  const checkScale = useSharedValue(0);

  const showPicker = !startDate;

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
          <DayBadge type={today?.type ?? "eat"} large />
          <Text style={[styles.dayTitle, { color: textColor }]}>
            {isFastDay ? "Fast Day" : "Eat Day"}
          </Text>
          <Text style={[styles.daySubtitle, { color: mutedColor }]}>
            {isFastDay
              ? "No calories today. You've got this."
              : "Enjoy your food mindfully today."}
          </Text>
        </View>

        <StreakCounter streak={streak} longestStreak={longestStreak} isFastDay={isFastDay} />

        <View style={styles.spacing} />

        {isFastDay && <QuoteCard quote={fastQuote} isFastDay={isFastDay} />}

        {!isFastDay && (
          <View style={[styles.eatTips, { backgroundColor: colors.eatPrimary + "15" }]}>
            <Text style={[styles.tipsTitle, { color: colors.eatPrimary }]}>Today's Tip</Text>
            <Text style={[styles.tipsText, { color: textColor }]}>
              Enjoy balanced meals. Tomorrow is a fast day — stay mindful and don't overindulge.
            </Text>
          </View>
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
          <View style={[styles.doneCard, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
            <Feather name="check-circle" size={32} color={colors.success} />
            <Text style={[styles.doneTitle, { color: colors.success }]}>Day Complete!</Text>
            <Text style={[styles.doneDesc, { color: mutedColor }]}>
              Great work. Come back tomorrow for your {isFastDay ? "eat" : "fast"} day.
            </Text>
          </View>
        ) : (
          <View style={[styles.doneCard, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}>
            <Feather name="x-circle" size={32} color={colors.destructive} />
            <Text style={[styles.doneTitle, { color: colors.destructive }]}>Day Skipped</Text>
            <Text style={[styles.doneDesc, { color: mutedColor }]}>No worries. Start fresh tomorrow.</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 0 },
  dateLabel: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", marginBottom: 24, letterSpacing: 0.5 },
  hero: { alignItems: "center", marginBottom: 32, gap: 12 },
  dayTitle: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  daySubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, paddingHorizontal: 16 },
  spacing: { height: 20 },
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
