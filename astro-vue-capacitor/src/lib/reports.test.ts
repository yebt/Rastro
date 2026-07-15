import { describe, expect, it } from "vitest";
import {
  fastestSplit,
  hasSamples,
  paceSeriesSecPerKm,
  speedSeriesKmh,
  splitsPerKm,
} from "./reports";
import type { GpsActivity, Sample } from "./types";

const activity = (samples?: Sample[]): GpsActivity => ({
  id: "a1",
  kind: "gps",
  type: "Trote",
  date: 1_720_000_000_000,
  distance: 2200,
  duration: 900,
  route: [],
  samples,
});

const samples: Sample[] = [
  { t: 0, d: 0, v: 2.5 },
  { t: 200, d: 500, v: 2.5 },
  { t: 400, d: 1000, v: 2.5 },
  { t: 600, d: 1500, v: 2.5 },
  { t: 800, d: 2000, v: 2.5 },
  { t: 900, d: 2200, v: 2.0 },
];

describe("hasSamples", () => {
  it("is false without enough samples", () => {
    expect(hasSamples(activity())).toBe(false);
    expect(hasSamples(activity([{ t: 0, d: 0, v: 1 }]))).toBe(false);
    expect(hasSamples(activity(samples))).toBe(true);
  });
});

describe("splitsPerKm", () => {
  it("returns empty without samples", () => {
    expect(splitsPerKm(activity())).toEqual([]);
  });

  it("computes full km splits plus a trailing partial", () => {
    const splits = splitsPerKm(activity(samples));
    expect(splits).toHaveLength(3);
    expect(splits[0]).toMatchObject({ km: 1, meters: 1000, seconds: 400, partial: false });
    expect(splits[1]).toMatchObject({ km: 2, meters: 1000, seconds: 400, partial: false });
    expect(splits[2]).toMatchObject({ km: 3, meters: 200, partial: true });
    expect(splits[2]!.paceSecPerKm).toBeCloseTo(500, 5); // 100s over 0.2km
  });
});

describe("series", () => {
  it("maps speed to km/h", () => {
    const series = speedSeriesKmh(activity(samples));
    expect(series[0]).toEqual({ t: 0, v: 9 }); // 2.5 m/s → 9 km/h
  });
  it("maps pace to sec/km and drops near-stops", () => {
    const withStop = activity([
      { t: 0, d: 0, v: 0 },
      { t: 10, d: 25, v: 2.5 },
    ]);
    const series = paceSeriesSecPerKm(withStop);
    expect(series).toHaveLength(1);
    expect(series[0]!.v).toBeCloseTo(400, 5); // 1000 / 2.5
  });
});

describe("fastestSplit", () => {
  it("finds the fastest full km", () => {
    const splits = splitsPerKm(activity(samples));
    expect(fastestSplit(splits)).toBe(1); // km1 and km2 tie at 400s → first
  });
  it("is 0 when there are no full kms", () => {
    expect(fastestSplit([])).toBe(0);
  });
});
