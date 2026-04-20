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
import type { DayType } from "@/context/FastingContext";

interface DayBadgeProps {
  type: DayType;
  large?: boolean;
}

export function DayBadge({ type, large = false }: DayBadgeProps) {
  const colors = useColors();
  const isFast = type === "fast";
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (isFast) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        true
      );
    }
  }, [isFast]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const size = large ? 120 : 56;
  const iconSize = large ? 52 : 24;
  const fontSize = large ? 14 : 10;

  return (
    <Animated.View
      style={[
        animStyle,
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isFast ? colors.fastPrimary + "20" : colors.eatPrimary + "20",
          borderColor: isFast ? colors.fastPrimary : colors.eatPrimary,
          borderWidth: 2,
        },
      ]}
    >
      <Feather
        name={isFast ? "moon" : "sun"}
        size={iconSize}
        color={isFast ? colors.fastPrimary : colors.eatPrimary}
      />
      {large && (
        <Text
          style={[
            styles.label,
            {
              fontSize,
              color: isFast ? colors.fastPrimary : colors.eatPrimary,
              marginTop: 4,
            },
          ]}
        >
          {isFast ? "FAST DAY" : "EAT DAY"}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
});
