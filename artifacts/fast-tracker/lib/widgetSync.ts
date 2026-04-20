import { Platform } from "react-native";

const APP_GROUP = "group.com.altfast.shared";

let SharedGroupPreferences: any = null;
if (Platform.OS === "ios") {
  try {
    SharedGroupPreferences = require("react-native-shared-group-preferences").default;
  } catch {
    SharedGroupPreferences = null;
  }
}

export interface WidgetState {
  dayType: "fast" | "eat";
  streak: number;
  dateLabel: string;
  kcalGoal: number;
  kcalConsumed: number;
}

export async function syncWidgetState(state: WidgetState): Promise<void> {
  if (Platform.OS !== "ios" || !SharedGroupPreferences) return;
  try {
    await SharedGroupPreferences.setItem("dayType", state.dayType, APP_GROUP);
    await SharedGroupPreferences.setItem("streak", state.streak, APP_GROUP);
    await SharedGroupPreferences.setItem("dateLabel", state.dateLabel, APP_GROUP);
    await SharedGroupPreferences.setItem("kcalGoal", state.kcalGoal, APP_GROUP);
    await SharedGroupPreferences.setItem("kcalConsumed", state.kcalConsumed, APP_GROUP);
  } catch {
    // No-op when running in Expo Go (no App Group available).
  }
}
