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

/**
 * Total path length over consecutive points, in metres. Pairs separated by more
 * than `maxGapMs` (a pause — the watch stops, leaving one big gap) are skipped,
 * so distance never includes the straight bridge across a pause. Points logged
 * with a single timestamp (dt = 0, e.g. tests) are unaffected.
 */
export function distanceMeters(points: TrackPoint[], maxGapMs = 10_000): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i]!.t - points[i - 1]!.t > maxGapMs) continue;
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
 * Cumulative ascent in metres from the altitude series, with hysteresis to
 * suppress GPS altitude noise: only a rise past `minStep` from the last confirmed
 * altitude counts, so small wobble doesn't inflate the total. A descent past
 * `minStep` re-bases the reference. Points without altitude are skipped.
 */
export function elevationGainM(points: TrackPoint[], minStep = 3): number {
  let gain = 0;
  let ref: number | null = null;
  for (const p of points) {
    if (p.alt === null) continue;
    if (ref === null) {
      ref = p.alt;
      continue;
    }
    const d = p.alt - ref;
    if (d >= minStep) {
      gain += d;
      ref = p.alt;
    } else if (d <= -minStep) {
      ref = p.alt;
    }
  }
  return gain;
}

/** Cumulative descent in metres, same hysteresis as elevationGainM. */
export function elevationLossM(points: TrackPoint[], minStep = 3): number {
  let loss = 0;
  let ref: number | null = null;
  for (const p of points) {
    if (p.alt === null) continue;
    if (ref === null) {
      ref = p.alt;
      continue;
    }
    const d = p.alt - ref;
    if (d <= -minStep) {
      loss += -d;
      ref = p.alt;
    } else if (d >= minStep) {
      ref = p.alt;
    }
  }
  return loss;
}

/** Whether any point carries an altitude reading (so the UI can show "—"). */
export function hasElevation(points: TrackPoint[]): boolean {
  return points.some((p) => p.alt !== null);
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
