import { describe, expect, it } from "vitest";
import { movementSeries, splits } from "./analytics";
import type { TrackPoint } from "./track-point";

/** A point moving east from (0,0); ~111.32 km per degree of longitude at eq. */
function pt(tSec: number, lngDeg: number): TrackPoint {
  return { t: tSec * 1000, lat: 0, lng: lngDeg, alt: null, acc: null, altAcc: null, spd: null };
}

// ~0.009° lng ≈ 1002 m at the equator; use it to step ~1 km per sample.
const KM_DEG = 0.008993;

describe("splits", () => {
  it("returns one split per kilometre plus a trailing partial", () => {
    // 2.5 km over 25 min at a steady pace: 3 splits (1km, 1km, ~0.5km).
    const pts = [pt(0, 0), pt(600, KM_DEG), pt(1200, KM_DEG * 2), pt(1500, KM_DEG * 2.5)];
    const s = splits(pts);
    expect(s.length).toBe(3);
    expect(s[0]!.index).toBe(1);
    expect(s[0]!.distanceM).toBe(1000);
    // ~600 s per km → 600 s/km pace, within tolerance of the degree approximation
    expect(s[0]!.paceSecPerKm).toBeGreaterThan(560);
    expect(s[0]!.paceSecPerKm).toBeLessThan(640);
    expect(s[2]!.distanceM).toBeLessThan(1000); // trailing partial
  });

  it("is empty for a track that never moves or has one point", () => {
    expect(splits([pt(0, 0)])).toEqual([]);
    expect(splits([pt(0, 0), pt(60, 0)])).toEqual([]);
  });
});

describe("movementSeries", () => {
  it("produces the requested number of buckets with plausible speed", () => {
    // Dense fixes (every 5 s) at a steady ~1.67 m/s — real GPS cadence, not the
    // 600 s gaps used above (those exceed maxGap and are dropped by design).
    const pts: TrackPoint[] = [];
    for (let s = 0; s <= 1200; s += 5) pts.push(pt(s, (s / 600) * KM_DEG));
    const series = movementSeries(pts, 10);
    expect(series).toHaveLength(10);
    // steady ~1000 m / 600 s ≈ 1.67 m/s where there is data
    const moving = series.filter((p) => p.mps > 0);
    expect(moving.length).toBeGreaterThan(0);
    for (const p of moving) {
      expect(p.mps).toBeGreaterThan(1.4);
      expect(p.mps).toBeLessThan(2.0);
      expect(p.paceSecPerKm).not.toBeNull();
    }
  });

  it("drops pause gaps beyond maxGap so stopped time isn't counted", () => {
    // a 1-hour gap between two fixes must not create a slow bucket
    const pts = [pt(0, 0), pt(3600, KM_DEG)];
    const series = movementSeries(pts, 5);
    expect(series.every((p) => p.mps === 0)).toBe(true);
  });

  it("is empty for degenerate input", () => {
    expect(movementSeries([pt(0, 0)])).toEqual([]);
  });
});
