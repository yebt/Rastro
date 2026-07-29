/**
 * Composition point: picks the geolocation source for the current platform.
 *
 * Native Capacitor GPS on device, `navigator.geolocation` on the web. Features
 * import the interface from here and never touch a concrete adapter.
 */

import { Capacitor } from "@capacitor/core";
import { AndroidSettings, IOSSettings, NativeSettings } from "capacitor-native-settings";
import { createCapacitorGeolocation } from "./adapters/capacitor-geolocation";
import { createWebGeolocation } from "./adapters/web-geolocation";
import type { Geolocation } from "./ports/geolocation";

let instance: Geolocation | null = null;

export function geolocation(): Geolocation {
  instance ??= Capacitor.isNativePlatform() ? createCapacitorGeolocation() : createWebGeolocation();
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
