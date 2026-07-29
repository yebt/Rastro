/**
 * Scriptable in-memory Geolocation for tests.
 *
 * Emits nothing on its own: a test drives it with `emit()` / `emitError()`,
 * inspects `isWatching()`, and presets permission with `setPermission()`. This
 * lets the recorder and any consumer be tested deterministically, with no real
 * GPS and no timers.
 */

import type {
  GeoError,
  Geolocation,
  GeoSample,
  GeoWatch,
  PermissionState,
} from "../ports/geolocation";

export interface FakeGeolocation extends Geolocation {
  /** Deliver a sample to the active watcher (no-op if not watching). */
  emit(sample: GeoSample): void;
  /** Deliver an error to the active watcher. */
  emitError(error: GeoError): void;
  /** Whether a watch is currently open. */
  isWatching(): boolean;
  /** Preset the permission returned by check/request. */
  setPermission(state: PermissionState): void;
  /** Toggle whether the system location service is "on" (getCurrentPosition). */
  setEnabled(enabled: boolean): void;
}

export function createFakeGeolocation(): FakeGeolocation {
  let permission: PermissionState = "prompt";
  let enabled = true;
  let onSample: ((sample: GeoSample) => void) | null = null;
  let onError: ((error: GeoError) => void) | null = null;

  return {
    isSupported() {
      return true;
    },
    async checkPermission() {
      return permission;
    },
    async requestPermission() {
      // Modelling a user granting when asked from the neutral prompt state.
      if (permission === "prompt") permission = "granted";
      return permission;
    },
    async getCurrentPosition() {
      if (!enabled) throw { kind: "unavailable", message: "location off" } satisfies GeoError;
      return { t: 0, lat: -34.6, lng: -58.4, alt: null, acc: 5, altAcc: null, spd: null };
    },
    async watch(sampleCb, errorCb) {
      onSample = sampleCb;
      onError = errorCb ?? null;
      const watch: GeoWatch = {
        async stop() {
          onSample = null;
          onError = null;
        },
      };
      return watch;
    },

    emit(sample) {
      onSample?.(sample);
    },
    emitError(error) {
      onError?.(error);
    },
    isWatching() {
      return onSample !== null;
    },
    setPermission(state) {
      permission = state;
    },
    setEnabled(value) {
      enabled = value;
    },
  };
}
