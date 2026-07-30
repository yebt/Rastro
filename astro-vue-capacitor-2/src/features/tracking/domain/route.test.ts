import { describe, expect, it } from "vitest";
import { projectRoute } from "./route";
import type { TrackPoint } from "./track-point";

function p(lat: number, lng: number): TrackPoint {
  return { lat, lng, t: 0, alt: null, acc: null, altAcc: null, spd: null };
}

describe("projectRoute", () => {
  it("returns null only with no points", () => {
    expect(projectRoute([], 300, 180)).toBeNull();
  });

  it("marks a single fix at the centre", () => {
    const r = projectRoute([p(1.23, 4.56)], 300, 180)!;
    expect(r.start).toEqual({ x: 150, y: 90 });
    expect(r.end).toEqual({ x: 150, y: 90 });
  });

  it("does not zoom a near-stationary track to fill the box", () => {
    // Two points ~2 m apart: with a ~100 m minimum span they stay near centre.
    const r = projectRoute([p(0, 0), p(0, 0.00002)], 300, 180)!;
    expect(r.start.x).toBeGreaterThan(120);
    expect(r.end.x).toBeLessThan(180);
  });

  it("emits one move + one line-to per subsequent point", () => {
    const r = projectRoute([p(0, 0), p(0, 1), p(0, 2)], 300, 180);
    expect(r).not.toBeNull();
    expect(r!.d.startsWith("M")).toBe(true);
    expect((r!.d.match(/L/g) ?? []).length).toBe(2);
  });

  it("fits within the padded box and centers a horizontal line", () => {
    const pad = 10;
    const r = projectRoute([p(0, 0), p(0, 1)], 300, 180, pad)!;
    // Longitude spans the width; latitude is constant → vertically centered.
    expect(r.start.x).toBeCloseTo(pad, 1);
    expect(r.end.x).toBeCloseTo(300 - pad, 1);
    expect(r.start.y).toBeCloseTo(90, 1);
    expect(r.end.y).toBeCloseTo(90, 1);
  });

  it("puts north (higher latitude) at a smaller y", () => {
    // Vertical route: same lng, increasing lat. The last point is further north,
    // so it should sit higher on screen (smaller y) than the first.
    const r = projectRoute([p(0, 0), p(1, 0)], 300, 180)!;
    expect(r.end.y).toBeLessThan(r.start.y);
  });

  it("keeps every projected point inside the box", () => {
    const r = projectRoute([p(-34.6, -58.4), p(-34.61, -58.39), p(-34.62, -58.41)], 300, 180)!;
    for (const n of r.d.match(/-?\d+(\.\d+)?/g)!.map(Number)) {
      expect(n).toBeGreaterThanOrEqual(0);
    }
    expect(r.start.x).toBeGreaterThanOrEqual(0);
    expect(r.end.x).toBeLessThanOrEqual(300);
  });
});
