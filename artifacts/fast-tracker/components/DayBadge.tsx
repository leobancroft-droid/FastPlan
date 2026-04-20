import React from "react";
import { Image, StyleSheet, Text } from "react-native";
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
const FAST_MONSTER = require("@/assets/images/fast-monster.png");

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

  const fontSize = large ? 14 : 10;
  const imgSize = large ? 140 : 56;
  const labelColor = isFast ? colors.fastPrimary : colors.eatPrimary;

  return (
    <Animated.View style={[animStyle, styles.wrap]}>
      <Image
        source={isFast ? FAST_MONSTER : EAT_MONSTER}
        style={{ width: imgSize, height: imgSize }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  label: {
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginTop: 4,
  },
});
