import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { derivePersonalProfile, type UserProfile } from "@/lib/personalization";

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
  onboardingComplete: boolean;
  onboardingAnswers: Record<string, string | string[]> | null;
  userProfile: UserProfile | null;
  planIntroSeen: boolean;
  markPlanIntroSeen: () => Promise<void>;
  markComplete: () => Promise<void>;
  markSkipped: () => Promise<void>;
  setDayStatus: (dateStr: string, status: DayStatus | "clear") => Promise<void>;
  waterToday: number;
  waterGoal: number;
  glassSize: number;
  addGlass: () => Promise<void>;
  removeGlass: () => Promise<void>;
  setWaterGoal: (ml: number) => Promise<void>;
  weightKg: number | null;
  weightGoalKg: number | null;
  weightUnit: "kg" | "lb";
  setWeightKg: (kg: number | null) => Promise<void>;
  setWeightGoalKg: (kg: number | null) => Promise<void>;
  setWeightUnit: (unit: "kg" | "lb") => Promise<void>;
  resetAll: () => Promise<void>;
  getTodayType: () => DayType;
  getTypeForDate: (dateStr: string) => DayType;
  setStartDateExplicit: (dateStr: string) => Promise<void>;
  completeOnboarding: (answers: Record<string, string | string[]>) => Promise<void>;
}

const FastingContext = createContext<FastingContextType | null>(null);

export function getDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getTodayStr(): string {
  return getDateStr(new Date());
}

