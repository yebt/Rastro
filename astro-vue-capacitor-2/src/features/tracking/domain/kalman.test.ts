import { describe, expect, it } from "vitest";
import { kalmanFilter } from "./kalman";
import { distanceMeters } from "./metrics";
import type { TrackPoint } from "./track-point";

const M = 1.112e-5; // ~1 m of longitude at the equator

function p(lng: number, t: number, acc = 10): TrackPoint {
  return { lat: 0, lng, t, alt: null, acc, altAcc: null, spd: null };
}

describe("kalmanFilter", () => {
  it("returns nothing for no points and leaves the first fix as-is", () => {
    expect(kalmanFilter([])).toEqual([]);
    const out = kalmanFilter([p(5 * M, 0)]);
    expect(out[0]!.lng).toBeCloseTo(5 * M, 10);
  });

  it("smooths jitter so a stationary track measures less distance", () => {
    // Standing still, GPS wandering ±5 m each second.
    const jitter = [p(0, 0), p(5 * M, 1000), p(-5 * M, 2000), p(5 * M, 3000), p(-5 * M, 4000)];
    expect(distanceMeters(kalmanFilter(jitter))).toBeLessThan(distanceMeters(jitter));
  });

  it("keeps a real straight move meaningful (doesn't collapse it)", () => {
    const line = [p(0, 0), p(10 * M, 1000), p(20 * M, 2000), p(30 * M, 3000)];
    const smoothed = distanceMeters(kalmanFilter(line));
    expect(smoothed).toBeGreaterThan(15); // still tens of metres, not flattened
    expect(smoothed).toBeLessThanOrEqual(distanceMeters(line));
  });
});
