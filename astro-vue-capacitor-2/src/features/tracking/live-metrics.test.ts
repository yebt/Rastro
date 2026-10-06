import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrackPoint } from "./domain/track-point";
import {
  $liveMetrics,
  computeMetric,
  DEFAULT_LIVE_METRICS,
  LIVE_METRICS,
  type LiveContext,
  resetLiveMetrics,
  setLiveMetric,
} from "./live-metrics";

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => map.set(k, v),
  };
}

/** A straight walk north: `n` fixes, one per second, ~1.39 m apart (5 km/h). */
function walk(n: number): TrackPoint[] {
  const dLat = 1.3889 / 111_195; // metres → degrees of latitude
  return Array.from({ length: n }, (_, i) => ({ t: i * 1000, lat: 4.6 + i * dLat, lng: -74.08 }) as TrackPoint);
}

function ctx(points: TrackPoint[], steps = 0, cadence = 0): LiveContext {
  return { points, rawCount: points.length, steps, cadence };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", fakeStorage());
  resetLiveMetrics();
});

describe("live metrics", () => {
  it("defaults to the original six tiles", () => {
    expect($liveMetrics.get()).toEqual(DEFAULT_LIVE_METRICS);
  });

  it("every catalog metric computes without throwing on an empty track", () => {
    for (const m of LIVE_METRICS) expect(computeMetric(m.id, ctx([]))).toHaveProperty("value");
  });

  it("pace per km and per mile agree (×1.609)", () => {
    const pts = walk(361); // 360 s, ~500 m at 5 km/h → 12'00"/km
    expect(computeMetric("pace", ctx(pts)).value).toBe(`12'00"`);
    expect(computeMetric("paceMi", ctx(pts)).value).toBe(`19'19"`);
  });

  it("speed in km/h and mph", () => {
    const pts = walk(361);
    expect(computeMetric("speed", ctx(pts)).value).toBe("5.0");
    expect(computeMetric("speedMph", ctx(pts)).value).toBe("3.1");
  });

  it("current pace uses only the last minute", () => {
    // 5 min slow (half speed), then 1 min at 5 km/h: average is slower than now.
    const slow = walk(301).map((p, i) => ({ ...p, t: i * 2000 }));
    const last = slow.at(-1)!;
    const fast = walk(61).slice(1).map((p, i) => ({ ...p, t: last.t + (i + 1) * 1000, lat: last.lat + (p.lat - 4.6) }));
    const pts = [...slow, ...fast];
    expect(computeMetric("paceNow", ctx(pts)).value).toBe(`12'00"`);
    expect(computeMetric("pace", ctx(pts)).value).not.toBe(`12'00"`);
  });

  it("stride is distance over steps", () => {
    expect(computeMetric("stride", ctx(walk(361), 700)).value).toBe("0.71");
    expect(computeMetric("stride", ctx(walk(361), 0)).value).toBe("—");
  });

  it("a slot change persists and survives bad stored data", () => {
    setLiveMetric(1, "paceMi");
    expect($liveMetrics.get()[1]).toBe("paceMi");
    expect(JSON.parse(localStorage.getItem("rastro.liveMetrics")!)[1]).toBe("paceMi");
    setLiveMetric(9, "speed"); // out of range: ignored
    expect($liveMetrics.get()).toHaveLength(6);
  });
});
