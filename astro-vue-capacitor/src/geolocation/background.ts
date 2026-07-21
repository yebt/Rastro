/**
 * Background geolocation adapter (F5).
 *
 * Uses @capacitor-community/background-geolocation, which runs an Android
 * foreground service (persistent notification) so location keeps flowing with
 * the screen off / app backgrounded — the whole point of going native.
 *
 * `watch` drives the background service; one-shot `getCurrent` (locate button)
 * and permission requests delegate to the standard foreground plugin.
 */

import { registerPlugin } from "@capacitor/core";
import type {
  BackgroundGeolocationPlugin,
  Location as BgLocation,
} from "@capacitor-community/background-geolocation";
import { CapacitorGeolocation } from "./capacitor";
import type { GeoError, GeoFix, GeolocationProvider, GeoOptions, GeoWatch } from "./provider";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

function toFix(l: BgLocation): GeoFix {
  return {
    lat: l.latitude,
    lng: l.longitude,
    accuracy: l.accuracy,
    timestamp: l.time ?? Date.now(),
  };
}

export class BackgroundGeolocationAdapter implements GeolocationProvider {
  private fg = new CapacitorGeolocation();

  ensurePermissions(): Promise<boolean> {
    return this.fg.ensurePermissions();
  }

  getCurrent(opts?: GeoOptions): Promise<GeoFix> {
    return this.fg.getCurrent(opts);
  }

  watch(
    onFix: (fix: GeoFix) => void,
    onError: (err: GeoError) => void,
    opts?: GeoOptions,
  ): GeoWatch {
    let id: string | null = null;
    let cancelled = false;

    void BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: opts?.notificationTitle ?? "Rastro · registrando",
        backgroundMessage:
          opts?.notificationText ?? "GPS y podómetro activos. Tocá para abrir la app.",
        requestPermissions: true,
        stale: false,
        distanceFilter: 0, // our accuracy-aware filter (evaluatePoint) does the rest
      },
      (position, error) => {
        if (error) {
          onError({ message: error.message, permissionDenied: error.code === "NOT_AUTHORIZED" });
          return;
        }
        if (position) onFix(toFix(position));
      },
    )
      .then((watchId) => {
        id = watchId;
        if (cancelled) void BackgroundGeolocation.removeWatcher({ id: watchId });
      })
      .catch((e: unknown) => onError({ message: String(e), permissionDenied: false }));

    return {
      clear() {
        cancelled = true;
        if (id) void BackgroundGeolocation.removeWatcher({ id });
      },
    };
  }
}
