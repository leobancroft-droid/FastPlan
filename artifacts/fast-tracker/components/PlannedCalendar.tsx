import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { getDiffDays, useFasting } from "@/context/FastingContext";
import type { DayRecord, DayType } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";

type Range = "1M" | "3M" | "6M";

interface PlannedCalendarProps {
  startDate: string;
  history: DayRecord[];
}

interface CalendarDay {
  dateStr: string;
  day: number;
  type: DayType;
  isToday: boolean;
  isFuture: boolean;
  isBeforeStart: boolean;
  record?: DayRecord;
}

interface MonthGroup {
  label: string;
  days: (CalendarDay | null)[];
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildMonthGroups(
  rangeStartStr: string,
  endDateStr: string,
  todayStr: string,
  recordMap: Record<string, DayRecord>,
  resolveType: (dateStr: string) => DayType,
  planStartDate: string,
): MonthGroup[] {
  const start = new Date(rangeStartStr + "T00:00:00");
  const end = new Date(endDateStr + "T00:00:00");

  const groups: MonthGroup[] = [];

  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const label = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (CalendarDay | null)[] = Array(firstDow).fill(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (dateStr > endDateStr) {
        days.push(null);
        continue;
      }
      const diff = getDiffDays(planStartDate, dateStr);
      const isBeforeStart = diff < 0;
      const type: DayType = isBeforeStart ? "eat" : resolveType(dateStr);
      days.push({
        dateStr,
        day: d,
        type,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
        isBeforeStart,
        record: recordMap[dateStr],
      });
    }

    groups.push({ label, days });
    cursor = new Date(year, month + 1, 1);
  }

  return groups;
}

