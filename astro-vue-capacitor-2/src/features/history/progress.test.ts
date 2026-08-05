import { describe, expect, it } from "vitest";
import type { MoveActivity, TrackPoint } from "../tracking";
import { records, sessionSeries } from "./progress";

function pt(t: number, lng: number): TrackPoint {
  return { t, lat: 0, lng, alt: null, acc: null, altAcc: null, spd: null };
}

// Dense fixes (every 5 s) covering ~lng degrees, so metrics are real.
function run(startedAt: number, type: MoveActivity["type"], degrees: number): MoveActivity {
  const points: TrackPoint[] = [];
  const secs = 600;
  for (let s = 0; s <= secs; s += 5) {
    points.push(pt(startedAt + s * 1000, (s / secs) * degrees));
  }
  return {
    id: String(startedAt),
    schemaVersion: 1,
    kind: "move",
    type,
    startedAt,
    endedAt: startedAt + secs * 1000,
    points,
    movingMs: secs * 1000,
  };
}

describe("progress", () => {
  const acts: MoveActivity[] = [
    run(3000, "run", 0.018), // newest, longer
    run(1000, "run", 0.009), // oldest
    run(2000, "jog", 0.02), // other type, ignored
  ];

  it("builds a chronological series for one type", () => {
    const s = sessionSeries(acts, "run");
    expect(s).toHaveLength(2);
    expect(s[0]!.t).toBe(1000); // oldest first
    expect(s[1]!.t).toBe(3000);
    expect(s[1]!.distanceM).toBeGreaterThan(s[0]!.distanceM);
  });

  it("summarizes records over the series", () => {
    const r = records(sessionSeries(acts, "run"));
    expect(r.count).toBe(2);
    expect(r.longestM).toBeGreaterThan(1500);
    expect(r.bestPaceSecPerKm).not.toBeNull();
  });

  it("is empty for a type with no sessions", () => {
    expect(sessionSeries(acts, "walk")).toEqual([]);
    expect(records([])).toEqual({ count: 0, longestM: 0, bestPaceSecPerKm: null });
  });
});
