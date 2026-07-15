import { CapacitorGeolocation } from "./capacitor";
import type { GeolocationProvider } from "./provider";

export * from "./provider";

/** Default geolocation provider for the app (swap for a background adapter in F5). */
export const geo: GeolocationProvider = new CapacitorGeolocation();
