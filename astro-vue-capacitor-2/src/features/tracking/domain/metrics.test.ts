import { describe, expect, it } from "vitest";
import {
  avgPaceSecPerKm,
  avgSpeedMps,
  distanceMeters,
  elevationGainM,
  elevationLossM,
  hasElevation,
  haversineMeters,
  movingDurationMs,
  pausedMs,
  spanMs,
} from "./metrics";
import type { TrackPoint } from "./track-point";

/** Point carrying only an altitude — the axis elevation cares about. */
function alt(a: number | null): TrackPoint {
  return { lat: 0, lng: 0, t: 0, alt: a, acc: null, altAcc: null, spd: null };
}

/** Terse TrackPoint builder — only lat/lng/t matter for these metrics. */
function p(lat: number, lng: number, t: number): TrackPoint {
  return { lat, lng, t, alt: null, acc: null, altAcc: null, spd: null };
}

describe("tracking metrics", () => {
  it("haversine ~ one degree at the equator (spherical R=6371km)", () => {
    // ~111.2 km per degree on a sphere; ellipsoid figures differ slightly.
    expect(haversineMeters(p(0, 0, 0), p(0, 1, 0))).toBeCloseTo(111_195, -2);
  });

  it("distance sums consecutive legs", () => {
    const d = distanceMeters([p(0, 0, 0), p(0, 1, 0), p(0, 2, 0)]);
    expect(d).toBeCloseTo(222_390, -2);
  });

  it("distance is 0 for fewer than two points", () => {
    expect(distanceMeters([])).toBe(0);
    expect(distanceMeters([p(10, 10, 0)])).toBe(0);
  });

  it("spanMs is first-to-last, 0 under two points", () => {
    expect(spanMs([p(0, 0, 1000), p(0, 0, 4000)])).toBe(3000);
    expect(spanMs([p(0, 0, 1000)])).toBe(0);
  });

  it("movingDuration drops gaps longer than the cap (pauses / dropouts)", () => {
    // 1s, 1s, [58s pause dropped], 1s  ->  3000 ms moving.
    const pts = [p(0, 0, 0), p(0, 0, 1000), p(0, 0, 2000), p(0, 0, 60_000), p(0, 0, 61_000)];
    expect(movingDurationMs(pts)).toBe(3000);
  });

  it("avgSpeed is distance over moving time", () => {
    // 111.195 m in 1s of moving time -> ~111.2 m/s.
    const pts = [p(0, 0, 0), p(0, 0.001, 1000)];
    expect(avgSpeedMps(pts)).toBeCloseTo(111.2, 0);
  });

  it("elevationGain sums real ascent and ignores noise", () => {
    expect(elevationGainM([alt(0), alt(5), alt(10), alt(15)])).toBe(15); // steady climb
    expect(elevationGainM([alt(0), alt(1), alt(-1), alt(2), alt(-2), alt(0)])).toBe(0); // ±<3 wobble
    expect(elevationGainM([alt(0), alt(1), alt(4), alt(3), alt(7)])).toBe(7); // climb through noise
  });

  it("elevationLoss sums real descent", () => {
    expect(elevationLossM([alt(20), alt(15), alt(10)])).toBe(10);
    expect(elevationLossM([alt(0), alt(1), alt(-1)])).toBe(0);
  });

  it("elevation skips points without altitude", () => {
    expect(elevationGainM([alt(0), alt(null), alt(5)])).toBe(5);
    expect(hasElevation([alt(null), alt(null)])).toBe(false);
    expect(hasElevation([alt(null), alt(3)])).toBe(true);
  });

  it("pausedMs is total wall time minus moving time", () => {
    expect(pausedMs(1000, 11_000, 7000)).toBe(3000); // 10s span, 7s moving → 3s paused
    expect(pausedMs(1000, 11_000, 10_000)).toBe(0); // never paused
    expect(pausedMs(1000, null, 5000)).toBe(0); // still open
    expect(pausedMs(1000, 6000, 9000)).toBe(0); // clamps, never negative
  });

  it("avgPace is null when there is no distance or no movement", () => {
    expect(avgPaceSecPerKm([p(0, 0, 0), p(0, 0, 1000)])).toBeNull();
    expect(avgPaceSecPerKm([p(0, 0, 0)])).toBeNull();
  });

  it("avgPace is seconds per kilometre", () => {
    // 1 km over two 5 s legs (each within the gap cap) -> 10 s of moving time,
    // so 10 s/km. Legs must stay under maxGapMs or they'd be dropped.
    const pts = [p(0, 0, 0), p(0, 0.0044966, 5000), p(0, 0.0089932, 10_000)];
    const pace = avgPaceSecPerKm(pts);
    expect(pace).not.toBeNull();
    expect(pace!).toBeCloseTo(10, 0);
  });
});
