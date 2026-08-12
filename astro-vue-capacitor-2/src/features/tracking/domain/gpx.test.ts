import { describe, expect, it } from "vitest";
import type { MoveActivity } from "./activity";
import { toGpx } from "./gpx";
import type { TrackPoint } from "./track-point";

function pt(tSec: number, lat: number, lng: number, alt: number | null = null): TrackPoint {
  return { t: tSec * 1000, lat, lng, alt, acc: null, altAcc: null, spd: null };
}

function act(points: TrackPoint[]): MoveActivity {
  return { id: "a", schemaVersion: 1, kind: "move", type: "run", startedAt: 0, endedAt: 1, points };
}

describe("toGpx", () => {
  it("emits a trkpt per point with lat/lon, ele and time", () => {
    const gpx = toGpx(act([pt(0, 1.5, -2.5, 120), pt(5, 1.6, -2.6, 130)]));
    expect(gpx).toContain('<gpx version="1.1"');
    expect((gpx.match(/<trkpt/g) ?? []).length).toBe(2);
    expect(gpx).toContain('lat="1.500000"');
    expect(gpx).toContain('lon="-2.500000"');
    expect(gpx).toContain("<ele>120.0</ele>");
    expect(gpx).toContain("<time>1970-01-01T00:00:00.000Z</time>");
  });

  it("splits into a trkseg per pause and omits ele when absent", () => {
    // 60 s gap → two segments; no altitude
    const gpx = toGpx(act([pt(0, 0, 0), pt(5, 0, 0.001), pt(65, 0, 0.002), pt(70, 0, 0.003)]));
    expect((gpx.match(/<trkseg>/g) ?? []).length).toBe(2);
    expect(gpx).not.toContain("<ele>");
  });
});
