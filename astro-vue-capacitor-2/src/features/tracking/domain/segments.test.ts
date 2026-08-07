import { describe, expect, it } from "vitest";
import { routeSegments } from "./segments";
import type { TrackPoint } from "./track-point";

function pt(t: number): TrackPoint {
  return { t, lat: 0, lng: t * 0.001, alt: null, acc: null, altAcc: null, spd: null };
}

describe("routeSegments", () => {
  it("splits at a pause (gap over the threshold)", () => {
    // dense samples, then a 60 s pause, then more samples
    const pts = [pt(0), pt(3000), pt(6000), pt(66_000), pt(69_000)];
    const segs = routeSegments(pts);
    expect(segs).toHaveLength(2);
    expect(segs[0]!.map((p) => p.t)).toEqual([0, 3000, 6000]);
    expect(segs[1]!.map((p) => p.t)).toEqual([66_000, 69_000]);
  });

  it("keeps a continuous track as one segment", () => {
    const pts = [pt(0), pt(3000), pt(6000), pt(9000)];
    expect(routeSegments(pts)).toHaveLength(1);
  });

  it("handles multiple pauses and edges", () => {
    const pts = [pt(0), pt(30_000), pt(31_000), pt(90_000)];
    const segs = routeSegments(pts);
    expect(segs.map((s) => s.length)).toEqual([1, 2, 1]);
  });

  it("is empty for no points", () => {
    expect(routeSegments([])).toEqual([]);
  });
});
