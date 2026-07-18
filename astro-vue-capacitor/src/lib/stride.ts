/**
 * Stride & optimal-cadence engine (F8, SPECS §8 — the central idea).
 *
 * Core relation:  speed (m/s) = stride (m) × cadence (steps/s)
 *                 stride = speed / (cadence / 60)
 *
 * We turn each captured sample into a (cadence, speed, stride) point, bin by
 * cadence, and find the cadence range where the stride stays long AND speed is
 * still rising. Beyond that, extra cadence stops buying speed → shortening step.
 *
 * Pure — no DOM. Degrades to `null` when an activity lacks cadence samples.
 */

import type { GpsActivity } from "./types";

/** A single usable data point: cadence, speed and derived stride. */
export interface StridePoint {
  /** seconds since start */
  t: number;
  /** steps per minute */
  cad: number;
  /** meters per second */
  v: number;
  /** meters advanced per step */
  stride: number;
}

/** Averaged metrics for one cadence bucket. */
export interface CadenceBin {
  cadMin: number;
  cadMax: number;
  cadMid: number;
  avgSpeed: number;
  avgStride: number;
  count: number;
}

export interface StrideAnalysis {
  points: StridePoint[];
  bins: CadenceBin[];
  /** cadence (steps/min) at the best-speed bin — the "efficient" cadence */
  optimalCadence: number;
  /** stride length (m/step) at the optimal cadence */
  optimalStride: number;
  /** speed (m/s) at the optimal cadence */
  optimalSpeed: number;
  /**
   * cadence above which speed stopped rising (a higher-cadence bin was not
   * faster). null when speed kept climbing to the top bin — no plateau seen.
   */
  diminishingCadence: number | null;
}

const BIN_WIDTH = 5; // steps/min per bucket
const MIN_SPEED = 0.5; // m/s — below this the runner is basically stopped
const MIN_STRIDE = 0.2; // m — reject implausible (GPS/cadence noise)
const MAX_STRIDE = 2.5; // m — a running stride tops out well under this
const MIN_POINTS_PER_BIN = 2;
const MIN_BINS = 2;
const MIN_POINTS = 6;

/** Build the raw (cadence, speed, stride) cloud from an activity's samples. */
export function stridePoints(activity: GpsActivity): StridePoint[] {
  const out: StridePoint[] = [];
  for (const s of activity.samples ?? []) {
    if (typeof s.cad !== "number" || s.cad <= 0 || s.v < MIN_SPEED) continue;
    const stride = s.v / (s.cad / 60);
    if (stride < MIN_STRIDE || stride > MAX_STRIDE) continue;
    out.push({ t: s.t, cad: s.cad, v: s.v, stride });
  }
  return out;
}

/** Group points into fixed-width cadence bins, keeping only populated ones. */
export function cadenceBins(points: StridePoint[]): CadenceBin[] {
  const buckets = new Map<number, StridePoint[]>();
  for (const p of points) {
    const key = Math.floor(p.cad / BIN_WIDTH) * BIN_WIDTH;
    const list = buckets.get(key);
    if (list) list.push(p);
    else buckets.set(key, [p]);
  }

  const bins: CadenceBin[] = [];
  for (const [key, list] of buckets) {
    if (list.length < MIN_POINTS_PER_BIN) continue;
    const avgSpeed = list.reduce((a, p) => a + p.v, 0) / list.length;
    const avgStride = list.reduce((a, p) => a + p.stride, 0) / list.length;
    bins.push({
      cadMin: key,
      cadMax: key + BIN_WIDTH,
      cadMid: key + BIN_WIDTH / 2,
      avgSpeed,
      avgStride,
      count: list.length,
    });
  }

  return bins.toSorted((a, b) => a.cadMid - b.cadMid);
}

/**
 * Full analysis, or null when there isn't enough cadence data to say anything
 * meaningful (old activities, or the accelerometer never fired).
 */
export function analyzeStride(activity: GpsActivity): StrideAnalysis | null {
  const points = stridePoints(activity);
  if (points.length < MIN_POINTS) return null;

  const bins = cadenceBins(points);
  if (bins.length < MIN_BINS) return null;

  // The "efficient" cadence is the one delivering the most speed.
  let best = bins[0]!;
  for (const b of bins) if (b.avgSpeed > best.avgSpeed) best = b;

  // If any higher-cadence bin failed to beat that speed, that's the plateau.
  const hasHigherButSlower = bins.some(
    (b) => b.cadMid > best.cadMid && b.avgSpeed <= best.avgSpeed,
  );

  return {
    points,
    bins,
    optimalCadence: Math.round(best.cadMid),
    optimalStride: best.avgStride,
    optimalSpeed: best.avgSpeed,
    diminishingCadence: hasHigherButSlower ? Math.round(best.cadMid) : null,
  };
}
