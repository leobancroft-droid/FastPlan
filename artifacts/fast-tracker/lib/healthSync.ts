import { Platform } from "react-native";

export interface HealthSnapshot {
  steps: number;
  activeKcal: number;
}

let appleHealthKit: any = null;
let appleHealthLoaded = false;

function loadAppleHealth(): any | null {
  if (appleHealthLoaded) return appleHealthKit;
  appleHealthLoaded = true;
  if (Platform.OS !== "ios") return null;
  try {
    const mod = require("react-native-health");
    appleHealthKit = mod?.default ?? mod;
  } catch {
    appleHealthKit = null;
  }
  return appleHealthKit;
}

export function isHealthAvailable(): boolean {
  return Platform.OS === "ios" && !!loadAppleHealth();
}

export function requestHealthPermissions(): Promise<boolean> {
  return new Promise((resolve) => {
    const AppleHealthKit = loadAppleHealth();
    if (!AppleHealthKit) return resolve(false);
    const perms = AppleHealthKit.Constants?.Permissions;
    if (!perms) return resolve(false);
    const options = {
      permissions: {
        read: [perms.Steps, perms.StepCount, perms.ActiveEnergyBurned, perms.DistanceWalkingRunning].filter(Boolean),
        write: [],
      },
    };
    try {
      AppleHealthKit.initHealthKit(options, (err: any) => {
        resolve(!err);
      });
    } catch {
      resolve(false);
    }
  });
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStepsToday(): Promise<number> {
  return new Promise((resolve) => {
    const AppleHealthKit = loadAppleHealth();
    if (!AppleHealthKit) return resolve(0);
    const opts = { date: new Date().toISOString(), includeManuallyAdded: true };
    try {
      AppleHealthKit.getStepCount(opts, (err: any, res: any) => {
        if (err || !res) return resolve(0);
        resolve(Math.round(Number(res.value) || 0));
      });
    } catch {
      resolve(0);
    }
  });
}

function getActiveEnergyToday(): Promise<number> {
  return new Promise((resolve) => {
    const AppleHealthKit = loadAppleHealth();
    if (!AppleHealthKit) return resolve(0);
    const opts = {
      startDate: startOfToday().toISOString(),
      endDate: new Date().toISOString(),
    };
    try {
      AppleHealthKit.getActiveEnergyBurned(opts, (err: any, res: any) => {
        if (err || !Array.isArray(res)) return resolve(0);
        const total = res.reduce((s: number, x: any) => s + (Number(x?.value) || 0), 0);
        resolve(Math.round(total));
      });
    } catch {
      resolve(0);
    }
  });
}

export async function fetchTodayHealthSnapshot(): Promise<HealthSnapshot | null> {
  if (!isHealthAvailable()) return null;
  try {
    const [steps, activeKcal] = await Promise.all([getStepsToday(), getActiveEnergyToday()]);
    return { steps, activeKcal };
  } catch {
    return null;
  }
}
