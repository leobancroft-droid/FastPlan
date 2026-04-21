import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Paywall } from "@/components/Paywall";
import { StartDatePicker } from "@/components/StartDatePicker";
import { useFasting } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";
import {
  cancelAllReminders,
  isNotificationsEnabled,
  requestNotificationPermissions,
  scheduleDailyReminders,
  setNotificationsEnabled,
} from "@/lib/notifications";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { startDate, streak, longestStreak, history, resetAll, setStartDateExplicit, getTypeForDate } = useFasting();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const { isSubscribed } = useSubscription();

  useEffect(() => {
    isNotificationsEnabled().then(setNotifEnabled);
  }, []);

  async function handleNotifToggle(next: boolean) {
    if (next) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          "Notifications disabled",
          "Enable notifications for FastPlan in your device Settings to get daily reminders.",
        );
        return;
      }
      await setNotificationsEnabled(true);
      setNotifEnabled(true);
      await scheduleDailyReminders((d) => getTypeForDate(d));
    } else {
      await setNotificationsEnabled(false);
      setNotifEnabled(false);
      await cancelAllReminders();
    }
  }

  const topPadding = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPadding = Platform.OS === "web" ? 34 + 24 : 24;

  function handleReset() {
    Alert.alert(
      "Reset All Data?",
      "This will erase your entire history, streak, and all badges. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetAll },
      ]
    );
  }

  const completedDays = history.filter((d) => d.status === "completed").length;

  return (
    <>
      <StartDatePicker
        visible={showDatePicker}
        onConfirm={(dateStr) => {
          setStartDateExplicit(dateStr);
          setShowDatePicker(false);
        }}
      />
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding, paddingBottom: bottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Settings</Text>

      <Pressable
        onPress={() => setPaywallOpen(true)}
        style={({ pressed }) => [
          styles.premiumCard,
          {
            backgroundColor: isSubscribed ? colors.card : colors.primary,
            borderColor: isSubscribed ? colors.primary : "transparent",
            borderWidth: isSubscribed ? 1 : 0,
          },
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={[styles.premiumIcon, { backgroundColor: isSubscribed ? colors.primary + "22" : "rgba(255,255,255,0.18)" }]}>
          <Feather name="award" size={20} color={isSubscribed ? colors.primary : "#fff"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.premiumTitle, { color: isSubscribed ? colors.foreground : "#fff" }]}>
            {isSubscribed ? "FastPlan Premium active" : "Get FastPlan Premium"}
          </Text>
          <Text style={[styles.premiumDesc, { color: isSubscribed ? colors.mutedForeground : "rgba(255,255,255,0.85)" }]}>
            {isSubscribed
              ? "Tap to manage or restore"
              : "AI scans, full nutrition, and more"}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={isSubscribed ? colors.mutedForeground : "#fff"} />
      </Pressable>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>YOUR STATS</Text>
        <StatRow label="Started" value={startDate ? new Date(startDate + "T00:00:00").toLocaleDateString() : "Not started"} icon="calendar" colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatRow label="Days completed" value={String(completedDays)} icon="check-circle" colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatRow label="Current streak" value={`${streak} days`} icon="zap" colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatRow label="Longest streak" value={`${longestStreak} days`} icon="award" colors={colors} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>NOTIFICATIONS</Text>
        <View style={styles.notifRow}>
          <View style={styles.notifLeft}>
            <Feather name="bell" size={16} color={colors.mutedForeground} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statLabel, { color: colors.foreground }]}>Daily reminder</Text>
              <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
                Get a 9am alert telling you if it's a fast or eat day.
              </Text>
            </View>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={handleNotifToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>HOW IT WORKS</Text>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: colors.fastPrimary + "20" }]}>
            <Feather name="moon" size={16} color={colors.fastPrimary} />
          </View>
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Fast Days</Text>
            <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>Consume zero calories. Water, black coffee, and tea are fine.</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: colors.eatPrimary + "20" }]}>
            <Feather name="sun" size={16} color={colors.eatPrimary} />
          </View>
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Eat Days</Text>
            <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>Eat whatever you like, but try to make mindful choices.</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: colors.streakGold + "20" }]}>
            <Feather name="zap" size={16} color={colors.streakGold} />
          </View>
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Streaks</Text>
            <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>Complete consecutive days to build your streak and unlock badges.</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.changeStartBtn, { borderColor: colors.primary + "50", backgroundColor: colors.primary + "10" }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Feather name="calendar" size={18} color={colors.primary} />
        <Text style={[styles.changeStartText, { color: colors.primary }]}>Change Start Date</Text>
      </Pressable>

      <Pressable
        style={[styles.resetBtn, { borderColor: colors.destructive + "50" }]}
        onPress={handleReset}
      >
        <Feather name="trash-2" size={18} color={colors.destructive} />
        <Text style={[styles.resetText, { color: colors.destructive }]}>Reset All Data</Text>
      </Pressable>
    </ScrollView>
    <Paywall visible={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </>
  );
}

function StatRow({ label, value, icon, colors }: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        <Feather name={icon} size={16} color={colors.mutedForeground} />
        <Text style={[styles.statLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  pageTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  themeSegment: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  themeLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  divider: { height: 1, marginVertical: 8 },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  statLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  statLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  infoItem: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  infoDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  changeStartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
  },
  changeStartText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
  },
  resetText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  notifRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  premiumCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, marginBottom: 16 },
  premiumIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  premiumTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  premiumDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  notifLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 10 },
});
