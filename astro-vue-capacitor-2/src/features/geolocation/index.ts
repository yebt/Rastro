/**
 * Geolocation feature — public surface.
 */

export { createFakeGeolocation, type FakeGeolocation } from "./adapters/fake-geolocation";
export { geolocation, isLocationEnabled } from "./geolocation";
export type {
  GeoError,
  Geolocation,
  GeoSample,
  GeoWatch,
  PermissionState,
} from "./ports/geolocation";
