import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getDiffDays } from "@/context/FastingContext";
import type { DayRecord, DayType } from "@/context/FastingContext";
import { useColors } from "@/hooks/useColors";

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

function buildMonthGroups(startDate: string, endDateStr: string, todayStr: string, recordMap: Record<string, DayRecord>): MonthGroup[] {
  const start = new Date(startDate + "T00:00:00");
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
      const diff = getDiffDays(startDate, dateStr);
      const isBeforeStart = diff < 0;
      const type: DayType = isBeforeStart ? "eat" : diff % 2 === 0 ? "eat" : "fast";
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
  const [range, setRange] = useState<Range>("1M");
  const todayStr = getTodayStr();

  const recordMap = useMemo(() => {
    const map: Record<string, DayRecord> = {};
    history.forEach((r) => (map[r.date] = r));
    return map;
  }, [history]);

  const endDateStr = useMemo(() => addMonths(startDate, RANGE_MONTHS[range]), [startDate, range]);

  const groups = useMemo(
    () => buildMonthGroups(startDate, endDateStr, todayStr, recordMap),
    [startDate, endDateStr, todayStr, recordMap]
  );

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
              const bgOpacity = cell.isBeforeStart ? "08" : cell.isFuture ? "18" : "35";
              const textColor = cell.isBeforeStart
                ? colors.mutedForeground
                : cell.isFuture
                ? baseColor + "99"
                : baseColor;

              const completed = cell.record?.status === "completed";
              const skipped = cell.record?.status === "skipped";

              return (
                <View
                  key={cell.dateStr}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: cell.isBeforeStart ? "transparent" : baseColor + bgOpacity,
                      borderRadius: 8,
                      borderWidth: cell.isToday ? 2 : 0,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={[styles.dayNum, { color: textColor, fontFamily: cell.isToday ? "Inter_700Bold" : "Inter_400Regular" }]}>
                    {cell.day}
                  </Text>
                  {completed && <Feather name="check" size={8} color={colors.success} />}
                  {skipped && <Feather name="x" size={8} color={colors.destructive} />}
                  {!completed && !skipped && !cell.isFuture && !cell.isBeforeStart && cell.dateStr < todayStr && (
                    <View style={[styles.missedDot, { backgroundColor: colors.mutedForeground + "60" }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
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
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    marginVertical: 1,
  },
  dayNum: {
    fontSize: 11,
  },
  missedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
