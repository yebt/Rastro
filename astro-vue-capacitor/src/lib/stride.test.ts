import { describe, expect, it } from "vitest";
import { analyzeStride, cadenceBins, stridePoints } from "./stride";
import type { GpsActivity, Sample } from "./types";

const activity = (samples?: Sample[]): GpsActivity => ({
  id: "a1",
  kind: "gps",
  type: "Trote",
  date: 1_720_000_000_000,
  distance: 3000,
  duration: 1200,
  route: [],
  samples,
});

describe("stridePoints", () => {
  it("derives stride = v / (cad/60) and skips missing/stopped/implausible", () => {
    const pts = stridePoints(
      activity([
        { t: 0, d: 0, v: 2.5, cad: 150 }, // stride = 2.5 / 2.5 = 1.0
        { t: 3, d: 7, v: 2.5 }, // no cadence → skipped
        { t: 6, d: 8, v: 0.1, cad: 150 }, // basically stopped → skipped
        { t: 9, d: 20, v: 5, cad: 60 }, // stride = 5 m → implausible, skipped
      ]),
    );
    expect(pts).toHaveLength(1);
    expect(pts[0]).toMatchObject({ cad: 150, v: 2.5 });
    expect(pts[0]!.stride).toBeCloseTo(1.0, 5);
  });
});

describe("cadenceBins", () => {
  it("buckets by 5 spm and drops single-point bins", () => {
    const bins = cadenceBins([
      { t: 0, cad: 151, v: 2.5, stride: 1.0 },
      { t: 1, cad: 153, v: 2.7, stride: 1.06 },
      { t: 2, cad: 171, v: 2.8, stride: 0.98 }, // alone in its bin → dropped
    ]);
    expect(bins).toHaveLength(1);
    expect(bins[0]).toMatchObject({ cadMin: 150, cadMax: 155, cadMid: 152.5, count: 2 });
    expect(bins[0]!.avgSpeed).toBeCloseTo(2.6, 5);
  });
});

describe("analyzeStride", () => {
  it("returns null without enough cadence data", () => {
    expect(analyzeStride(activity())).toBeNull();
    expect(analyzeStride(activity([{ t: 0, d: 0, v: 2.5, cad: 150 }]))).toBeNull();
  });

  it("finds the optimal cadence and flags the plateau when speed stops rising", () => {
    // Speed climbs with cadence up to ~160, then extra cadence gives no more
    // speed (stride shortens) — the classic diminishing-returns shape.
    const samples: Sample[] = [
      { t: 0, d: 0, v: 2.0, cad: 140 },
      { t: 3, d: 6, v: 2.1, cad: 141 },
      { t: 6, d: 12, v: 2.6, cad: 160 },
      { t: 9, d: 20, v: 2.7, cad: 161 },
      { t: 12, d: 28, v: 2.5, cad: 180 },
      { t: 15, d: 35, v: 2.4, cad: 181 },
    ];
    const res = analyzeStride(activity(samples));
    expect(res).not.toBeNull();
    expect(res!.optimalCadence).toBe(163); // mid of the 160–165 bin (162.5 → 163)
    expect(res!.diminishingCadence).toBe(163); // the 180 bin was slower
  });

  it("reports no plateau when speed keeps rising to the top bin", () => {
    const samples: Sample[] = [
      { t: 0, d: 0, v: 2.0, cad: 140 },
      { t: 3, d: 6, v: 2.1, cad: 141 },
      { t: 6, d: 12, v: 2.4, cad: 160 },
      { t: 9, d: 20, v: 2.5, cad: 161 },
      { t: 12, d: 28, v: 2.9, cad: 180 },
      { t: 15, d: 37, v: 3.0, cad: 181 },
    ];
    const res = analyzeStride(activity(samples));
    expect(res!.diminishingCadence).toBeNull();
    expect(res!.optimalCadence).toBe(183); // fastest bin is the top one (182.5 → 183)
  });
});
