import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface StreakCounterProps {
  streak: number;
  longestStreak: number;
  isFastDay: boolean;
}

export function StreakCounter({ streak, longestStreak, isFastDay }: StreakCounterProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(1.15, {}, () => {
      scale.value = withSpring(1);
    });
  }, [streak]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textColor = isFastDay ? colors.fastText : colors.foreground;
  const mutedColor = isFastDay ? colors.fastMuted : colors.mutedForeground;
  const cardBg = isFastDay ? colors.fastCard : colors.card;

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>
      <View style={styles.item}>
        <Animated.Text
          style={[animStyle, styles.number, { color: colors.streakGold }]}
        >
          {streak}
        </Animated.Text>
        <View style={styles.labelRow}>
          <Feather name="zap" size={12} color={colors.streakGold} />
          <Text style={[styles.label, { color: mutedColor }]}>  Current Streak</Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: isFastDay ? colors.fastMuted + "40" : colors.border }]} />
      <View style={styles.item}>
        <Text style={[styles.number, { color: isFastDay ? colors.fastPrimary : colors.primary }]}>
          {longestStreak}
        </Text>
        <View style={styles.labelRow}>
          <Feather name="award" size={12} color={isFastDay ? colors.fastPrimary : colors.primary} />
          <Text style={[styles.label, { color: mutedColor }]}>  Personal Best</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  number: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    lineHeight: 48,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    width: 1,
    height: 48,
    marginHorizontal: 16,
  },
});
