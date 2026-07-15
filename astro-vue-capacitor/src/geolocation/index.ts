import { Capacitor } from "@capacitor/core";
import { BackgroundGeolocationAdapter } from "./background";
import { CapacitorGeolocation } from "./capacitor";
import type { GeolocationProvider } from "./provider";

export * from "./provider";

/**
 * Default geolocation provider.
 * Native → background adapter (foreground service, screen-off tracking, F5).
 * Web → the standard Capacitor/navigator provider (foreground only).
 */
export const geo: GeolocationProvider = Capacitor.isNativePlatform()
  ? new BackgroundGeolocationAdapter()
  : new CapacitorGeolocation();