const RANGE_MONTHS: Record<Range, number> = { "1M": 1, "3M": 3, "6M": 6 };
const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function PlannedCalendar({ startDate, history }: PlannedCalendarProps) {
  const colors = useColors();
  const { isDark } = useTheme();
  const { setDayStatus, getTypeForDate, toggleDayType } = useFasting();
  const [range, setRange] = useState<Range>("1M");
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const todayStr = getTodayStr();

  const recordMap = useMemo(() => {
    const map: Record<string, DayRecord> = {};
    history.forEach((r) => (map[r.date] = r));
    return map;
  }, [history]);

  const { rangeStartStr, endDateStr } = useMemo(() => {
    const today = new Date(todayStr + "T00:00:00");
    const months = RANGE_MONTHS[range];
    const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + months, 0);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { rangeStartStr: fmt(firstOfThisMonth), endDateStr: fmt(lastDay) };
  }, [todayStr, range]);

  const groups = useMemo(
    () => buildMonthGroups(rangeStartStr, endDateStr, todayStr, recordMap, getTypeForDate, startDate),
    [rangeStartStr, endDateStr, todayStr, recordMap, getTypeForDate, startDate]
  );

  const opacity = isDark
    ? { beforeStart: "08", future: "22", past: "40" }
    : { beforeStart: "12", future: "55", past: "85" };

  async function handleAction(status: "completed" | "skipped" | "clear") {
    if (!selected) return;
    await setDayStatus(selected.dateStr, status);
    setSelected(null);
  }

  async function handleSwitch() {
    if (!selected) return;
    await toggleDayType(selected.dateStr);
    const newType: DayType = selected.type === "eat" ? "fast" : "eat";
    setSelected({ ...selected, type: newType });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.rangeBar, { backgroundColor: colors.muted }]}>
        {(["1M", "3M", "6M"] as Range[]).map((r) => (
          <Pressable
            key={r}
            style={[
              styles.rangeBtn,
              range === r && { backgroundColor: colors.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
            ]}
            onPress={() => setRange(r)}
          >
            <Text style={[styles.rangeBtnText, { color: range === r ? colors.primary : colors.mutedForeground }, range === r && { fontFamily: "Inter_700Bold" }]}>
              {r}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.eatPrimary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Eat</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.fastPrimary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Fast</Text>
        </View>
        <View style={styles.legendItem}>
          <Feather name="check" size={10} color={colors.success} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Done</Text>
        </View>
        <View style={styles.legendItem}>
          <Feather name="x" size={10} color={colors.destructive} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Skipped</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Planned</Text>
        </View>
      </View>

      {groups.map((group) => (
        <View key={group.label} style={styles.monthBlock}>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>{group.label}</Text>

          <View style={styles.weekRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={[styles.weekDay, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {group.days.map((cell, idx) => {
              if (!cell) return <View key={`null-${idx}`} style={styles.dayCell} />;

              const isEat = cell.type === "eat";
              const baseColor = isEat ? colors.eatPrimary : colors.fastPrimary;
              const bgOpacity = cell.isBeforeStart ? opacity.beforeStart : cell.isFuture ? opacity.future : opacity.past;
              const textColor = cell.isBeforeStart
                ? colors.mutedForeground
                : isDark
                ? cell.isFuture ? baseColor + "cc" : baseColor
                : "#1a1a2e";

              const completed = cell.record?.status === "completed";
              const skipped = cell.record?.status === "skipped";
              const tappable = !cell.isBeforeStart;

              return (
                <Pressable
                  key={cell.dateStr}
                  onPress={() => tappable && setSelected(cell)}
                  disabled={!tappable}
                  style={({ pressed }) => [
                    styles.dayCellWrap,
                    pressed && tappable && { opacity: 0.6 },
                  ]}
                >
                  <View
                    style={[
                      styles.dayCellInner,
                      {
                        backgroundColor: cell.isBeforeStart ? "transparent" : baseColor + bgOpacity,
                        borderRadius: 8,
                        borderWidth: cell.isToday ? 2 : 0,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.dayNum, { color: textColor, fontFamily: cell.isToday ? "Inter_700Bold" : "Inter_500Medium" }]}>
                      {cell.day}
                    </Text>
                    {completed && <Feather name="check" size={9} color={isDark ? colors.success : "#0a7a5a"} />}
                    {skipped && <Feather name="x" size={9} color={colors.destructive} />}
                    {!completed && !skipped && !cell.isFuture && !cell.isBeforeStart && cell.dateStr < todayStr && (
                      <View style={[styles.missedDot, { backgroundColor: colors.mutedForeground + "60" }]} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <DayActionModal
        day={selected}
        onClose={() => setSelected(null)}
        onAction={handleAction}
        onSwitch={handleSwitch}
        isFuture={selected?.isFuture ?? false}
      />
    </View>
  );
}

interface DayActionModalProps {
  day: CalendarDay | null;
  onClose: () => void;
  onAction: (status: "completed" | "skipped" | "clear") => void;
  onSwitch: () => void;
  isFuture: boolean;
}

function DayActionModal({ day, onClose, onAction, onSwitch, isFuture }: DayActionModalProps) {
  const colors = useColors();
  if (!day) return null;

  const isEat = day.type === "eat";
  const accent = isEat ? colors.eatPrimary : colors.fastPrimary;
  const dateLabel = new Date(day.dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const status = day.record?.status;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.sheetHandle} />
          <View style={[styles.sheetTypeBadge, { backgroundColor: accent + "20" }]}>
            <View style={[styles.sheetTypeDot, { backgroundColor: accent }]} />
            <Text style={[styles.sheetTypeText, { color: accent }]}>{isEat ? "EAT DAY" : "FAST DAY"}</Text>
          </View>
          <Text style={[styles.sheetDate, { color: colors.foreground }]}>{dateLabel}</Text>
          {day.isToday && (
            <Text style={[styles.sheetTodayBadge, { color: colors.primary }]}>TODAY</Text>
          )}

          {isFuture ? (
            <Text style={[styles.sheetInfo, { color: colors.mutedForeground }]}>
              {isEat ? "An eating day is planned." : "A fast day is planned."} Come back when this day arrives to mark it.
            </Text>
          ) : (
            <View style={styles.sheetActions}>
              <ActionBtn
                icon="check-circle"
                label="Mark Complete"
                color={colors.success}
                active={status === "completed"}
                onPress={() => onAction("completed")}
              />
              <ActionBtn
                icon="x-circle"
                label="Mark Skipped"
                color={colors.destructive}
                active={status === "skipped"}
                onPress={() => onAction("skipped")}
              />
              {status && (
                <ActionBtn
                  icon="rotate-ccw"
                  label="Clear status"
                  color={colors.mutedForeground}
                  active={false}
                  onPress={() => onAction("clear")}
                />
              )}
            </View>
          )}

          {!day.isBeforeStart && (
            <Pressable
              style={[styles.switchBtn, { backgroundColor: (isEat ? colors.fastPrimary : colors.eatPrimary) + "18", borderColor: isEat ? colors.fastPrimary : colors.eatPrimary }]}
              onPress={onSwitch}
            >
              <Feather name="repeat" size={16} color={isEat ? colors.fastPrimary : colors.eatPrimary} />
              <Text style={[styles.switchBtnText, { color: isEat ? colors.fastPrimary : colors.eatPrimary }]}>
                Switch to {isEat ? "Fast" : "Eat"} Day
              </Text>
            </Pressable>
          )}

          <Pressable style={[styles.closeBtn, { backgroundColor: colors.muted }]} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: colors.foreground }]}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActionBtn({ icon, label, color, active, onPress }: { icon: string; label: string; color: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionBtn,
        {
          backgroundColor: active ? color + "18" : colors.muted,
          borderColor: active ? color : "transparent",
        },
      ]}
    >
      <Feather name={icon as any} size={18} color={color} />
      <Text style={[styles.actionBtnText, { color: active ? color : colors.foreground }]}>{label}</Text>
      {active && <Feather name="check" size={16} color={color} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  rangeBar: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    gap: 4,
    alignSelf: "flex-start",
  },
  rangeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rangeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  monthBlock: { gap: 6 },
  monthLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  weekRow: {
    flexDirection: "row",
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCellWrap: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 1,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayCellInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  dayNum: {
    fontSize: 12,
  },
  missedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 12,
    alignItems: "center",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#999",
    opacity: 0.3,
    marginBottom: 8,
  },
  sheetTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  sheetTypeDot: { width: 6, height: 6, borderRadius: 3 },
  sheetTypeText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  sheetDate: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  sheetTodayBadge: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginTop: -4,
  },
  sheetInfo: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
    marginVertical: 8,
  },
  sheetActions: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionBtnText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  switchBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 4,
  },
  switchBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    alignSelf: "stretch",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
