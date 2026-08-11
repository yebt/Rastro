/**
 * Route analytics for the activity detail charts — per-kilometre splits and a
 * speed/pace-over-time series. Pure and derived from raw points (never stored),
 * like every other metric. `now`-free and deterministic, so it's unit-testable.
 */

import {
  avgPaceSecPerKm,
  elevationGainM,
  elevationLossM,
  haversineMeters,
} from "./metrics";
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

// ---- Aggregate analytics (for the Stats panel) --------------------------------

export interface SplitStats {
  /** Fastest / slowest / average split pace, s/km, and their spread. */
  best: number | null;
  worst: number | null;
  avg: number | null;
  spread: number | null;
}

export function splitStats(list: Split[]): SplitStats {
  const p = list.map((s) => s.paceSecPerKm).filter((x): x is number => x != null);
  if (!p.length) return { best: null, worst: null, avg: null, spread: null };
  const best = Math.min(...p);
  const worst = Math.max(...p);
  const avg = p.reduce((a, b) => a + b, 0) / p.length;
  return { best, worst, avg, spread: worst - best };
}

export interface SpeedExtremes {
  maxMps: number;
  minMovingMps: number | null;
}

export function speedExtremes(series: SeriesPoint[]): SpeedExtremes {
  const moving = series.filter((s) => s.mps > 0).map((s) => s.mps);
  return {
    maxMps: moving.length ? Math.max(...moving) : 0,
    minMovingMps: moving.length ? Math.min(...moving) : null,
  };
}

export interface HalfSplit {
  firstPace: number | null;
  secondPace: number | null;
  /** negative = sped up (2nd half faster), positive = slowed down, even = same. */
  kind: "negative" | "positive" | "even";
}

/** First-half vs second-half pace, split by distance — the classic pacing read. */
export function halfSplit(points: TrackPoint[]): HalfSplit {
  if (points.length < 3) return { firstPace: null, secondPace: null, kind: "even" };
  let total = 0;
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1]!, points[i]!);
    cum.push(total);
  }
  const half = total / 2;
  let mid = 1;
  while (mid < cum.length - 1 && cum[mid]! < half) mid++;
  const first = avgPaceSecPerKm(points.slice(0, mid + 1));
  const second = avgPaceSecPerKm(points.slice(mid));
  let kind: HalfSplit["kind"] = "even";
  if (first != null && second != null) {
    if (second < first * 0.98) kind = "negative";
    else if (second > first * 1.02) kind = "positive";
  }
  return { firstPace: first, secondPace: second, kind };
}

export interface ElevationStats {
  gainM: number;
  lossM: number;
  maxAlt: number | null;
  minAlt: number | null;
}

export function elevationStats(points: TrackPoint[]): ElevationStats {
  const alts = points.map((p) => p.alt).filter((a): a is number => a != null);
  return {
    gainM: elevationGainM(points),
    lossM: elevationLossM(points),
    maxAlt: alts.length ? Math.max(...alts) : null,
    minAlt: alts.length ? Math.min(...alts) : null,
  };
}

export interface StridePoint {
  tMs: number;
  /** Metres per step in this bucket, or null when steps weren't captured. */
  strideM: number | null;
  /** Steps per minute in this bucket, or null. */
  cadence: number | null;
}

/**
 * Stride length and cadence resampled over time, from per-point cumulative steps
 * (`st`, stamped by the recorder). Only available for activities recorded with
 * step capture; returns [] when no point carries `st`.
 */
export function strideSeries(points: TrackPoint[], buckets = 40, maxGapMs = 10_000): StridePoint[] {
  if (points.length < 2 || !points.some((p) => p.st != null)) return [];
  const t0 = points[0]!.t;
  const total = points[points.length - 1]!.t - t0;
  if (total <= 0) return [];

  const bucketMs = total / buckets;
  const dist = new Array<number>(buckets).fill(0);
  const steps = new Array<number>(buckets).fill(0);
  const time = new Array<number>(buckets).fill(0);

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const dt = b.t - a.t;
    if (dt <= 0 || dt > maxGapMs) continue;
    if (a.st == null || b.st == null) continue;
    const ds = Math.max(0, b.st - a.st);
    const mid = (a.t + b.t) / 2 - t0;
    const bi = Math.min(buckets - 1, Math.max(0, Math.floor(mid / bucketMs)));
    dist[bi]! += haversineMeters(a, b);
    steps[bi]! += ds;
    time[bi]! += dt;
  }

  return Array.from({ length: buckets }, (_, i) => ({
    tMs: (i + 0.5) * bucketMs,
    strideM: steps[i]! > 0 ? dist[i]! / steps[i]! : null,
    cadence: time[i]! > 0 && steps[i]! > 0 ? Math.round(steps[i]! / (time[i]! / 60_000)) : null,
  }));
}
