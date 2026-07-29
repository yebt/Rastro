/**
 * Composition point: picks the geolocation source for the current platform.
 *
 * Native Capacitor GPS on device, `navigator.geolocation` on the web. Features
 * import the interface from here and never touch a concrete adapter.
 */

import { Capacitor } from "@capacitor/core";
import { AndroidSettings, IOSSettings, NativeSettings } from "capacitor-native-settings";
import { createBackgroundGeolocation } from "./adapters/background-geolocation";
import { createWebGeolocation } from "./adapters/web-geolocation";
import type { Geolocation } from "./ports/geolocation";

let instance: Geolocation | null = null;

export function geolocation(): Geolocation {
  // Native uses the background service (keeps recording with the screen off);
  // the web falls back to navigator.geolocation.
  instance ??= Capacitor.isNativePlatform()
    ? createBackgroundGeolocation()
    : createWebGeolocation();
  return instance;
}

/**
 * Whether a position can actually be obtained right now. A granted permission
 * is not enough — the OS location toggle can still be off. Call this only once
 * the permission is granted; a rejection means "turn the location service on".
 */
export async function isLocationEnabled(): Promise<boolean> {
  try {
    await geolocation().getCurrentPosition();
    return true;
  } catch {
    return false;
  }
}

/**
 * Open the OS location settings so the user can switch the service on. Native
 * only — a no-op on the web, where there is no such screen. Re-probe with
 * isLocationEnabled() when the user comes back.
 */
export async function openLocationSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await NativeSettings.open({
    optionAndroid: AndroidSettings.Location,
    optionIOS: IOSSettings.LocationServices,
  });
}

/** Outcome of asking the OS to enable location without leaving the app. */
export type LocationEnableResult = "on" | "refused" | "unavailable";

/** Cordova-bridged plugin surface (only the bits we use). */
interface LocationAccuracyPlugin {
  request(
    success: (result: { code: number; message: string }) => void,
    error: (err: { code: number; message: string }) => void,
    accuracy: number,
  ): void;
  REQUEST_PRIORITY_HIGH_ACCURACY: number;
  ERROR_USER_DISAGREED: number;
}

function locationAccuracyPlugin(): LocationAccuracyPlugin | null {
  const bridge = globalThis as {
    cordova?: { plugins?: { locationAccuracy?: LocationAccuracyPlugin } };
  };
  return bridge.cordova?.plugins?.locationAccuracy ?? null;
}

/**
 * Ask the OS to turn location on WITHOUT leaving the app — the Google Play
 * Services "Location Accuracy" dialog. Returns 'on' when location ends up usable
 * (already satisfied or the user accepted), 'refused' when the user declined,
 * and 'unavailable' when the dialog can't run (web, or no Play Services). The
 * caller can fall back to openLocationSettings() on 'unavailable'.
 */
export async function requestLocationOn(): Promise<LocationEnableResult> {
  const plugin = locationAccuracyPlugin();
  if (!Capacitor.isNativePlatform() || !plugin) return "unavailable";
  return new Promise((resolve) => {
    plugin.request(
      () => resolve("on"),
      (err) => resolve(err.code === plugin.ERROR_USER_DISAGREED ? "refused" : "unavailable"),
      plugin.REQUEST_PRIORITY_HIGH_ACCURACY,
    );
  });
}
