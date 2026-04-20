import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import type { Badge } from "@/context/FastingContext";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface BadgeCardProps {
  badge: Badge;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  const colors = useColors();
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    if (badge.unlocked) {
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [badge.unlocked]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: badge.unlocked ? 0.2 + shimmer.value * 0.4 : 1,
  }));

  const iconName = badge.icon as FeatherIconName;
  const iconColor = badge.unlocked ? colors.streakGold : colors.mutedForeground;
  const bgColor = badge.unlocked ? colors.streakGold + "15" : colors.muted;
  const borderColor = badge.unlocked ? colors.streakGold + "40" : colors.border;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: 1.5,
          opacity: badge.unlocked ? 1 : 0.5,
        },
      ]}
    >
      <Animated.View style={[styles.iconWrap, { backgroundColor: iconColor + "20" }, glowStyle]}>
        <Feather name={iconName} size={28} color={iconColor} />
      </Animated.View>
      <Text style={[styles.name, { color: badge.unlocked ? colors.foreground : colors.mutedForeground }]}>
        {badge.name}
      </Text>
      <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
        {badge.description}
      </Text>
      {badge.unlocked ? (
        <View style={[styles.pill, { backgroundColor: colors.streakGold + "25" }]}>
          <Feather name="check" size={10} color={colors.streakGold} />
          <Text style={[styles.pillText, { color: colors.streakGold }]}>  Unlocked</Text>
        </View>
      ) : (
        <View style={[styles.pill, { backgroundColor: colors.muted }]}>
          <Feather name="lock" size={10} color={colors.mutedForeground} />
          <Text style={[styles.pillText, { color: colors.mutedForeground }]}>  {badge.requiredStreak} days</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    width: "47%",
    marginBottom: 12,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  desc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
