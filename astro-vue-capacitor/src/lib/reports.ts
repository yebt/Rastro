/**
 * Report computations from an activity's time-series samples (F4, SPECS §9.1).
 * Pure — no DOM. Degrades to empty when an activity has no samples (old data).
 */

import type { GpsActivity } from "./types";

export interface Split {
  /** 1-based split index */
  km: number;
  /** meters in this split (1000, or less for the trailing partial) */
  meters: number;
  seconds: number;
  paceSecPerKm: number;
  partial: boolean;
}

/** A point in a time series: seconds since start → value. */
export interface SeriesPoint {
  t: number;
  v: number;
}

export function hasSamples(activity: GpsActivity): boolean {
  return (activity.samples?.length ?? 0) >= 2;
}

/**
 * Per-kilometer splits, interpolating each 1 km boundary between samples
 * (which carry accumulated distance `d` and time `t`). Adds a trailing partial
 * km when the last stretch is > 50 m.
 */
export function splitsPerKm(activity: GpsActivity): Split[] {
  const s = activity.samples;
  if (!s || s.length < 2) return [];

  const splits: Split[] = [];
  let boundary = 1000;
  let prevT = 0;
  let prevD = 0;

  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1]!;
    const b = s[i]!;
    while (b.d >= boundary && a.d < boundary) {
      const frac = (boundary - a.d) / (b.d - a.d);
      const tAtBoundary = a.t + frac * (b.t - a.t);
      const seconds = tAtBoundary - prevT;
      splits.push({
        km: splits.length + 1,
        meters: 1000,
        seconds,
        paceSecPerKm: seconds,
        partial: false,
      });
      prevT = tAtBoundary;
      prevD = boundary;
      boundary += 1000;
    }
  }

  const last = s[s.length - 1]!;
  const remaining = last.d - prevD;
  if (remaining > 50) {
    const seconds = last.t - prevT;
    splits.push({
      km: splits.length + 1,
      meters: Math.round(remaining),
      seconds,
      paceSecPerKm: seconds / (remaining / 1000),
      partial: true,
    });
  }

  return splits;
}

/** Speed over time, km/h. */
export function speedSeriesKmh(activity: GpsActivity): SeriesPoint[] {
  return (activity.samples ?? []).map((s) => ({ t: s.t, v: s.v * 3.6 }));
}

/** Pace over time, seconds per km. Near-stops are dropped (pace → ∞). */
export function paceSeriesSecPerKm(activity: GpsActivity): SeriesPoint[] {
  return (activity.samples ?? []).filter((s) => s.v > 0.3).map((s) => ({ t: s.t, v: 1000 / s.v }));
}

/** Fastest split index (1-based), or 0 if none. */
export function fastestSplit(splits: Split[]): number {
  let best = 0;
  let bestPace = Infinity;
  for (const s of splits) {
    if (!s.partial && s.paceSecPerKm < bestPace) {
      bestPace = s.paceSecPerKm;
      best = s.km;
    }
  }
  return best;
}

/** Average cadence (steps/min) across samples that captured it, 0 if none. */
export function avgCadence(activity: GpsActivity): number {
  const cads = (activity.samples ?? [])
    .map((s) => s.cad)
    .filter((c): c is number => typeof c === "number" && c > 0);
  if (!cads.length) return 0;
  return Math.round(cads.reduce((a, b) => a + b, 0) / cads.length);
}

/** Cadence over time (steps/min). Empty when no cadence was captured. */
export function cadenceSeriesSpm(activity: GpsActivity): SeriesPoint[] {
  return (activity.samples ?? [])
    .filter((s) => typeof s.cad === "number" && s.cad > 0)
    .map((s) => ({ t: s.t, v: s.cad as number }));
}
