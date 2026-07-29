/**
 * Web Geolocation adapter — `navigator.geolocation`.
 *
 * Used in the browser PWA and as the fallback inside the WebView. High accuracy
 * is requested so altitude and speed come through when the device exposes them.
 * The web platform has no explicit "request permission" call, so requesting is
 * a one-shot `getCurrentPosition` whose outcome reveals the granted/denied state.
 */

import type {
  GeoError,
  Geolocation,
  GeoSample,
  GeoWatch,
  PermissionState,
} from "../ports/geolocation";

function toSample(position: GeolocationPosition): GeoSample {
  const c = position.coords;
  return {
    t: position.timestamp,
    lat: c.latitude,
    lng: c.longitude,
    alt: c.altitude,
    acc: c.accuracy,
    altAcc: c.altitudeAccuracy,
    spd: c.speed,
  };
}

function toError(error: GeolocationPositionError): GeoError {
  if (error.code === error.PERMISSION_DENIED) {
    return { kind: "denied", message: error.message };
  }
  if (error.code === error.TIMEOUT) {
    return { kind: "timeout", message: error.message };
  }
  return { kind: "unavailable", message: error.message };
}

export function createWebGeolocation(): Geolocation {
  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  return {
    isSupported() {
      return supported;
    },

    async checkPermission() {
      if (!supported) return "unsupported";
      if (typeof navigator.permissions === "undefined") return "prompt";
      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        return status.state as PermissionState;
      } catch {
        return "prompt";
      }
    },

    async requestPermission() {
      if (!supported) return "unsupported";
      return new Promise<PermissionState>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve("granted"),
          (error) => resolve(error.code === error.PERMISSION_DENIED ? "denied" : "prompt"),
          { enableHighAccuracy: true, timeout: 10_000 },
        );
      });
    },

    async getCurrentPosition() {
      return new Promise<GeoSample>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(toSample(position)),
          (error) => reject(toError(error)),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
        );
      });
    },

    async watch(onSample, onError) {
      const id = navigator.geolocation.watchPosition(
        (position) => onSample(toSample(position)),
        (error) => onError?.(toError(error)),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
      );
      const watch: GeoWatch = {
        async stop() {
          navigator.geolocation.clearWatch(id);
        },
      };
      return watch;
    },
  };
}
