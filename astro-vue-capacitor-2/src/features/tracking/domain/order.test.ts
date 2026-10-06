import { describe, expect, it } from "vitest";
import { insertionIndex, orderTrackPoints } from "./order";
import type { TrackPoint } from "./track-point";

const p = (t: number, st?: number): TrackPoint =>
  ({ t, lat: 4 + t / 1e6, lng: -76, alt: null, acc: 3, altAcc: null, spd: null, ...(st == null ? {} : { st }) });

describe("orderTrackPoints", () => {
  it("returns the same array when already ordered", () => {
    const pts = [p(1, 0), p(2, 1), p(3, 2)];
    expect(orderTrackPoints(pts)).toBe(pts);
  });

  it("sorts a late-flushed backlog back into place (the real-world case)", () => {
    // Live fixes at 1250–1251 s, then the app returns at ~1980 s: a live fix
    // arrives, then the buffered backlog from 1251.6 s on, all stamped with the
    // step count at arrival (4890).
    const pts = [p(1250, 2650), p(1251, 2650), p(1980, 2650), p(1981, 4890), p(1252, 4890), p(1253, 4890)];
    const out = orderTrackPoints(pts);
    expect(out.map((x) => x.t)).toEqual([1250, 1251, 1252, 1253, 1980, 1981]);
    // Steps never go backwards along the track.
    const st = out.map((x) => x.st!);
    expect(st).toEqual([...st].sort((a, b) => a - b));
  });

  it("drops same-instant duplicates", () => {
    expect(orderTrackPoints([p(1), p(3), p(2), p(3)]).map((x) => x.t)).toEqual([1, 2, 3]);
  });

  it("insertionIndex finds the slot after equal times", () => {
    const pts = [p(1), p(3), p(5)];
    expect(insertionIndex(pts, 0)).toBe(0);
    expect(insertionIndex(pts, 3)).toBe(2);
    expect(insertionIndex(pts, 4)).toBe(2);
    expect(insertionIndex(pts, 9)).toBe(3);
  });
});
