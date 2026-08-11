/**
 * A single GPS sample, captured losslessly.
 *
 * Rastro stores exactly what the device reported — no smoothing, no dropped
 * fields — so any future metric (elevation gain, split pace, stride analysis)
 * can be derived later without re-recording. Missing readings are `null`, never
 * faked: an absent altitude is different from an altitude of 0.
 */
export interface TrackPoint {
  /** Sample time, epoch milliseconds. */
  t: number;
  /** Latitude, decimal degrees. */
  lat: number;
  /** Longitude, decimal degrees. */
  lng: number;
  /** Altitude in metres, or null if the fix had none. */
  alt: number | null;
  /** Horizontal accuracy in metres, or null. */
  acc: number | null;
  /** Vertical (altitude) accuracy in metres, or null. */
  altAcc: number | null;
  /** Instantaneous speed in m/s as reported by the GPS, or null. */
  spd: number | null;
  /** Cumulative step count at this fix (recorder-stamped); absent on old data. */
  st?: number;
}

/**
 * Build a TrackPoint from a raw geolocation reading, normalizing every optional
 * field to an explicit `null` so persisted records have a stable shape.
 */
export function toTrackPoint(reading: {
  t: number;
  lat: number;
  lng: number;
  alt?: number | null;
  acc?: number | null;
  altAcc?: number | null;
  spd?: number | null;
}): TrackPoint {
  return {
    t: reading.t,
    lat: reading.lat,
    lng: reading.lng,
    alt: reading.alt ?? null,
    acc: reading.acc ?? null,
    altAcc: reading.altAcc ?? null,
    spd: reading.spd ?? null,
  };
}
