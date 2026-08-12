/**
 * Optimal-cadence engine (SPECS §8, the central idea). Since velocity = stride ×
 * (cadence/60), the useful question isn't cadence vs distance but cadence vs
 * STRIDE and speed: at which cadence does each step still carry you far?
 *
 * Per GPS segment (with per-point cumulative steps `st`) we get an exact stride
 * (metres/step) and cadence (steps/min); we bin by cadence and average, then
 * surface the most efficient cadence (longest stride) and the fastest one.
 */

import { haversineMeters } from "./metrics";
import type { TrackPoint } from "./track-point";

export interface CadenceBin {
  /** Cadence bin centre, steps/min. */
  cadence: number;
  /** Average speed in the bin, m/s. */
  mps: number;
  /** Average stride length in the bin, m/step. */
  strideM: number;
  count: number;
}

export interface CadenceAnalysis {
  bins: CadenceBin[];
  /** Best-sampled cadence with the longest stride (most efficient). */
  bestStride: CadenceBin | null;
  /** Best-sampled cadence with the highest speed. */
  peakSpeed: CadenceBin | null;
}

export function cadenceAnalysis(
  points: TrackPoint[],
  binSize = 5,
  minCount = 3,
  maxGapMs = 10_000,
): CadenceAnalysis {
  const acc = new Map<number, { v: number; s: number; n: number }>();
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    if (a.st == null || b.st == null) continue;
    const dtMs = b.t - a.t;
    if (dtMs <= 0 || dtMs > maxGapMs) continue;
    const ds = b.st - a.st;
    if (ds <= 0) continue;
    const dist = haversineMeters(a, b);
    if (dist <= 0) continue;
    const dt = dtMs / 1000;
    const cad = (ds / dt) * 60;
    if (cad < 40 || cad > 240) continue; // discard sensor noise
    const stride = dist / ds;
    if (stride < 0.2 || stride > 2.5) continue;
    const bin = Math.round(cad / binSize) * binSize;
    const e = acc.get(bin) ?? { v: 0, s: 0, n: 0 };
    e.v += dist / dt;
    e.s += stride;
    e.n += 1;
    acc.set(bin, e);
  }

  const bins: CadenceBin[] = [...acc.entries()]
    .map(([cadence, e]) => ({ cadence, mps: e.v / e.n, strideM: e.s / e.n, count: e.n }))
    .sort((a, b) => a.cadence - b.cadence);

  const good = bins.filter((b) => b.count >= minCount);
  const bestStride = good.length ? good.reduce((m, b) => (b.strideM > m.strideM ? b : m)) : null;
  const peakSpeed = good.length ? good.reduce((m, b) => (b.mps > m.mps ? b : m)) : null;
  return { bins, bestStride, peakSpeed };
}
