import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { DayBadge } from "@/components/DayBadge";
import { useColors } from "@/hooks/useColors";

interface AffirmationWidgetProps {
  quote: string;
  isFastDay: boolean;
}

export function AffirmationWidget({ quote, isFastDay }: AffirmationWidgetProps) {
  const colors = useColors();
  const accent = isFastDay ? colors.fastPrimary : colors.eatPrimary;
  const label = isFastDay ? "Fast Day" : "Eat Day";

  return (
    <View
      style={[
        styles.widget,
        {
          backgroundColor: colors.card,
          borderColor: accent + "33",
          shadowColor: "#000",
        },
      ]}
    >
      <View style={[styles.iconCol, { backgroundColor: accent + "18" }]}>
        <DayBadge type={isFastDay ? "fast" : "eat"} large />
        <Text style={[styles.iconLabel, { color: accent }]}>{label}</Text>
      </View>

      <View style={styles.textCol}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
          DAILY AFFIRMATION
        </Text>
        <Text
          style={[styles.quote, { color: colors.foreground }]}
          numberOfLines={4}
        >
          &ldquo;{quote}&rdquo;
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    flexDirection: "row",
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    alignItems: "stretch",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  iconCol: {
    width: 92,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  iconLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  textCol: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  quote: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
  },
});
