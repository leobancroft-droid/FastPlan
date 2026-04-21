import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTodayStr(): string {
  const d = new Date();
  return formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
}

interface StartDatePickerProps {
  visible: boolean;
  onConfirm: (dateStr: string) => void;
}

export function StartDatePicker({ visible, onConfirm }: StartDatePickerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string>(
    formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const todayStr = getTodayStr();

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedParts = selected.split("-").map(Number);
  const selectedYear = selectedParts[0];
  const selectedMonth = selectedParts[1] - 1;
  const selectedDay = selectedParts[2];

  function formatDisplay(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingTop: 28 + (Platform.OS === "web" ? 0 : 0) }]}>
          <View style={styles.header}>
            <Feather name="moon" size={28} color={colors.fastPrimary} />
            <Text style={[styles.title, { color: colors.foreground }]}>Choose Your Start Date</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Your start date is always an Eat Day. Fast days alternate from there.
            </Text>
          </View>

          <View style={[styles.calendarCard, { backgroundColor: colors.background }]}>
            <View style={styles.navRow}>
              <Pressable onPress={prevMonth} style={styles.navBtn}>
                <Feather name="chevron-left" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.monthLabel, { color: colors.foreground }]}>
                {formatMonthYear(viewYear, viewMonth)}
              </Text>
              <Pressable onPress={nextMonth} style={styles.navBtn}>
                <Feather name="chevron-right" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {DAYS_OF_WEEK.map((d) => (
                <Text key={d} style={[styles.weekDay, { color: colors.mutedForeground }]}>{d}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (!day) return <View key={`empty-${idx}`} style={styles.cell} />;

                const dateStr = formatDateStr(viewYear, viewMonth, day);
                const isSelected = selectedYear === viewYear && selectedMonth === viewMonth && selectedDay === day;
                const isToday = dateStr === todayStr;

                return (
                  <Pressable
                    key={dateStr}
                    style={[
                      styles.cell,
                      isSelected && { backgroundColor: colors.primary, borderRadius: 12 },
                      !isSelected && isToday && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 12 },
                    ]}
                    onPress={() => setSelected(dateStr)}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        { color: isSelected ? colors.primaryForeground : isToday ? colors.primary : colors.foreground },
                        isSelected && { fontFamily: "Inter_700Bold" },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.selectedRow, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
            <Feather name="sun" size={16} color={colors.eatPrimary} />
            <Text style={[styles.selectedText, { color: colors.foreground }]}>
              <Text style={{ fontFamily: "Inter_700Bold" }}>Eat Day: </Text>
              {formatDisplay(selected)}
            </Text>
          </View>

          <Pressable
            style={[styles.confirmBtn, { backgroundColor: "#a855f7" }]}
            onPress={() => onConfirm(selected)}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.confirmText}>Start Fasting</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sheet: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 28,
    padding: 24,
    gap: 16,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
  },
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  navBtn: {
    padding: 6,
  },
  monthLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectedText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  confirmBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
