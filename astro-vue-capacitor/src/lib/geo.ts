/** Geographic helpers. Pure — no DOM, no side effects. */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;
const TO_RAD = Math.PI / 180;

/**
 * Great-circle distance in meters between two coordinates (Haversine).
 * SPECS §11: distance is the sum of Haversine between valid GPS points.
 */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * TO_RAD;
  const dLng = (b.lng - a.lng) * TO_RAD;
  const la1 = a.lat * TO_RAD;
  const la2 = b.lat * TO_RAD;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(x)));
}
