/**
 * Runtime permission helpers (F15 setup page).
 *
 * Wraps the three plugins the app needs behind a uniform check/request surface,
 * so the setup screen and the tracker don't each reimplement plugin quirks.
 * On web (or when a plugin is unavailable) everything resolves to "unsupported"
 * — the app still works, prompts just don't apply.
 */

import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { LocalNotifications } from "@capacitor/local-notifications";
import { CapacitorPedometer } from "@capgo/capacitor-pedometer";

export type PermState = "granted" | "denied" | "prompt" | "unsupported";
export type PermKey = "location" | "notifications" | "activity";

export const PERM_KEYS: PermKey[] = ["location", "notifications", "activity"];

function norm(state: string | undefined): PermState {
  if (state === "granted") return "granted";
  if (state === "denied") return "denied";
  return "prompt"; // includes prompt-with-rationale
}

async function run(key: PermKey, mode: "check" | "request"): Promise<PermState> {
  if (!Capacitor.isNativePlatform()) return "unsupported";
  try {
    if (key === "location") {
      const s =
        mode === "check"
          ? await Geolocation.checkPermissions()
          : await Geolocation.requestPermissions();
      return s.location === "granted" || s.coarseLocation === "granted"
        ? "granted"
        : norm(s.location);
    }
    if (key === "notifications") {
      const s =
        mode === "check"
          ? await LocalNotifications.checkPermissions()
          : await LocalNotifications.requestPermissions();
      return norm(s.display);
    }
    const s =
      mode === "check"
        ? await CapacitorPedometer.checkPermissions()
        : await CapacitorPedometer.requestPermissions();
    return norm(s.activityRecognition);
  } catch {
    return "unsupported";
  }
}

export function checkPermission(key: PermKey): Promise<PermState> {
  return run(key, "check");
}

export function requestPermission(key: PermKey): Promise<PermState> {
  return run(key, "request");
}
