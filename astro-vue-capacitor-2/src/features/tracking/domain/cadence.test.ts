import { describe, expect, it } from "vitest";
import { cadenceAnalysis } from "./cadence";
import type { TrackPoint } from "./track-point";

const KM_DEG = 0.008993;

// Build a run where cadence rises but stride is longest in the middle band.
function pt(tSec: number, lng: number, st: number): TrackPoint {
  return { t: tSec * 1000, lat: 0, lng, alt: null, acc: null, altAcc: null, spd: null, st };
}

describe("cadenceAnalysis", () => {
  it("bins cadence and finds the most efficient (longest stride) cadence", () => {
    const pts: TrackPoint[] = [];
    let lng = 0;
    let steps = 0;
    // Phase 1: cadence ~150, stride ~0.8 m (5 s steps of ~10 m, 12.5 steps)
    for (let k = 0; k < 20; k++) {
      lng += (10 / (KM_DEG * 111320)) * KM_DEG; // ~10 m east
      steps += 12.5; // 12.5 steps / 5 s → 150 spm; stride 10/12.5 = 0.8 m
      pts.push(pt((pts.length + 1) * 5, lng, steps));
    }
    // Phase 2: cadence ~180 but stride only ~0.56 m (shorter steps, 9 m per 5 s, 16 steps)
    for (let k = 0; k < 20; k++) {
      lng += (9 / (KM_DEG * 111320)) * KM_DEG;
      steps += 15; // 15 steps / 5 s → 180 spm; stride 9/15 = 0.6 m
      pts.push(pt((pts.length + 1) * 5, lng, steps));
    }
    pts.unshift(pt(0, 0, 0));

    const a = cadenceAnalysis(pts);
    expect(a.bins.length).toBeGreaterThan(0);
    expect(a.bestStride).not.toBeNull();
    // most efficient stride is the ~150 band, not the ~180 one
    expect(a.bestStride!.cadence).toBeLessThan(a.peakSpeed!.cadence + 1);
    expect(a.bestStride!.strideM).toBeGreaterThan(0.7);
  });

  it("is empty when no point carries steps", () => {
    const pts = [pt(0, 0, 0), pt(5, KM_DEG, 0)].map(({ st: _s, ...p }) => p) as TrackPoint[];
    expect(cadenceAnalysis(pts).bins).toEqual([]);
    expect(cadenceAnalysis(pts).bestStride).toBeNull();
  });
});
