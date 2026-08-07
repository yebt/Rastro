/**
 * Background geolocation adapter — the recording GPS source on device.
 *
 * Uses @capacitor-community/background-geolocation, which runs an Android
 * foreground service (persistent notification) so location keeps flowing with
 * the screen off or the app backgrounded — the whole reason Rastro goes native.
 *
 * Permission checks and one-shot position delegate to the foreground
 * @capacitor/geolocation adapter (same OS APIs). Only the live `watch` uses the
 * background service, whose `addWatcher({ requestPermissions: true })` also
 * drives the native permission request — the robust flow the old app relied on.
 */

import type {
  BackgroundGeolocationPlugin,
  Location as BgLocation,
} from "@capacitor-community/background-geolocation";
import { registerPlugin } from "@capacitor/core";
import type { Geolocation, GeoSample, GeoWatch } from "../ports/geolocation";
import { createCapacitorGeolocation } from "./capacitor-geolocation";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

function toSample(l: BgLocation): GeoSample {
  return {
    t: l.time ?? Date.now(),
    lat: l.latitude,
    lng: l.longitude,
    alt: l.altitude,
    acc: l.accuracy,
    altAcc: l.altitudeAccuracy,
    spd: l.speed,
  };
}

export function createBackgroundGeolocation(): Geolocation {
  // Foreground plugin handles permission + one-shot fixes; it uses no `this`, so
  // its methods can be reused directly.
  const foreground = createCapacitorGeolocation();

  return {
    isSupported() {
      return true;
    },

    checkPermission: foreground.checkPermission,
    requestPermission: foreground.requestPermission,
    getCurrentPosition: foreground.getCurrentPosition,

    async watch(onSample, onError) {
      let id: string | null = null;
      let cancelled = false;

      void BackgroundGeolocation.addWatcher(
        {
          backgroundTitle: "Rastro · registrando",
          backgroundMessage: "GPS activo. Tocá para volver a la app.",
          requestPermissions: true,
          // Our metrics layer filters points; let the service report everything.
          distanceFilter: 0,
        },
        (position, error) => {
          if (error) {
            onError?.({
              kind: error.code === "NOT_AUTHORIZED" ? "denied" : "unavailable",
              message: error.message,
            });
            return;
          }
          if (position) onSample(toSample(position));
        },
      )
        .then((watchId) => {
          id = watchId;
          // Stopped before the watcher id came back — tear it down now.
          if (cancelled) void BackgroundGeolocation.removeWatcher({ id: watchId });
        })
        .catch((e: unknown) => onError?.({ kind: "unavailable", message: String(e) }));

      const watch: GeoWatch = {
        async stop() {
          cancelled = true;
          if (id) await BackgroundGeolocation.removeWatcher({ id });
        },
      };
      return watch;
    },
  };
}
