import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface PlanReadyIntroProps {
  visible: boolean;
  onContinue: () => void;
}

export function PlanReadyIntro({ visible, onContinue }: PlanReadyIntroProps) {
  const c = useColors();
  const colors = {
    background: c.fastBg,
    foreground: c.fastText,
    mutedForeground: c.fastMuted,
    primary: c.fastPrimary,
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="zap" size={36} color={colors.primary} />
            </View>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.duration(400).delay(120)}
            style={[styles.title, { color: colors.foreground }]}
          >
            Your Plan Is Ready
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.duration(400).delay(220)}
            style={[styles.lead, { color: colors.mutedForeground }]}
          >
            Schedule your fasts on your own terms — pick a length, pick a time, hit start.
          </Animated.Text>

          <Animated.View entering={FadeInDown.duration(400).delay(320)} style={styles.bullets}>
            <Bullet text="Pick from common presets or any custom length." color={colors.foreground} />
            <Bullet text="Schedule ahead or start a fast right now." color={colors.foreground} />
            <Bullet text="Track your streak, water, mood, and meals." color={colors.foreground} />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(440)}
            style={[styles.rhythmBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
          >
            <Text style={[styles.rhythmLabel, { color: colors.primary }]}>YOUR RHYTHM, YOUR WAY</Text>
            <View style={styles.rhythmRow}>
              <RhythmWord text="Plan" color={colors.foreground} />
              <Feather name="arrow-right" size={18} color={colors.mutedForeground} />
              <RhythmWord text="Fast" color={colors.foreground} />
              <Feather name="arrow-right" size={18} color={colors.mutedForeground} />
              <RhythmWord text="Track" color={colors.foreground} />
            </View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.continueBtn, { backgroundColor: colors.primary }]}
            onPress={onContinue}
          >
            <Text style={styles.continueBtnText}>Let's Go</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Bullet({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: color }]} />
      <Text style={[styles.bulletText, { color }]}>{text}</Text>
    </View>
  );
}

function RhythmWord({ text, color }: { text: string; color: string }) {
  return <Text style={[styles.rhythmWord, { color }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between" },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 100,
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
    textAlign: "center",
    marginBottom: 16,
  },
  lead: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  bullets: {
    gap: 12,
    alignSelf: "stretch",
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  bulletText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  rhythmBox: {
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
  },
  rhythmLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  rhythmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rhythmWord: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
  },
  continueBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
