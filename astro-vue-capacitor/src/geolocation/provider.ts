/**
 * Geolocation port (hexagonal, like the persistence port).
 *
 * The tracker depends only on this interface. One implementation now
 * (Capacitor Geolocation — native on Android/iOS, navigator.geolocation on
 * web). A background-geolocation adapter (F5) will implement the same shape
 * later, so screen-off tracking is a swap, not a rewrite.
 */

export interface GeoFix {
  lat: number;
  lng: number;
  /** accuracy in meters */
  accuracy: number;
  /** GPS altitude in meters, if the device reported one (noisy) */
  altitude?: number | null;
  /** epoch ms */
  timestamp: number;
}

export interface GeoError {
  message: string;
  permissionDenied: boolean;
}

export interface GeoOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  /** Foreground-service notification title (background adapter only; F5). */
  notificationTitle?: string;
  /** Foreground-service notification body (background adapter only; F5). */
  notificationText?: string;
}

export interface GeoWatch {
  clear(): void;
}

export interface GeolocationProvider {
  /** Ensure location permission (native prompts; web resolves true and prompts on use). */
  ensurePermissions(): Promise<boolean>;
  getCurrent(opts?: GeoOptions): Promise<GeoFix>;
  watch(
    onFix: (fix: GeoFix) => void,
    onError: (err: GeoError) => void,
    opts?: GeoOptions,
  ): GeoWatch;
}

export const DEFAULT_GEO_OPTIONS: GeoOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 1000,
};
