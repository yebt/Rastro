/**
 * Capacitor Geolocation adapter — native GPS on device.
 *
 * Maps the plugin's permission vocabulary and Position shape onto the port.
 * `prompt-with-rationale` collapses to 'prompt' since the UI treats both the
 * same (it still needs to ask).
 */

import { Geolocation as Native, type Position } from "@capacitor/geolocation";
import type { Geolocation, GeoSample, GeoWatch, PermissionState } from "../ports/geolocation";

function mapState(state: string): PermissionState {
  if (state === "granted") return "granted";
  if (state === "denied") return "denied";
  return "prompt";
}

function toSample(position: Position): GeoSample {
  const c = position.coords;
  return {
    t: position.timestamp,
    lat: c.latitude,
    lng: c.longitude,
    alt: c.altitude ?? null,
    acc: c.accuracy,
    altAcc: c.altitudeAccuracy ?? null,
    spd: c.speed ?? null,
  };
}

export function createCapacitorGeolocation(): Geolocation {
  return {
    isSupported() {
      return true;
    },

    async checkPermission() {
      const status = await Native.checkPermissions();
      return mapState(status.location);
    },

    async requestPermission() {
      const status = await Native.requestPermissions({ permissions: ["location"] });
      return mapState(status.location);
    },

    async getCurrentPosition() {
      try {
        const position = await Native.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000,
        });
        return toSample(position);
      } catch (e) {
        // Services off or no fix — surface as unavailable so the UI can prompt.
        throw { kind: "unavailable", message: e instanceof Error ? e.message : String(e) };
      }
    },

    async watch(onSample, onError) {
      const id = await Native.watchPosition(
        { enableHighAccuracy: true, timeout: 20_000 },
        (position, err) => {
          if (err) {
            onError?.({ kind: "unavailable", message: err.message });
            return;
          }
          if (position) onSample(toSample(position));
        },
      );
      const watch: GeoWatch = {
        async stop() {
          await Native.clearWatch({ id });
        },
      };
      return watch;
    },
  };
}
