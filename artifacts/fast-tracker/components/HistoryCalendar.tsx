import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { DayRecord } from "@/context/FastingContext";

interface HistoryCalendarProps {
  history: DayRecord[];
}

function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function HistoryCalendar({ history }: HistoryCalendarProps) {
  const colors = useColors();
  const days = getLastNDays(30);
  const recordMap = React.useMemo(() => {
    const map: Record<string, DayRecord> = {};
    history.forEach((d) => (map[d.date] = d));
    return map;
  }, [history]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>Last 30 Days</Text>
      <View style={styles.grid}>
        {days.map((dateStr) => {
          const record = recordMap[dateStr];
          const isToday = dateStr === today;

          let dotColor = colors.border;
          let icon: React.ComponentProps<typeof Feather>["name"] | null = null;

          if (record) {
            if (record.status === "completed") {
              dotColor = record.type === "fast" ? colors.fastPrimary : colors.eatPrimary;
              icon = record.type === "fast" ? "moon" : "sun";
            } else if (record.status === "skipped") {
              dotColor = colors.destructive + "60";
              icon = "x";
            }
          }

          return (
            <View
              key={dateStr}
              style={[
                styles.dayCell,
                {
                  backgroundColor: record?.status === "completed"
                    ? dotColor + "20"
                    : colors.card,
                  borderColor: isToday ? colors.primary : colors.border,
                  borderWidth: isToday ? 2 : 1,
                },
              ]}
            >
              <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
                {getDayLabel(dateStr)}
              </Text>
              <View style={[styles.dot, { backgroundColor: dotColor }]}>
                {icon && (
                  <Feather
                    name={icon}
                    size={10}
                    color="#fff"
                  />
                )}
              </View>
              <Text style={[styles.dateNum, { color: isToday ? colors.primary : colors.foreground }]}>
                {new Date(dateStr + "T00:00:00").getDate()}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.fastPrimary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Fast completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.eatPrimary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Eat completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.destructive + "60" }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Skipped</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  dayCell: {
    width: "13%",
    aspectRatio: 0.8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  dayLabel: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  dateNum: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
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
});
