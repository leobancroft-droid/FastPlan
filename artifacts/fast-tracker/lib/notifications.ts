import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch {
  Notifications = null;
}

const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;
const SCHEDULE_DAYS = 14;
const STORAGE_KEY_ENABLED = "notifications_enabled";

if (Notifications && Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function isNotificationsEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(STORAGE_KEY_ENABLED);
  return v === "true";
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_ENABLED, enabled ? "true" : "false");
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications || Platform.OS === "web") return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === 3) return true;
    const req = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return Boolean(req.granted || req.ios?.status === 3);
  } catch {
    return false;
  }
}

function buildBody(type: "fast" | "eat"): { title: string; body: string } {
  if (type === "fast") {
    return {
      title: "Today is a Fast Day",
      body: "Stay strong — drink water, log your mood and let the streak grow.",
    };
  }
  return {
    title: "Today is an Eat Day",
    body: "Fuel up well today. Tomorrow's fast will be easier for it.",
  };
}

export async function cancelAllReminders(): Promise<void> {
  if (!Notifications || Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // No-op
  }
}

export async function scheduleDailyReminders(
  getTypeForDate: (dateStr: string) => "fast" | "eat",
): Promise<void> {
  if (!Notifications || Platform.OS === "web") return;
  const enabled = await isNotificationsEnabled();
  if (!enabled) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = new Date();
    for (let offset = 0; offset < SCHEDULE_DAYS; offset++) {
      const target = new Date(now);
      target.setDate(target.getDate() + offset);
      target.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
      if (target.getTime() <= now.getTime()) continue;

      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, "0");
      const dd = String(target.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const type = getTypeForDate(dateStr);
      const { title, body } = buildBody(type);

      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: "default" },
        trigger: { type: "date", date: target } as any,
      });
    }
  } catch {
    // No-op
  }
}
