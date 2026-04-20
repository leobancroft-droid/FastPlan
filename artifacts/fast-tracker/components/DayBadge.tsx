import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import type { DayType } from "@/context/FastingContext";

const EAT_MONSTER = require("@/assets/images/eat-monster.png");

interface DayBadgeProps {
  type: DayType;
  large?: boolean;
}

export function DayBadge({ type, large = false }: DayBadgeProps) {
  const colors = useColors();
  const isFast = type === "fast";
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const size = large ? 120 : 56;
  const iconSize = large ? 52 : 24;
  const fontSize = large ? 14 : 10;
  const imgSize = large ? 140 : 56;

  if (!isFast) {
    return (
      <Animated.View style={[animStyle, styles.monsterWrap]}>
        <Image
          source={EAT_MONSTER}
          style={{ width: imgSize, height: imgSize }}
          resizeMode="contain"
        />
        {large && (
          <Text style={[styles.label, { fontSize, color: colors.eatPrimary }]}>
            EAT DAY
          </Text>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        animStyle,
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.fastPrimary + "20",
          borderColor: colors.fastPrimary,
          borderWidth: 2,
        },
      ]}
    >
      <Feather name="moon" size={iconSize} color={colors.fastPrimary} />
      {large && (
        <Text style={[styles.label, { fontSize, color: colors.fastPrimary, marginTop: 4 }]}>
          FAST DAY
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
  monsterWrap: {
    alignItems: "center",
  },
  label: {
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginTop: 4,
  },
});
