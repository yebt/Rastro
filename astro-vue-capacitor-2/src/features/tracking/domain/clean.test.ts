import { describe, expect, it } from "vitest";
import { cleanTrack } from "./clean";
import type { TrackPoint } from "./track-point";

function p(lng: number, acc: number | null): TrackPoint {
  return { lat: 0, lng, t: 0, alt: null, acc, altAcc: null, spd: null };
}

// At the equator, 1e-5 deg of longitude ≈ 1.11 m.
const M = 1.112e-5;

describe("cleanTrack", () => {
  it("keeps the first usable fix", () => {
    expect(cleanTrack([p(0, 10)])).toHaveLength(1);
    expect(cleanTrack([])).toHaveLength(0);
  });

  it("drops fixes with accuracy worse than the max", () => {
    // Second fix is a real ~11m move but its accuracy is 50m → rejected.
    const out = cleanTrack([p(0, 10), p(10 * M, 50)]);
    expect(out).toHaveLength(1);
  });

  it("treats sub-noise-floor moves as jitter", () => {
    // acc 10 → noise floor 5 m. A ~3 m hop is jitter; an ~11 m move counts.
    const out = cleanTrack([p(0, 10), p(3 * M, 10), p(11 * M, 10)]);
    expect(out).toHaveLength(2); // first + the 11 m point (the 3 m hop dropped)
    expect(out[1]!.lng).toBeCloseTo(11 * M, 8);
  });

  it("accumulates sustained movement across fixes despite drops", () => {
    // Each step ~11 m with good accuracy → all real moves.
    const out = cleanTrack([p(0, 8), p(11 * M, 8), p(22 * M, 8), p(33 * M, 8)]);
    expect(out).toHaveLength(4);
  });
});
