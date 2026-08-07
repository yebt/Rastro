/**
 * Capacitor Geolocation adapter — native GPS on device.
 *
 * Maps the plugin's permission vocabulary and Position shape onto the port.
 * `prompt-with-rationale` collapses to 'prompt' since the UI treats both the
 * same (it still needs to ask).
 */

import { Geolocation as Native, type PermissionStatus } from "@capacitor/geolocation";
import type { Position } from "@capacitor/geolocation";
import type { Geolocation, GeoSample, GeoWatch, PermissionState } from "../ports/geolocation";

function mapState(state: string): PermissionState {
  if (state === "granted") return "granted";
  if (state === "denied") return "denied";
  return "prompt";
}

/**
 * Collapse the plugin's fine + coarse status into one state. Approximate
 * location ("coarseLocation") granted counts as granted — enough to record.
 */
function mergeState(status: PermissionStatus): PermissionState {
  if (status.location === "granted" || status.coarseLocation === "granted") return "granted";
  return mapState(status.location);
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
      try {
        return mergeState(await Native.checkPermissions());
      } catch {
        // @capacitor/geolocation (v8, OutSystems rewrite) THROWS "Location
        // services are not enabled" (OS-PLUG-GLOC-0007) when the OS location
        // toggle is off. The runtime permission can still be requested, so treat
        // this as undecided ('prompt') instead of letting it abort the flow.
        return "prompt";
      }
    },

    async requestPermission() {
      try {
        // No args → requests both fine and coarse, matching the old app's flow.
        return mergeState(await Native.requestPermissions());
      } catch {
        // Same services-off throw as above — don't crash the request path.
        return "prompt";
      }
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
