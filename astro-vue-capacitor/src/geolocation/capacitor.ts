/**
 * Capacitor Geolocation adapter.
 *
 * On native it calls the OS location APIs through the Capacitor bridge — so it
 * works regardless of the WebView's secure-context rules (even under http live
 * reload). On web it falls back to navigator.geolocation.
 */

import { Geolocation, type Position } from "@capacitor/geolocation";
import {
  DEFAULT_GEO_OPTIONS,
  type GeoError,
  type GeoFix,
  type GeolocationProvider,
  type GeoOptions,
  type GeoWatch,
} from "./provider";

function toFix(p: Position): GeoFix {
  return {
    lat: p.coords.latitude,
    lng: p.coords.longitude,
    accuracy: p.coords.accuracy ?? 999,
    timestamp: p.timestamp,
  };
}

function toError(message: string): GeoError {
  return { message, permissionDenied: /denied|permission|kCLError/i.test(message) };
}

export class CapacitorGeolocation implements GeolocationProvider {
  async ensurePermissions(): Promise<boolean> {
    try {
      const status = await Geolocation.checkPermissions();
      if (status.location === "granted" || status.coarseLocation === "granted") return true;
      const req = await Geolocation.requestPermissions();
      return req.location === "granted" || req.coarseLocation === "granted";
    } catch {
      // Web: no explicit permission step; the browser prompts on first use.
      return true;
    }
  }

  async getCurrent(opts: GeoOptions = DEFAULT_GEO_OPTIONS): Promise<GeoFix> {
    return toFix(await Geolocation.getCurrentPosition(opts));
  }

  watch(
    onFix: (fix: GeoFix) => void,
    onError: (err: GeoError) => void,
    opts: GeoOptions = DEFAULT_GEO_OPTIONS,
  ): GeoWatch {
    let id: string | null = null;
    let cancelled = false;

    void Geolocation.watchPosition(opts, (position, err) => {
      if (err) {
        onError(toError((err as { message?: string })?.message ?? "geolocation error"));
        return;
      }
      if (position) onFix(toFix(position));
    })
      .then((watchId) => {
        id = watchId;
        if (cancelled) void Geolocation.clearWatch({ id: watchId });
      })
      .catch((e: unknown) => onError(toError(String(e))));

    return {
      clear() {
        cancelled = true;
        if (id) void Geolocation.clearWatch({ id });
      },
    };
  }
}
