/**
 * Route analytics for the activity detail charts — per-kilometre splits and a
 * speed/pace-over-time series. Pure and derived from raw points (never stored),
 * like every other metric. `now`-free and deterministic, so it's unit-testable.
 */

import { haversineMeters } from "./metrics";
import type { TrackPoint } from "./track-point";

export interface Split {
  /** 1-based split number. */
  index: number;
  /** Metres in this split (== unit for full splits, less for the trailing one). */
  distanceM: number;
  /** Elapsed wall time across this split, ms. */
  durationMs: number;
  /** Pace in seconds per km, or null when it can't be computed. */
  paceSecPerKm: number | null;
}

/** Cumulative distance (m) and elapsed time (ms from start) at each point. */
function cumulative(points: TrackPoint[]): { d: number[]; t: number[] } {
  const d = [0];
  const t = [0];
  const t0 = points[0]!.t;
  for (let i = 1; i < points.length; i++) {
    d.push(d[i - 1]! + haversineMeters(points[i - 1]!, points[i]!));
    t.push(points[i]!.t - t0);
  }
  return { d, t };
}

/** Interpolated elapsed time (ms) at a given cumulative distance. */
function timeAtDistance(d: number[], t: number[], target: number): number {
  if (target <= 0) return t[0]!;
  const last = d.length - 1;
  if (target >= d[last]!) return t[last]!;
  // linear scan (tracks are short); interpolate within the crossing segment
  for (let i = 1; i < d.length; i++) {
    if (d[i]! >= target) {
      const span = d[i]! - d[i - 1]!;
      const frac = span > 0 ? (target - d[i - 1]!) / span : 0;
      return t[i - 1]! + (t[i]! - t[i - 1]!) * frac;
    }
  }
  return t[last]!;
}

/** Per-`unitM` splits (default 1 km), including a trailing partial split. */
export function splits(points: TrackPoint[], unitM = 1000): Split[] {
  if (points.length < 2) return [];
  const { d, t } = cumulative(points);
  const total = d[d.length - 1]!;
  if (total <= 0) return [];

  const out: Split[] = [];
  const full = Math.floor(total / unitM);
  for (let k = 1; k <= full; k++) {
    const durationMs = timeAtDistance(d, t, k * unitM) - timeAtDistance(d, t, (k - 1) * unitM);
    out.push({
      index: k,
      distanceM: unitM,
      durationMs,
      paceSecPerKm: durationMs > 0 ? durationMs / 1000 / (unitM / 1000) : null,
    });
  }
  const remainder = total - full * unitM;
  if (remainder > 1) {
    const durationMs = t[t.length - 1]! - timeAtDistance(d, t, full * unitM);
    out.push({
      index: full + 1,
      distanceM: remainder,
      durationMs,
      paceSecPerKm: durationMs > 0 ? durationMs / 1000 / (remainder / 1000) : null,
    });
  }
  return out;
}

export interface SeriesPoint {
  /** Elapsed time from start, ms (bucket centre). */
  tMs: number;
  /** Speed in m/s for the bucket. */
  mps: number;
  /** Pace in seconds per km, or null when stationary. */
  paceSecPerKm: number | null;
}

/**
 * Speed/pace resampled into `buckets` equal time slices over the activity's
 * span. Distance and time are accumulated per bucket (gaps beyond `maxGapMs`,
 * i.e. pauses, dropped) so the curve reflects moving speed, not stopped time.
 */
export function movementSeries(points: TrackPoint[], buckets = 60, maxGapMs = 10_000): SeriesPoint[] {
  if (points.length < 2) return [];
  const t0 = points[0]!.t;
  const total = points[points.length - 1]!.t - t0;
  if (total <= 0) return [];

  const bucketMs = total / buckets;
  const dist = new Array<number>(buckets).fill(0);
  const time = new Array<number>(buckets).fill(0);

  for (let i = 1; i < points.length; i++) {
    const dt = points[i]!.t - points[i - 1]!.t;
    if (dt <= 0 || dt > maxGapMs) continue;
    const mid = (points[i]!.t + points[i - 1]!.t) / 2 - t0;
    const bi = Math.min(buckets - 1, Math.max(0, Math.floor(mid / bucketMs)));
    dist[bi]! += haversineMeters(points[i - 1]!, points[i]!);
    time[bi]! += dt;
  }

  return Array.from({ length: buckets }, (_, i) => {
    const mps = time[i]! > 0 ? dist[i]! / (time[i]! / 1000) : 0;
    return {
      tMs: (i + 0.5) * bucketMs,
      mps,
      paceSecPerKm: mps > 0 ? 1000 / mps : null,
    };
  });
}
