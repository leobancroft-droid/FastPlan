import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  FAST_PRESETS,
  type FastPreset,
  type FastPresetKey,
  useFasting,
} from "@/context/FastingContext";

interface Props {
  visible: boolean;
  mode: "schedule" | "start-now";
  onClose: () => void;
  onScheduled?: () => void;
}

type StartChoice = "now" | "tonight" | "tomorrow" | "custom";

function nextTonight8pm(): Date {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  if (d.getTime() < Date.now() + 30 * 60 * 1000) d.setDate(d.getDate() + 1);
  return d;
}

function tomorrow7am(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(7, 0, 0, 0);
  return d;
}

function formatStart(d: Date): string {
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const tmw = new Date();
  tmw.setDate(tmw.getDate() + 1);
  const isTmw =
    d.getFullYear() === tmw.getFullYear() &&
    d.getMonth() === tmw.getMonth() &&
    d.getDate() === tmw.getDate();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  if (isTmw) return `Tomorrow, ${time}`;
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ScheduleFastModal({ visible, mode, onClose, onScheduled }: Props) {
  const colors = useColors();
  const { scheduleFast, startFastNow } = useFasting();
  const [selectedKey, setSelectedKey] = useState<FastPresetKey>("16:8");
  const [customHours, setCustomHours] = useState("12");
  const [startChoice, setStartChoice] = useState<StartChoice>(mode === "start-now" ? "now" : "tonight");
  const [customOffset, setCustomOffset] = useState("2");

  const presets = FAST_PRESETS;
  const selectedPreset: FastPreset | { key: "custom"; label: string; hours: number } = useMemo(() => {
    if (selectedKey === "custom") {
      const h = Math.max(1, Math.min(120, Number(customHours) || 1));
      return { key: "custom", label: `${h}h custom`, hours: h };
    }
    return presets.find((p) => p.key === selectedKey) ?? presets[0];
  }, [selectedKey, customHours]);

  const startDate: Date = useMemo(() => {
    if (mode === "start-now" || startChoice === "now") return new Date();
    if (startChoice === "tonight") return nextTonight8pm();
    if (startChoice === "tomorrow") return tomorrow7am();
    const offsetHrs = Math.max(0.25, Math.min(168, Number(customOffset) || 1));
    return new Date(Date.now() + offsetHrs * 60 * 60 * 1000);
  }, [mode, startChoice, customOffset]);

  const endDate = new Date(startDate.getTime() + selectedPreset.hours * 60 * 60 * 1000);

  async function handleConfirm() {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (mode === "start-now" || startChoice === "now") {
      await startFastNow(selectedPreset.key as FastPresetKey, selectedPreset.label, selectedPreset.hours);
    } else {
      await scheduleFast(selectedPreset.key as FastPresetKey, selectedPreset.label, startDate, selectedPreset.hours);
    }
    onScheduled?.();
    onClose();
  }

  const groups: { label: string; category: FastPreset["category"] }[] = [
    { label: "Beginner", category: "beginner" },
    { label: "Intermediate", category: "intermediate" },
    { label: "Extended", category: "extended" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {mode === "start-now" ? "Start a fast" : "Schedule a fast"}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingBottom: 16 }}>
            <Text style={[styles.section, { color: colors.mutedForeground }]}>FAST LENGTH</Text>
            {groups.map((g) => (
              <View key={g.category} style={{ marginBottom: 12 }}>
                <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>{g.label}</Text>
                <View style={styles.presetRow}>
                  {presets
                    .filter((p) => p.category === g.category)
                    .map((p) => {
                      const active = selectedKey === p.key;
                      return (
                        <Pressable
                          key={p.key}
                          onPress={() => setSelectedKey(p.key)}
                          style={({ pressed }) => [
                            styles.presetChip,
                            {
                              borderColor: active ? colors.primary : colors.border,
                              backgroundColor: active ? colors.primary + "20" : "transparent",
                            },
                            pressed && { opacity: 0.7 },
                          ]}
                        >
                          <Text style={[styles.presetTitle, { color: active ? colors.primary : colors.foreground }]}>
                            {p.label}
                          </Text>
                          <Text style={[styles.presetDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                            {p.description}
                          </Text>
                        </Pressable>
                      );
                    })}
                </View>
              </View>
            ))}

            <Pressable
              onPress={() => setSelectedKey("custom")}
              style={({ pressed }) => [
                styles.customBox,
                {
                  borderColor: selectedKey === "custom" ? colors.primary : colors.border,
                  backgroundColor: selectedKey === "custom" ? colors.primary + "15" : "transparent",
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.presetTitle, { color: selectedKey === "custom" ? colors.primary : colors.foreground }]}>
                  Custom length
                </Text>
                <Text style={[styles.presetDesc, { color: colors.mutedForeground }]}>
                  Pick your own duration in hours
                </Text>
              </View>
              <View style={[styles.hourInputWrap, { borderColor: colors.border }]}>
                <TextInput
                  value={customHours}
                  onChangeText={setCustomHours}
                  onFocus={() => setSelectedKey("custom")}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={[styles.hourInput, { color: colors.foreground }]}
                />
                <Text style={[styles.hourSuffix, { color: colors.mutedForeground }]}>h</Text>
              </View>
            </Pressable>

            {mode === "schedule" && (
              <>
                <Text style={[styles.section, { color: colors.mutedForeground, marginTop: 18 }]}>STARTS</Text>
                <View style={styles.startRow}>
                  {([
                    { key: "now", label: "Now" },
                    { key: "tonight", label: "Tonight 8 PM" },
                    { key: "tomorrow", label: "Tomorrow 7 AM" },
                    { key: "custom", label: "Custom" },
                  ] as const).map((opt) => {
                    const active = startChoice === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setStartChoice(opt.key as StartChoice)}
                        style={({ pressed }) => [
                          styles.startChip,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? colors.primary + "20" : "transparent",
                          },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={{ color: active ? colors.primary : colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {startChoice === "custom" && (
                  <View style={[styles.customStartRow, { borderColor: colors.border }]}>
                    <Text style={[styles.startLabel, { color: colors.mutedForeground }]}>Start in</Text>
                    <View style={[styles.hourInputWrap, { borderColor: colors.border, marginLeft: 8 }]}>
                      <TextInput
                        value={customOffset}
                        onChangeText={setCustomOffset}
                        keyboardType="decimal-pad"
                        maxLength={4}
                        style={[styles.hourInput, { color: colors.foreground }]}
                      />
                      <Text style={[styles.hourSuffix, { color: colors.mutedForeground }]}>h from now</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            <View style={[styles.summary, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <SummaryRow label="Length" value={`${selectedPreset.hours}h`} colors={colors} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SummaryRow
                label={mode === "start-now" ? "Starts" : "Starts"}
                value={mode === "start-now" ? "Now" : formatStart(startDate)}
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SummaryRow label="Ends" value={formatStart(endDate)} colors={colors} />
            </View>
          </ScrollView>

          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.confirmBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Feather name={mode === "start-now" ? "play" : "calendar"} size={18} color="#fff" />
            <Text style={styles.confirmText}>
              {mode === "start-now" ? "Start fast now" : "Schedule fast"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SummaryRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    maxHeight: "92%",
  },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: "#888", opacity: 0.3, alignSelf: "center", marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  section: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginBottom: 10 },
  groupLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetChip: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 64,
  },
  presetTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  presetDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  customBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 6,
    gap: 12,
  },
  hourInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  hourInput: { fontSize: 16, fontFamily: "Inter_700Bold", minWidth: 36, textAlign: "center" },
  hourSuffix: { fontSize: 13, fontFamily: "Inter_500Medium" },
  startRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  startChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  customStartRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 10,
  },
  startLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  summary: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 18, gap: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  summaryValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  divider: { height: 1 },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 14,
  },
  confirmText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
