/**
 * Derived movement metrics — computed from raw points, never stored.
 *
 * Rastro persists only what the GPS reported; distance, duration, pace and speed
 * are all functions of `points`, so rethinking a metric never migrates a record.
 * Everything here is pure and unit-tested against fixed coordinates.
 */

import type { TrackPoint } from "./track-point";

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle distance between two fixes, in metres (haversine). */
export function haversineMeters(a: TrackPoint, b: TrackPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total path length over every consecutive pair of points, in metres. */
export function distanceMeters(points: TrackPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1]!, points[i]!);
  }
  return total;
}

/** Wall-clock span from first to last sample, in ms. 0 for fewer than 2 points. */
export function spanMs(points: TrackPoint[]): number {
  if (points.length < 2) return 0;
  return points[points.length - 1]!.t - points[0]!.t;
}

/**
 * Moving time in ms: inter-sample gaps summed, but gaps longer than `maxGapMs`
 * dropped. A pause stops the GPS watch, leaving one large gap between points —
 * excluding it keeps pace honest instead of counting stopped time as movement.
 */
export function movingDurationMs(points: TrackPoint[], maxGapMs = 10_000): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dt = points[i]!.t - points[i - 1]!.t;
    if (dt > 0 && dt <= maxGapMs) total += dt;
  }
  return total;
}

/** Average moving speed in m/s. 0 when there is no moving time. */
export function avgSpeedMps(points: TrackPoint[]): number {
  const seconds = movingDurationMs(points) / 1000;
  if (seconds <= 0) return 0;
  return distanceMeters(points) / seconds;
}

/**
 * Time spent paused, in ms: total wall time (end − start) minus moving time.
 * 0 while the activity is still open (no end) or when nothing was paused.
 */
export function pausedMs(startedAt: number, endedAt: number | null, movingMs: number): number {
  if (endedAt === null) return 0;
  return Math.max(0, endedAt - startedAt - movingMs);
}

/**
 * Average pace in seconds per kilometre, or null when there's nothing to pace
 * (no distance or no moving time) — callers render that as "—" rather than ∞.
 */
export function avgPaceSecPerKm(points: TrackPoint[]): number | null {
  const km = distanceMeters(points) / 1000;
  const seconds = movingDurationMs(points) / 1000;
  if (km <= 0 || seconds <= 0) return null;
  return seconds / km;
}
