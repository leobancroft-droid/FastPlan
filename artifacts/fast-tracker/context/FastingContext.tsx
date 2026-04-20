import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type DayType = "eat" | "fast";
export type DayStatus = "pending" | "completed" | "skipped";

export interface DayRecord {
  date: string;
  type: DayType;
  status: DayStatus;
  completedAt?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  requiredStreak: number;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const BADGES: Badge[] = [
  { id: "first_fast", name: "First Fast", description: "Complete your first fast day", requiredStreak: 1, icon: "moon", unlocked: false },
  { id: "streak_3", name: "3-Day Warrior", description: "3-day streak", requiredStreak: 3, icon: "zap", unlocked: false },
  { id: "streak_7", name: "Week Champion", description: "7-day streak", requiredStreak: 7, icon: "star", unlocked: false },
  { id: "streak_14", name: "Fortnight Fighter", description: "14-day streak", requiredStreak: 14, icon: "award", unlocked: false },
  { id: "streak_30", name: "Monthly Master", description: "30-day streak", requiredStreak: 30, icon: "shield", unlocked: false },
  { id: "streak_60", name: "Diamond Mind", description: "60-day streak", requiredStreak: 60, icon: "hexagon", unlocked: false },
];

const FAST_QUOTES = [
  "Every hour you fast, your body heals. Keep going.",
  "Hunger is weakness leaving the body.",
  "The discipline you build today shapes who you become tomorrow.",
  "You are stronger than you feel right now.",
  "Embrace the fast. This is where the magic happens.",
  "Your body is doing incredible things right now.",
  "Fasting is not starvation — it is healing.",
  "Control what you can. Today, you are in control.",
  "This discomfort is temporary. The benefits are lasting.",
  "You've done this before. You can do it again.",
  "Silence your appetite. Find your strength.",
  "The best view comes after the hardest climb.",
  "Your future self is grateful for what you're doing now.",
  "Rest is action. Fasting is power.",
  "Be proud. Most people quit. You haven't.",
];

interface FastingContextType {
  today: DayRecord | null;
  history: DayRecord[];
  streak: number;
  longestStreak: number;
  badges: Badge[];
  startDate: string | null;
  fastQuote: string;
  markComplete: () => Promise<void>;
  markSkipped: () => Promise<void>;
  resetAll: () => Promise<void>;
  getTodayType: () => DayType;
}

const FastingContext = createContext<FastingContextType | null>(null);

function getDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getTodayStr(): string {
  return getDateStr(new Date());
}

function getDaysSince(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function FastingProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fastQuote = React.useMemo(() => {
    const idx = Math.floor(Math.random() * FAST_QUOTES.length);
    return FAST_QUOTES[idx];
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [histRaw, badgeRaw, startRaw] = await Promise.all([
        AsyncStorage.getItem("fasting_history"),
        AsyncStorage.getItem("fasting_badges"),
        AsyncStorage.getItem("fasting_start"),
      ]);

      const hist: DayRecord[] = histRaw ? JSON.parse(histRaw) : [];
      const bdgs: Badge[] = badgeRaw ? JSON.parse(badgeRaw) : BADGES;
      const start: string | null = startRaw ?? null;

      setHistory(hist);
      setBadges(bdgs);
      setStartDate(start);
    } catch {}
    setLoaded(true);
  }

  const getTodayType = useCallback((): DayType => {
    if (!startDate) return "eat";
    const days = getDaysSince(startDate);
    return days % 2 === 0 ? "eat" : "fast";
  }, [startDate]);

  const today = React.useMemo((): DayRecord | null => {
    if (!loaded) return null;
    const todayStr = getTodayStr();
    const existing = history.find((d) => d.date === todayStr);
    if (existing) return existing;

    if (!startDate) {
      return { date: todayStr, type: "eat", status: "pending" };
    }
    return { date: todayStr, type: getTodayType(), status: "pending" };
  }, [history, startDate, loaded, getTodayType]);

  const streak = React.useMemo((): number => {
    const completed = history
      .filter((d) => d.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date));

    if (completed.length === 0) return 0;

    let count = 0;
    const todayStr = getTodayStr();

    for (let i = 0; i < completed.length; i++) {
      const d = completed[i];
      if (i === 0) {
        const diff = Math.abs(
          (new Date(todayStr).getTime() - new Date(d.date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (diff > 2) break;
      } else {
        const prev = completed[i - 1];
        const diff = Math.abs(
          (new Date(prev.date).getTime() - new Date(d.date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (diff > 2) break;
      }
      count++;
    }
    return count;
  }, [history]);

  const longestStreak = React.useMemo((): number => {
    const completed = history
      .filter((d) => d.status === "completed")
      .sort((a, b) => a.date.localeCompare(b.date));

    if (completed.length === 0) return 0;

    let maxStreak = 1;
    let curStreak = 1;

    for (let i = 1; i < completed.length; i++) {
      const prev = completed[i - 1];
      const cur = completed[i];
      const diff = Math.abs(
        (new Date(cur.date).getTime() - new Date(prev.date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (diff <= 2) {
        curStreak++;
        maxStreak = Math.max(maxStreak, curStreak);
      } else {
        curStreak = 1;
      }
    }
    return maxStreak;
  }, [history]);

  async function checkAndUnlockBadges(currentStreak: number) {
    const updatedBadges = badges.map((b) => {
      if (!b.unlocked && currentStreak >= b.requiredStreak) {
        return { ...b, unlocked: true, unlockedAt: new Date().toISOString() };
      }
      return b;
    });
    setBadges(updatedBadges);
    await AsyncStorage.setItem("fasting_badges", JSON.stringify(updatedBadges));
  }

  const markComplete = useCallback(async () => {
    const todayStr = getTodayStr();
    let newStart = startDate;

    if (!startDate) {
      newStart = todayStr;
      setStartDate(newStart);
      await AsyncStorage.setItem("fasting_start", newStart);
    }

    const type = newStart ? (getDaysSince(newStart) % 2 === 0 ? "eat" : "fast") : "eat";

    const record: DayRecord = {
      date: todayStr,
      type,
      status: "completed",
      completedAt: new Date().toISOString(),
    };

    const newHistory = [...history.filter((d) => d.date !== todayStr), record];
    newHistory.sort((a, b) => b.date.localeCompare(a.date));

    setHistory(newHistory);
    await AsyncStorage.setItem("fasting_history", JSON.stringify(newHistory));

    const newStreak = streak + 1;
    await checkAndUnlockBadges(newStreak);
  }, [history, startDate, streak, badges]);

  const markSkipped = useCallback(async () => {
    const todayStr = getTodayStr();
    const type = getTodayType();

    const record: DayRecord = {
      date: todayStr,
      type,
      status: "skipped",
    };

    const newHistory = [...history.filter((d) => d.date !== todayStr), record];
    newHistory.sort((a, b) => b.date.localeCompare(a.date));

    setHistory(newHistory);
    await AsyncStorage.setItem("fasting_history", JSON.stringify(newHistory));
  }, [history, getTodayType]);

  const resetAll = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem("fasting_history"),
      AsyncStorage.removeItem("fasting_badges"),
      AsyncStorage.removeItem("fasting_start"),
    ]);
    setHistory([]);
    setBadges(BADGES);
    setStartDate(null);
  }, []);

  if (!loaded) return null;

  return (
    <FastingContext.Provider
      value={{
        today,
        history,
        streak,
        longestStreak,
        badges,
        startDate,
        fastQuote,
        markComplete,
        markSkipped,
        resetAll,
        getTodayType,
      }}
    >
      {children}
    </FastingContext.Provider>
  );
}

export function useFasting() {
  const ctx = useContext(FastingContext);
  if (!ctx) throw new Error("useFasting must be used within FastingProvider");
  return ctx;
}
