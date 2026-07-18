import { describe, expect, it } from "vitest";
import type { Activity, DominadasSession, GpsActivity, Sample } from "./types";
import {
  computeRecords,
  fastestWindowSec,
  weeklyDistanceKm,
  weeklyPullups,
  weekStart,
} from "./trends";

// A known Monday and later days, built with the local Date constructor so they
// match weekStart's local-time bucketing regardless of the runner's timezone.
const MON = new Date(2024, 4, 13, 8, 0, 0).getTime(); // Mon 13 May 2024
const WED = new Date(2024, 4, 15, 19, 0, 0).getTime(); // same week
const NEXT_MON = new Date(2024, 4, 20, 7, 0, 0).getTime(); // next week

const gps = (date: number, distance: number, samples?: Sample[], duration = 600): GpsActivity => ({
  id: `g${date}`,
  kind: "gps",
  type: "Trote",
  date,
  distance,
  duration,
  route: [],
  samples,
});

const pull = (date: number, sets: number[]): DominadasSession => ({
  id: `p${date}`,
  kind: "dominadas",
  type: "dominadas",
  date,
  sets,
  total: sets.reduce((a, b) => a + b, 0),
});

describe("weekStart", () => {
  it("maps every day of a week to the same Monday 00:00", () => {
    expect(weekStart(WED)).toBe(weekStart(MON));
    expect(new Date(weekStart(MON)).getHours()).toBe(0);
  });
  it("separates weeks by 7 days", () => {
    expect(weekStart(NEXT_MON) - weekStart(MON)).toBe(7 * 24 * 3600 * 1000);
  });
});

describe("fastestWindowSec", () => {
  const samples: Sample[] = [
    { t: 0, d: 0, v: 3 },
    { t: 300, d: 1000, v: 3 },
    { t: 500, d: 2000, v: 5 }, // this km took only 200 s → fastest
    { t: 900, d: 3000, v: 2 },
  ];
  it("finds the fastest continuous kilometer", () => {
    expect(fastestWindowSec(gps(MON, 3000, samples), 1000)).toBe(200);
  });
  it("is null when the outing is shorter than the window", () => {
    expect(fastestWindowSec(gps(MON, 3000, samples), 5000)).toBeNull();
  });
  it("falls back to average pace without samples", () => {
    expect(fastestWindowSec(gps(MON, 2000), 1000)).toBe(300); // 600s over 2km → 300s/km
  });
});

describe("computeRecords", () => {
  it("takes the best across the whole history", () => {
    const acts: Activity[] = [
      gps(MON, 3000, [
        { t: 0, d: 0, v: 3 },
        { t: 300, d: 1000, v: 3 },
        { t: 500, d: 2000, v: 5 },
        { t: 900, d: 3000, v: 2 },
      ]),
      gps(NEXT_MON, 6000, undefined, 2400), // 400 s/km avg → doesn't beat the 200 s window
      pull(WED, [10, 12, 8]),
    ];
    const prs = computeRecords(acts);
    expect(prs.fastest1k).toBe(200);
    expect(prs.longestRun).toBe(6000);
    expect(prs.bestPullSession).toBe(30);
    expect(prs.bestPullSet).toBe(12);
  });
  it("is empty for no activities", () => {
    expect(computeRecords([])).toEqual({});
  });
});

describe("weekly aggregations", () => {
  const acts: Activity[] = [gps(MON, 2000), gps(WED, 3000), gps(NEXT_MON, 1000), pull(WED, [5, 5])];
  it("sums distance per week in km", () => {
    const wk = weeklyDistanceKm(acts);
    expect(wk).toHaveLength(2);
    expect(wk[0]).toMatchObject({ weekStart: weekStart(MON), value: 5 }); // 2 + 3 km
    expect(wk[1]).toMatchObject({ weekStart: weekStart(NEXT_MON), value: 1 });
  });
  it("sums pull-up reps per week", () => {
    expect(weeklyPullups(acts)).toEqual([
      { weekStart: weekStart(WED), label: expect.any(String), value: 10 },
    ]);
  });
});
