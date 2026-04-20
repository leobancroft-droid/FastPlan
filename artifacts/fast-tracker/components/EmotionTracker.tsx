import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DEFAULT_EMOTIONS, useFasting, type EmotionPreset } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function EmotionTracker() {
  const colors = useColors();
  const { emotionLog, removeEmotionEntry } = useFasting();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const todayStr = getTodayStr();
  const todayEntries = emotionLog.filter((e) => e.date === todayStr);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBubble, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="heart" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Feelings</Text>
        </View>
        <Pressable onPress={() => setHistoryOpen(true)} hitSlop={10}>
          <Text style={[styles.moreBtn, { color: colors.primary }]}>History</Text>
        </Pressable>
      </View>

      {todayEntries.length === 0 ? (
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [
            styles.addEmpty,
            { backgroundColor: colors.muted, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={[styles.addCircle, { borderColor: colors.foreground + "60" }]}>
            <Feather name="plus" size={22} color={colors.foreground} />
          </View>
          <Text style={[styles.addEmptyLabel, { color: colors.mutedForeground }]}>
            Add a feeling
          </Text>
        </Pressable>
      ) : (
        <View style={styles.loggedWrap}>
          <View style={styles.chips}>
            {todayEntries.map((entry) => (
              <Pressable
                key={entry.id}
                onLongPress={() => removeEmotionEntry(entry.id)}
                style={[styles.chip, { backgroundColor: colors.primary + "22" }]}
              >
                <Text style={styles.chipEmoji}>{entry.emoji}</Text>
                <Text style={[styles.chipLabel, { color: colors.foreground }]}>{entry.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={({ pressed }) => [
                styles.chipAdd,
                { backgroundColor: colors.muted, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name="plus" size={14} color={colors.foreground} />
              <Text style={[styles.chipLabel, { color: colors.foreground }]}>Add</Text>
            </Pressable>
          </View>
        </View>
      )}

      <EmotionPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
      <EmotionsManager open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </View>
  );
}

interface PickerProps {
  open: boolean;
  onClose: () => void;
}

function EmotionPicker({ open, onClose }: PickerProps) {
  const colors = useColors();
  const { emotionLog, customEmotions, logEmotion } = useFasting();
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  const presets = useMemo(
    () => [...DEFAULT_EMOTIONS, ...customEmotions].sort((a, b) => a.label.localeCompare(b.label)),
    [customEmotions]
  );

  const todayStr = getTodayStr();
  const todayPresetIds = new Set(emotionLog.filter((e) => e.date === todayStr).map((e) => e.presetId));

  function handleClose() {
    setJustAdded(new Set());
    onClose();
  }

  async function handleSelect(preset: EmotionPreset) {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    await logEmotion(preset);
    setJustAdded((prev) => {
      const next = new Set(prev);
      next.add(preset.id);
      return next;
    });
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.sheetHandle} />

          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Add feelings</Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
            </Pressable>
          </View>

          <Text style={[styles.pickerSubtitle, { color: colors.mutedForeground }]}>
            Tap any feeling to log it for today
          </Text>

          <ScrollView style={styles.pickerScroll} contentContainerStyle={styles.pickerGrid}>
            {presets.map((preset) => {
              const selected = justAdded.has(preset.id) || todayPresetIds.has(preset.id);
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handleSelect(preset)}
                  style={({ pressed }) => [
                    styles.pill,
                    {
                      backgroundColor: selected ? colors.primary + "33" : colors.muted,
                      borderColor: selected ? colors.primary + "88" : "transparent",
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.pillEmoji}>{preset.emoji}</Text>
                  <Text style={[styles.pillLabel, { color: colors.foreground }]}>{preset.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface ManagerProps {
  open: boolean;
  onClose: () => void;
}

function EmotionsManager({ open, onClose }: ManagerProps) {
  const colors = useColors();
  const { emotionLog, customEmotions, addCustomEmotion, removeCustomEmotion, removeEmotionEntry, logEmotion } = useFasting();
  const [tab, setTab] = useState<"history" | "manage">("history");
  const [labelDraft, setLabelDraft] = useState("");
  const [emojiDraft, setEmojiDraft] = useState("");

  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof emotionLog>();
    emotionLog.forEach((e) => {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [emotionLog]);

  async function handleAdd() {
    if (!labelDraft.trim()) return;
    await addCustomEmotion(labelDraft, emojiDraft || "✨");
    setLabelDraft("");
    setEmojiDraft("");
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.sheetHandle} />

          <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
            {(["history", "manage"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabBtn, tab === t && { backgroundColor: colors.card }]}
              >
                <Text style={[styles.tabText, { color: tab === t ? colors.foreground : colors.mutedForeground }]}>
                  {t === "history" ? "History" : "My Emotions"}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "history" ? (
            <ScrollView style={styles.scrollArea} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
              {grouped.length === 0 && (
                <Text style={[styles.empty, { color: colors.mutedForeground }]}>
                  No feelings logged yet. Tap Add to start tracking.
                </Text>
              )}
              {grouped.map(([date, entries]) => (
                <View key={date} style={{ gap: 8 }}>
                  <Text style={[styles.dateHeader, { color: colors.foreground }]}>
                    {formatDateLabel(date)}
                  </Text>
                  {entries.map((entry) => (
                    <View key={entry.id} style={[styles.historyRow, { backgroundColor: colors.muted }]}>
                      <Text style={styles.historyEmoji}>{entry.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyLabel, { color: colors.foreground }]}>{entry.label}</Text>
                        <Text style={[styles.historyTime, { color: colors.mutedForeground }]}>
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </Text>
                      </View>
                      <Pressable onPress={() => removeEmotionEntry(entry.id)} hitSlop={8} style={styles.deleteBtn}>
                        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView style={styles.scrollArea} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
              <Text style={[styles.dateHeader, { color: colors.foreground }]}>Add custom emotion</Text>
              <View style={styles.addRow}>
                <View style={[styles.emojiInputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <TextInput
                    value={emojiDraft}
                    onChangeText={setEmojiDraft}
                    placeholder="🎯"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={4}
                    style={[styles.emojiInput, { color: colors.foreground }]}
                  />
                </View>
                <View style={[styles.labelInputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <TextInput
                    value={labelDraft}
                    onChangeText={setLabelDraft}
                    placeholder="Label (e.g. Motivated)"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={20}
                    style={[styles.labelInput, { color: colors.foreground }]}
                    onSubmitEditing={handleAdd}
                  />
                </View>
                <Pressable
                  onPress={handleAdd}
                  disabled={!labelDraft.trim()}
                  style={[styles.addBtn, { backgroundColor: colors.primary, opacity: labelDraft.trim() ? 1 : 0.4 }]}
                >
                  <Feather name="plus" size={18} color="#fff" />
                </Pressable>
              </View>

              {customEmotions.length > 0 && (
                <>
                  <Text style={[styles.dateHeader, { color: colors.foreground, marginTop: 4 }]}>Your custom emotions</Text>
                  {customEmotions.map((preset) => (
                    <View key={preset.id} style={[styles.historyRow, { backgroundColor: colors.muted }]}>
                      <Text style={styles.historyEmoji}>{preset.emoji}</Text>
                      <Text style={[styles.historyLabel, { color: colors.foreground, flex: 1 }]}>{preset.label}</Text>
                      <Pressable onPress={() => logEmotion(preset)} hitSlop={6} style={[styles.quickLogBtn, { backgroundColor: colors.primary + "20" }]}>
                        <Text style={[styles.quickLogText, { color: colors.primary }]}>Log</Text>
                      </Pressable>
                      <Pressable onPress={() => removeCustomEmotion(preset.id)} hitSlop={8} style={styles.deleteBtn}>
                        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          )}

          <Pressable style={[styles.closeBtn, { backgroundColor: colors.muted }]} onPress={onClose}>
            <Text style={[styles.closeText, { color: colors.foreground }]}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatDateLabel(dateStr: string): string {
  const today = getTodayStr();
  if (dateStr === today) return "Today";
  const d = new Date(dateStr + "T00:00:00");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  moreBtn: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  addEmpty: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  addEmptyLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  loggedWrap: {
    gap: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  chipEmoji: {
    fontSize: 15,
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    gap: 14,
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#999",
    opacity: 0.3,
    alignSelf: "center",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  doneText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  pickerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: -6,
  },
  pickerScroll: {
    maxHeight: 480,
  },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  pillEmoji: {
    fontSize: 16,
  },
  pillLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  tabs: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  scrollArea: {
    maxHeight: 420,
  },
  empty: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 32,
  },
  dateHeader: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  historyEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  historyLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  historyTime: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
  deleteBtn: {
    padding: 6,
  },
  addRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  emojiInputWrap: {
    width: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiInput: {
    fontSize: 22,
    textAlign: "center",
    paddingVertical: 10,
    width: "100%",
  },
  labelInputWrap: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  labelInput: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    paddingVertical: 12,
  },
  addBtn: {
    width: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLogBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickLogText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
