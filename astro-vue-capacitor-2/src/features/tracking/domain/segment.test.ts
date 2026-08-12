import { describe, expect, it } from "vitest";
import type { MoveActivity } from "./activity";
import { matchSegment, segmentEfforts, segmentFromActivity } from "./segment";
import type { TrackPoint } from "./track-point";

const KM_DEG = 0.008993; // ~1 km of longitude at the equator

function pt(tSec: number, lng: number, lat = 0): TrackPoint {
  return { t: tSec * 1000, lat, lng, alt: null, acc: null, altAcc: null, spd: null };
}

// A run east along the equator, `secs` per km, `km` long, dense every 5 s.
function run(id: string, startedAt: number, secsPerKm: number, km: number): MoveActivity {
  const points: TrackPoint[] = [];
  const total = secsPerKm * km;
  for (let s = 0; s <= total; s += 5) {
    points.push(pt(s, (s / total) * KM_DEG * km));
  }
  return { id, schemaVersion: 1, kind: "move", type: "run", startedAt, endedAt: startedAt, points, movingMs: total * 1000 };
}

describe("segments", () => {
  const base = run("a", 1000, 600, 2); // 2 km at 600 s/km
  const seg = segmentFromActivity("seg1", "Vuelta al parque", base, 0)!;

  it("builds a segment from a route", () => {
    expect(seg.name).toBe("Vuelta al parque");
    expect(seg.distanceM).toBeGreaterThan(1900);
    expect(seg.start.lng).toBeCloseTo(0, 5);
  });

  it("matches an activity that covers the segment and times it", () => {
    const e = matchSegment(seg, base)!;
    expect(e).not.toBeNull();
    expect(e.paceSecPerKm).toBeGreaterThan(560);
    expect(e.paceSecPerKm).toBeLessThan(640);
  });

  it("does not match an activity far from the segment", () => {
    const far = run("b", 2000, 600, 2);
    far.points = far.points.map((p) => ({ ...p, lat: 1 })); // 111 km north
    expect(matchSegment(seg, far)).toBeNull();
  });

  it("builds a sub-range segment from a distance window", () => {
    // base is 2 km; take the 2nd km (1000..2000 m)
    const sub = segmentFromActivity("seg2", "2do km", base, 0, 1000, 2000)!;
    expect(sub).not.toBeNull();
    expect(sub.distanceM).toBeCloseTo(1000, -2);
    expect(sub.start.lng).toBeGreaterThan(0); // starts partway in, not at 0
    const e = matchSegment(sub, base)!;
    expect(e.paceSecPerKm).toBeGreaterThan(560);
    expect(e.paceSecPerKm).toBeLessThan(640);
  });

  it("ranks efforts fastest first", () => {
    const faster = run("c", 3000, 480, 2); // quicker
    const efforts = segmentEfforts(seg, [base, faster]);
    expect(efforts).toHaveLength(2);
    expect(efforts[0]!.activityId).toBe("c"); // fastest PR first
  });
});
