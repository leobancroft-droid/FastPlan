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
  const textColor = isFastDay ? colors.fastText : colors.foreground;

  return (
    <View style={styles.container}>
      <Text style={[styles.quote, { color: textColor }]}>&ldquo;{quote}&rdquo;</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  quote: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
    textAlign: "center",
  },
});
