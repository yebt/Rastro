import { describe, expect, it } from "vitest";
import { applyFilter } from "./filters";
import { distanceMeters } from "./metrics";
import type { TrackPoint } from "./track-point";

const M = 1.112e-5;
function p(lng: number, t: number, acc = 10): TrackPoint {
  return { lat: 0, lng, t, alt: null, acc, altAcc: null, spd: null };
}

describe("applyFilter", () => {
  // ±3 m hops with 10 m accuracy — below the drift noise floor (5 m).
  const jitter = [p(0, 0), p(3 * M, 1000), p(-3 * M, 2000), p(3 * M, 3000), p(-3 * M, 4000)];

  it("raw keeps every point untouched", () => {
    expect(applyFilter("raw", jitter)).toEqual(jitter);
  });

  it("drift, kalman and D+K all measure less stationary distance than raw", () => {
    const raw = distanceMeters(applyFilter("raw", jitter));
    for (const id of ["drift", "kalman", "smooth"] as const) {
      expect(distanceMeters(applyFilter(id, jitter))).toBeLessThan(raw);
    }
  });

  it("falls back to drift for an unknown id", () => {
    // @ts-expect-error — exercising the runtime fallback
    expect(applyFilter("nope", jitter)).toEqual(applyFilter("drift", jitter));
  });
});
