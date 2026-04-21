import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

const FEATURES = [
  { icon: "camera", label: "AI Food Scanner — snap any meal" },
  { icon: "bar-chart-2", label: "Full nutrition + macro tracking" },
  { icon: "trending-up", label: "Advanced streaks & badges" },
  { icon: "heart", label: "Apple Health & widget sync" },
  { icon: "bell", label: "Personalised daily reminders" },
] as const;

export function Paywall({ visible, onClose, title, subtitle }: PaywallProps) {
  const colors = useColors();
  const { offerings, purchase, restore, isPurchasing, isRestoring, isLoading, available } = useSubscription();
  const [confirmingPkg, setConfirmingPkg] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const packages = useMemo(() => {
    const current = offerings?.current;
    if (!current) return [];
    const order = ["$rc_lifetime", "$rc_annual", "$rc_monthly"];
    return [...current.availablePackages].sort(
      (a, b) => order.indexOf(a.identifier) - order.indexOf(b.identifier),
    );
  }, [offerings]);

  const yearlyPkg = packages.find((p) => p.identifier === "$rc_annual");
  const monthlyPkg = packages.find((p) => p.identifier === "$rc_monthly");
  const yearlyMonthly = useMemo(() => {
    if (!yearlyPkg) return null;
    const price = yearlyPkg.product.price;
    return price / 12;
  }, [yearlyPkg]);

  async function handleSelect(pkg: any) {
    if (__DEV__ || Platform.OS === "web") {
      setConfirmingPkg(pkg);
      return;
    }
    await runPurchase(pkg);
  }

  async function runPurchase(pkg: any) {
    setErrorMsg(null);
    try {
      await purchase(pkg);
      setConfirmingPkg(null);
      onClose();
    } catch (e: any) {
      if (e?.userCancelled) {
        setConfirmingPkg(null);
        return;
      }
      setErrorMsg(e?.message ?? "Purchase failed");
    }
  }

  async function handleRestore() {
    setErrorMsg(null);
    try {
      const info = await restore();
      if (info?.entitlements?.active?.premium) onClose();
      else setErrorMsg("No previous purchases found.");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Restore failed");
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.crownBadge, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="award" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{title ?? "FastPlan Premium"}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {subtitle ?? "Unlock the full alternate-day fasting experience."}
          </Text>

          <View style={styles.featuresList}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name={f.icon as any} size={16} color={colors.primary} />
                </View>
                <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
              </View>
            ))}
          </View>

          {!available ? (
            <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
              In-app purchases are only available in a custom dev build (not Expo Go or web). Build the app for iOS or Android to test purchases.
            </Text>
          ) : isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : packages.length === 0 ? (
            <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
              Loading plans... if this persists, your store products may need review.
            </Text>
          ) : (
            <View style={styles.plansWrap}>
              {packages.map((pkg) => {
                const isYear = pkg.identifier === "$rc_annual";
                const isLife = pkg.identifier === "$rc_lifetime";
                const period = isLife
                  ? "One-time"
                  : isYear
                    ? "per year"
                    : pkg.identifier === "$rc_monthly"
                      ? "per month"
                      : "";
                const subText =
                  isYear && yearlyMonthly
                    ? `Just ${yearlyPkg!.product.currencyCode} ${yearlyMonthly.toFixed(2)} / month`
                    : isLife
                      ? "Pay once, own forever"
                      : "Cancel anytime";
                return (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => handleSelect(pkg)}
                    style={({ pressed }) => [
                      styles.planCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: isYear ? colors.primary : colors.border,
                      },
                      isYear && { borderWidth: 2 },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    {isYear && (
                      <View style={[styles.bestBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.bestBadgeText}>BEST VALUE</Text>
                      </View>
                    )}
                    <View style={styles.planTopRow}>
                      <Text style={[styles.planName, { color: colors.foreground }]}>
                        {pkg.product.title.replace(/\s*\(.*\)\s*$/, "")}
                      </Text>
                      <Text style={[styles.planPrice, { color: colors.primary }]}>
                        {pkg.product.priceString}
                      </Text>
                    </View>
                    <View style={styles.planBotRow}>
                      <Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>{period}</Text>
                      <Text style={[styles.planSub, { color: colors.mutedForeground }]}>{subText}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {errorMsg && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
          )}

          <Pressable onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn}>
            <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
              {isRestoring ? "Restoring..." : "Restore Purchases"}
            </Text>
          </Pressable>

          <Text style={[styles.tos, { color: colors.mutedForeground }]}>
            Subscriptions auto-renew unless cancelled at least 24 hours before the period ends. Manage anytime in your store account.
          </Text>
        </ScrollView>

        {(isPurchasing || confirmingPkg) && (
          <View style={styles.overlay}>
            <View style={[styles.confirmCard, { backgroundColor: colors.card }]}>
              {isPurchasing ? (
                <>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Processing...</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Confirm purchase</Text>
                  <Text style={[styles.confirmDesc, { color: colors.mutedForeground }]}>
                    {confirmingPkg.product.title} — {confirmingPkg.product.priceString}
                    {"\n\n"}Test store is enabled. No real charge.
                  </Text>
                  <View style={styles.confirmActions}>
                    <Pressable
                      onPress={() => setConfirmingPkg(null)}
                      style={({ pressed }) => [
                        styles.confirmBtn,
                        { backgroundColor: colors.muted },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text style={[styles.confirmBtnText, { color: colors.foreground }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => runPurchase(confirmingPkg)}
                      style={({ pressed }) => [
                        styles.confirmBtn,
                        { backgroundColor: colors.primary },
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text style={[styles.confirmBtnText, { color: "#fff" }]}>Buy</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { position: "absolute", top: 14, right: 14, zIndex: 5, padding: 6 },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40, alignItems: "center" },
  crownBadge: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 24, lineHeight: 21 },
  featuresList: { width: "100%", gap: 12, marginBottom: 24 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featureLabel: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  plansWrap: { width: "100%", gap: 10 },
  planCard: { borderRadius: 16, borderWidth: 1, padding: 16, position: "relative" },
  bestBadge: { position: "absolute", top: -10, right: 14, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bestBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.6 },
  planTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  planName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  planPrice: { fontSize: 18, fontFamily: "Inter_700Bold" },
  planBotRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planPeriod: { fontSize: 12, fontFamily: "Inter_500Medium" },
  planSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 16 },
  restoreBtn: { marginTop: 20, paddingVertical: 8 },
  restoreText: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center" },
  tos: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 16, lineHeight: 16, paddingHorizontal: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 24 },
  confirmCard: { width: "100%", maxWidth: 360, borderRadius: 16, padding: 24, alignItems: "center", gap: 12 },
  confirmTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 8, alignSelf: "stretch" },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  confirmBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
