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

/** A point in a series: x (seconds since start, or meters travelled) → value. */
export interface SeriesPoint {
  /** x axis: seconds when axis="time", accumulated meters when axis="distance" */
  t: number;
  v: number;
}

/** X axis for a time series: elapsed time or distance travelled. */
export type SeriesAxis = "time" | "distance";

/** Pick a sample's x value for the requested axis. */
function xOf(s: { t: number; d: number }, axis: SeriesAxis): number {
  return axis === "distance" ? s.d : s.t;
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

/** One fixed-distance stretch of the route with denoised average metrics. */
export interface Segment {
  startM: number;
  endM: number;
  meters: number;
  seconds: number;
  speedKmh: number;
  paceSecPerKm: number;
  avgCad: number;
  /** true for the trailing stretch shorter than the chosen segment length */
  partial: boolean;
}

/** Linear-interpolated elapsed time at an accumulated distance (samples: d↑, t↑). */
function timeAtDistance(s: { t: number; d: number }[], target: number): number {
  const first = s[0]!;
  const last = s[s.length - 1]!;
  if (target <= first.d) return first.t;
  if (target >= last.d) return last.t;
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1]!;
    const b = s[i]!;
    if (a.d <= target && b.d >= target) {
      const frac = b.d === a.d ? 0 : (target - a.d) / (b.d - a.d);
      return a.t + frac * (b.t - a.t);
    }
  }
  return last.t;
}

/** Pick a segment length that yields a readable number of bars (≤ ~24). */
function pickSegmentMeters(totalM: number): number {
  for (const step of [50, 100, 200, 250, 500, 1000]) {
    if (totalM / step <= 24) return step;
  }
  return 2000;
}

/**
 * Denoised performance profile along the route: split into fixed-distance
 * segments and take each segment's average speed as distance/time (not the
 * jittery per-sample GPS speed). This is what makes "I sped up at 300 m"
 * actually visible. Segment length auto-scales to keep the chart readable.
 */
export function segmentProfile(activity: GpsActivity, segMeters?: number): Segment[] {
  const s = activity.samples;
  if (!s || s.length < 2) return [];
  const totalM = s[s.length - 1]!.d;
  if (totalM <= 0) return [];
  const seg = segMeters ?? pickSegmentMeters(totalM);

  const out: Segment[] = [];
  for (let low = 0; low < totalM - 1; low += seg) {
    const full = low + seg;
    const high = Math.min(full, totalM);
    const meters = high - low;
    if (meters < 1) break;
    const seconds = timeAtDistance(s, high) - timeAtDistance(s, low);
    const cads = s
      .filter((p) => p.d >= low && p.d < high && typeof p.cad === "number" && p.cad > 0)
      .map((p) => p.cad as number);
    out.push({
      startM: low,
      endM: high,
      meters: Math.round(meters),
      seconds,
      speedKmh: seconds > 0 ? meters / 1000 / (seconds / 3600) : 0,
      paceSecPerKm: seconds > 0 && meters > 0 ? seconds / (meters / 1000) : 0,
      avgCad: cads.length ? Math.round(cads.reduce((a, b) => a + b, 0) / cads.length) : 0,
      partial: high < full,
    });
  }
  return out;
}

/** Drill-down metrics for a single kilometer, from its samples. */
export interface KmSegment {
  km: number;
  meters: number;
  seconds: number;
  avgSpeedKmh: number;
  avgCad: number;
  /** speed (km/h) over time, t relative to the km's start */
  speedSeries: SeriesPoint[];
  /** cadence (steps/min) over time, t relative to the km's start */
  cadSeries: SeriesPoint[];
}

/**
 * Per-kilometer detail built from the samples whose accumulated distance falls
 * in [(km-1)·1000, km·1000]. null when that window has < 2 samples (old data or
 * a km with no coverage). Time is rebased to the segment start for the charts.
 */
export function kmSegment(activity: GpsActivity, km: number): KmSegment | null {
  const s = activity.samples;
  if (!s || s.length < 2 || km < 1) return null;

  const lower = (km - 1) * 1000;
  const upper = km * 1000;
  const win = s.filter((p) => p.d >= lower && p.d <= upper);
  if (win.length < 2) return null;

  const first = win[0]!;
  const last = win[win.length - 1]!;
  const speeds = win.map((p) => p.v);
  const cads = win.map((p) => p.cad).filter((c): c is number => typeof c === "number" && c > 0);

  return {
    km,
    meters: Math.round(last.d - first.d),
    seconds: last.t - first.t,
    avgSpeedKmh: (speeds.reduce((a, b) => a + b, 0) / speeds.length) * 3.6,
    avgCad: cads.length ? Math.round(cads.reduce((a, b) => a + b, 0) / cads.length) : 0,
    speedSeries: win.map((p) => ({ t: p.t - first.t, v: p.v * 3.6 })),
    cadSeries: win
      .filter((p) => typeof p.cad === "number" && p.cad > 0)
      .map((p) => ({ t: p.t - first.t, v: p.cad as number })),
  };
}

/** Speed over time or distance, km/h. */
export function speedSeriesKmh(activity: GpsActivity, axis: SeriesAxis = "time"): SeriesPoint[] {
  return (activity.samples ?? []).map((s) => ({ t: xOf(s, axis), v: s.v * 3.6 }));
}

/** Pace over time or distance, seconds per km. Near-stops are dropped (pace → ∞). */
export function paceSeriesSecPerKm(
  activity: GpsActivity,
  axis: SeriesAxis = "time",
): SeriesPoint[] {
  return (activity.samples ?? [])
    .filter((s) => s.v > 0.3)
    .map((s) => ({ t: xOf(s, axis), v: 1000 / s.v }));
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

/** Cadence over time or distance (steps/min). Empty when no cadence was captured. */
export function cadenceSeriesSpm(activity: GpsActivity, axis: SeriesAxis = "time"): SeriesPoint[] {
  return (activity.samples ?? [])
    .filter((s) => typeof s.cad === "number" && s.cad > 0)
    .map((s) => ({ t: xOf(s, axis), v: s.cad as number }));
}
