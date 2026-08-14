import { describe, expect, it } from "vitest";
import { routeInsights } from "./insights";
import type { TrackPoint } from "./track-point";

const KM_DEG = 0.008993;

// A 3 km run whose 3rd km is much faster (a surge).
function surge(): TrackPoint[] {
  const pts: TrackPoint[] = [pt(0, 0)];
  let t = 0;
  let lng = 0;
  const legs = [600, 600, 400]; // seconds per km; last km faster
  for (const secPerKm of legs) {
    for (let s = 5; s <= secPerKm; s += 5) {
      lng += (KM_DEG * 5) / secPerKm; // advance 1 km worth over secPerKm
      t += 5;
      pts.push(pt(t, lng));
    }
  }
  return pts;
}
function pt(tSec: number, lng: number): TrackPoint {
  return { t: tSec * 1000, lat: 0, lng, alt: null, acc: null, altAcc: null, spd: null };
}

describe("routeInsights", () => {
  it("names the fastest km and flags the surge", () => {
    const ins = routeInsights(surge());
    expect(ins.length).toBeGreaterThan(0);
    expect(ins.some((s) => /más rápido fue el K3/.test(s))).toBe(true);
    expect(ins.some((s) => /Apretaste/.test(s))).toBe(true);
  });

  it("is empty-ish for a tiny track", () => {
    expect(routeInsights([pt(0, 0), pt(5, 0.0001)]).length).toBeLessThanOrEqual(1);
  });
});
