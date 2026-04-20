import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface QuoteCardProps {
  quote: string;
  isFastDay: boolean;
}

export function QuoteCard({ quote, isFastDay }: QuoteCardProps) {
  const colors = useColors();
  const bg = isFastDay ? colors.fastPrimary + "18" : colors.eatPrimary + "18";
  const iconColor = isFastDay ? colors.fastPrimary : colors.eatPrimary;
  const textColor = isFastDay ? colors.fastText : colors.foreground;

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: iconColor + "30", borderWidth: 1 }]}>
      <Feather name="message-circle" size={16} color={iconColor} style={styles.icon} />
      <Text style={[styles.quote, { color: textColor }]}>{quote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  quote: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
  },
});
