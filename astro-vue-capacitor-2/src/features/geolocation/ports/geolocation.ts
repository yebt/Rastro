/**
 * Geolocation port (hexagonal architecture).
 *
 * The app records against this interface, never against a concrete GPS source.
 * Native (Capacitor) on device, `navigator.geolocation` on the web, a scripted
 * fake in tests — all interchangeable behind the same contract.
 *
 * A GeoSample is intentionally the exact reading shape `toTrackPoint()` accepts,
 * so the recorder maps a live sample to a stored TrackPoint with no glue.
 */

export interface GeoSample {
  /** Fix time, epoch milliseconds. */
  t: number;
  lat: number;
  lng: number;
  /** Altitude in metres, or null if the fix had none. */
  alt: number | null;
  /** Horizontal accuracy in metres, or null. */
  acc: number | null;
  /** Vertical (altitude) accuracy in metres, or null. */
  altAcc: number | null;
  /** Speed in m/s as reported by the source, or null. */
  spd: number | null;
}

/** Same vocabulary the UI uses, so permission state flows through untranslated. */
export type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export interface GeoError {
  /** 'denied' when the user refused, 'unavailable' for a position failure, 'timeout'. */
  kind: "denied" | "unavailable" | "timeout";
  message: string;
}

/** Handle to a live position stream. */
export interface GeoWatch {
  stop(): Promise<void>;
}

export interface Geolocation {
  /** Whether this environment can provide positions at all. */
  isSupported(): boolean;
  /** Current permission without prompting. */
  checkPermission(): Promise<PermissionState>;
  /** Prompt for permission if needed; resolves to the resulting state. */
  requestPermission(): Promise<PermissionState>;
  /**
   * One-shot current position. Rejects with a GeoError — used to detect whether
   * the system location service is actually on (a granted permission is not
   * enough; the OS toggle can still be off).
   */
  getCurrentPosition(): Promise<GeoSample>;
  /**
   * Stream high-accuracy positions until the returned watch is stopped.
   * Errors are delivered to `onError`; the stream stays open unless stopped.
   */
  watch(
    onSample: (sample: GeoSample) => void,
    onError?: (error: GeoError) => void,
  ): Promise<GeoWatch>;
}