export function getDiffDays(startDate: string, targetDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const target = new Date(targetDate + "T00:00:00");
  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysSince(startDate: string): number {
  return getDiffDays(startDate, getTodayStr());
}

export function FastingProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<string, string | string[]> | null>(null);
  const [planIntroSeen, setPlanIntroSeen] = useState(false);
  const [waterToday, setWaterToday] = useState(0);
  const [waterDate, setWaterDate] = useState<string>(getTodayStr());
  const [waterGoal, setWaterGoalState] = useState(2000);
  const [weightKg, setWeightKgState] = useState<number | null>(null);
  const [weightGoalKg, setWeightGoalKgState] = useState<number | null>(null);
  const [weightUnit, setWeightUnitState] = useState<"kg" | "lb">("kg");
  const [loaded, setLoaded] = useState(false);
  const glassSize = 250;

  const userProfile = useMemo(() => derivePersonalProfile(onboardingAnswers), [onboardingAnswers]);

  const fastQuote = React.useMemo(() => {
    const idx = Math.floor(Math.random() * FAST_QUOTES.length);
    return FAST_QUOTES[idx];
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [histRaw, badgeRaw, startRaw, onboardRaw, answersRaw, introRaw, waterRaw, goalRaw, wRaw, wGoalRaw, wUnitRaw] = await Promise.all([
        AsyncStorage.getItem("fasting_history"),
        AsyncStorage.getItem("fasting_badges"),
        AsyncStorage.getItem("fasting_start"),
        AsyncStorage.getItem("onboarding_complete"),
        AsyncStorage.getItem("onboarding_answers"),
        AsyncStorage.getItem("plan_intro_seen"),
        AsyncStorage.getItem("water_today"),
        AsyncStorage.getItem("water_goal"),
        AsyncStorage.getItem("weight_kg"),
        AsyncStorage.getItem("weight_goal_kg"),
        AsyncStorage.getItem("weight_unit"),
      ]);
      setHistory(histRaw ? JSON.parse(histRaw) : []);
      setBadges(badgeRaw ? JSON.parse(badgeRaw) : BADGES);
      setStartDate(startRaw ?? null);
      setOnboardingComplete(onboardRaw === "true");
      setOnboardingAnswers(answersRaw ? JSON.parse(answersRaw) : null);
      setPlanIntroSeen(introRaw === "true");
      if (waterRaw) {
        const parsed = JSON.parse(waterRaw) as { date: string; ml: number };
        if (parsed.date === getTodayStr()) {
          setWaterToday(parsed.ml);
          setWaterDate(parsed.date);
        } else {
          setWaterToday(0);
          setWaterDate(getTodayStr());
        }
      }
      if (goalRaw) setWaterGoalState(Number(goalRaw) || 2000);
      if (wRaw) setWeightKgState(Number(wRaw));
      if (wGoalRaw) setWeightGoalKgState(Number(wGoalRaw));
      if (wUnitRaw === "kg" || wUnitRaw === "lb") setWeightUnitState(wUnitRaw);
    } catch {}
    setLoaded(true);
  }

  const completeOnboarding = useCallback(async (answers: Record<string, string | string[]>) => {
    setOnboardingAnswers(answers);
    setOnboardingComplete(true);
    await Promise.all([
      AsyncStorage.setItem("onboarding_answers", JSON.stringify(answers)),
      AsyncStorage.setItem("onboarding_complete", "true"),
    ]);
  }, []);

  const markPlanIntroSeen = useCallback(async () => {
    setPlanIntroSeen(true);
    await AsyncStorage.setItem("plan_intro_seen", "true");
  }, []);

  const getTypeForDate = useCallback((dateStr: string): DayType => {
    if (!startDate) return "eat";
    const diff = getDiffDays(startDate, dateStr);
    if (diff < 0) return "eat";
    return diff % 2 === 0 ? "eat" : "fast";
  }, [startDate]);

  const getTodayType = useCallback((): DayType => {
    return getTypeForDate(getTodayStr());
  }, [getTypeForDate]);

  const today = React.useMemo((): DayRecord | null => {
    if (!loaded) return null;
    const todayStr = getTodayStr();
    const existing = history.find((d) => d.date === todayStr);
    if (existing) return existing;
    return { date: todayStr, type: startDate ? getTodayType() : "eat", status: "pending" };
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
        const diff = Math.abs((new Date(todayStr).getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 2) break;
      } else {
        const prev = completed[i - 1];
        const diff = Math.abs((new Date(prev.date).getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24));
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
      const diff = Math.abs((new Date(completed[i].date).getTime() - new Date(completed[i - 1].date).getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= 2) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
      else curStreak = 1;
    }
    return maxStreak;
  }, [history]);

  async function checkAndUnlockBadges(currentStreak: number) {
    const updated = badges.map((b) =>
      !b.unlocked && currentStreak >= b.requiredStreak
        ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() }
        : b
    );
    setBadges(updated);
    await AsyncStorage.setItem("fasting_badges", JSON.stringify(updated));
  }

  const setStartDateExplicit = useCallback(async (dateStr: string) => {
    setStartDate(dateStr);
    await AsyncStorage.setItem("fasting_start", dateStr);
  }, []);

  const markComplete = useCallback(async () => {
    const todayStr = getTodayStr();
    let newStart = startDate;
    if (!startDate) {
      newStart = todayStr;
      setStartDate(newStart);
      await AsyncStorage.setItem("fasting_start", newStart);
    }
    const type = newStart ? (getDiffDays(newStart, todayStr) % 2 === 0 ? "eat" : "fast") : "eat";
    const record: DayRecord = { date: todayStr, type, status: "completed", completedAt: new Date().toISOString() };
    const newHistory = [...history.filter((d) => d.date !== todayStr), record].sort((a, b) => b.date.localeCompare(a.date));
    setHistory(newHistory);
    await AsyncStorage.setItem("fasting_history", JSON.stringify(newHistory));
    await checkAndUnlockBadges(streak + 1);
  }, [history, startDate, streak, badges]);

  const persistWater = useCallback(async (ml: number) => {
    const today = getTodayStr();
    setWaterToday(ml);
    setWaterDate(today);
    await AsyncStorage.setItem("water_today", JSON.stringify({ date: today, ml }));
  }, []);

  const addGlass = useCallback(async () => {
    const todayStr = getTodayStr();
    const base = waterDate === todayStr ? waterToday : 0;
    await persistWater(Math.min(base + glassSize, waterGoal * 2));
  }, [waterToday, waterDate, waterGoal, persistWater]);

  const removeGlass = useCallback(async () => {
    const todayStr = getTodayStr();
    const base = waterDate === todayStr ? waterToday : 0;
    await persistWater(Math.max(base - glassSize, 0));
  }, [waterToday, waterDate, persistWater]);

  const setWaterGoal = useCallback(async (ml: number) => {
    const clamped = Math.max(500, Math.min(ml, 6000));
    setWaterGoalState(clamped);
    await AsyncStorage.setItem("water_goal", String(clamped));
  }, []);

  const setWeightKg = useCallback(async (kg: number | null) => {
    setWeightKgState(kg);
    if (kg === null) await AsyncStorage.removeItem("weight_kg");
    else await AsyncStorage.setItem("weight_kg", String(kg));
  }, []);

  const setWeightGoalKg = useCallback(async (kg: number | null) => {
    setWeightGoalKgState(kg);
    if (kg === null) await AsyncStorage.removeItem("weight_goal_kg");
    else await AsyncStorage.setItem("weight_goal_kg", String(kg));
  }, []);

  const setWeightUnit = useCallback(async (unit: "kg" | "lb") => {
    setWeightUnitState(unit);
    await AsyncStorage.setItem("weight_unit", unit);
  }, []);

  const setDayStatus = useCallback(async (dateStr: string, status: DayStatus | "clear") => {
    const filtered = history.filter((d) => d.date !== dateStr);
    let newHistory: DayRecord[];
    if (status === "clear" || status === "pending") {
      newHistory = filtered;
    } else {
      const type: DayType = startDate ? (getDiffDays(startDate, dateStr) % 2 === 0 ? "eat" : "fast") : "eat";
      const record: DayRecord = {
        date: dateStr,
        type,
        status,
        completedAt: status === "completed" ? new Date().toISOString() : undefined,
      };
      newHistory = [...filtered, record];
    }
    newHistory.sort((a, b) => b.date.localeCompare(a.date));
    setHistory(newHistory);
    await AsyncStorage.setItem("fasting_history", JSON.stringify(newHistory));
  }, [history, startDate]);

  const markSkipped = useCallback(async () => {
    const todayStr = getTodayStr();
    const record: DayRecord = { date: todayStr, type: getTodayType(), status: "skipped" };
    const newHistory = [...history.filter((d) => d.date !== todayStr), record].sort((a, b) => b.date.localeCompare(a.date));
    setHistory(newHistory);
    await AsyncStorage.setItem("fasting_history", JSON.stringify(newHistory));
  }, [history, getTodayType]);

  const resetAll = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem("fasting_history"),
      AsyncStorage.removeItem("fasting_badges"),
      AsyncStorage.removeItem("fasting_start"),
      AsyncStorage.removeItem("onboarding_complete"),
      AsyncStorage.removeItem("onboarding_answers"),
      AsyncStorage.removeItem("plan_intro_seen"),
      AsyncStorage.removeItem("water_today"),
      AsyncStorage.removeItem("water_goal"),
      AsyncStorage.removeItem("weight_kg"),
      AsyncStorage.removeItem("weight_goal_kg"),
      AsyncStorage.removeItem("weight_unit"),
    ]);
    setHistory([]);
    setBadges(BADGES);
    setStartDate(null);
    setOnboardingComplete(false);
    setOnboardingAnswers(null);
    setPlanIntroSeen(false);
    setWaterToday(0);
    setWaterGoalState(2000);
    setWeightKgState(null);
    setWeightGoalKgState(null);
    setWeightUnitState("kg");
  }, []);

  if (!loaded) return null;

  return (
    <FastingContext.Provider value={{ today, history, streak, longestStreak, badges, startDate, fastQuote, onboardingComplete, onboardingAnswers, userProfile, planIntroSeen, markPlanIntroSeen, markComplete, markSkipped, setDayStatus, waterToday: waterDate === getTodayStr() ? waterToday : 0, waterGoal, glassSize, addGlass, removeGlass, setWaterGoal, weightKg, weightGoalKg, weightUnit, setWeightKg, setWeightGoalKg, setWeightUnit, resetAll, getTodayType, getTypeForDate, setStartDateExplicit, completeOnboarding }}>
      {children}
    </FastingContext.Provider>
  );
}

export function useFasting() {
  const ctx = useContext(FastingContext);
  if (!ctx) throw new Error("useFasting must be used within FastingProvider");
  return ctx;
}
