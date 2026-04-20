import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { UserProfile } from "@/lib/personalization";

interface PlanCardProps {
  profile: UserProfile;
  isFastDay: boolean;
}

export function PlanCard({ profile, isFastDay }: PlanCardProps) {
  const colors = useColors();
  const accent = isFastDay ? colors.fastPrimary : colors.eatPrimary;
  const textColor = isFastDay ? colors.fastText : colors.eatText;
  const mutedColor = isFastDay ? colors.fastMuted : colors.mutedForeground;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: accent + "18" }]}>
          <Feather name="zap" size={14} color={accent} />
          <Text style={[styles.badgeText, { color: accent }]}>{profile.difficulty}</Text>
        </View>
        <Text style={[styles.headerTitle, { color: textColor }]}>Your Plan</Text>
      </View>

      <Text style={[styles.encouragement, { color: mutedColor }]}>{profile.encouragement}</Text>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Row
        icon="target"
        accent={accent}
        title="Fast structure"
        value={profile.structureLabel}
        detail={profile.structureDetail}
        textColor={textColor}
        mutedColor={mutedColor}
      />

      <Row
        icon="clock"
        accent={accent}
        title="Eating window"
        value={profile.eatingWindow}
        detail={profile.eatingWindowDetail}
        textColor={textColor}
        mutedColor={mutedColor}
      />

      <Row
        icon="bell"
        accent={accent}
        title="Coaching tone"
        value={profile.toneLabel}
        detail={profile.notificationStyle}
        textColor={textColor}
        mutedColor={mutedColor}
        last
      />
    </View>
  );
}

interface RowProps {
  icon: string;
  accent: string;
  title: string;
  value: string;
  detail: string;
  textColor: string;
  mutedColor: string;
  last?: boolean;
}

function Row({ icon, accent, title, value, detail, textColor, mutedColor, last }: RowProps) {
  return (
    <View style={[styles.row, last && { marginBottom: 0 }]}>
      <View style={[styles.iconBox, { backgroundColor: accent + "15" }]}>
        <Feather name={icon as any} size={16} color={accent} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: mutedColor }]}>{title.toUpperCase()}</Text>
        <Text style={[styles.rowValue, { color: textColor }]}>{value}</Text>
        <Text style={[styles.rowDetail, { color: mutedColor }]}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  encouragement: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: 14,
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  rowValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  rowDetail: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 2,
  },
});
