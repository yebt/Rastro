import { describe, expect, it } from "vitest";
import { activeDaysInMonth, currentStreak, lastNDays } from "./streak";
import type { Activity, ExerciseSession, GpsActivity } from "./types";

// Build timestamps with the LOCAL Date constructor so the day-bucketing matches
// regardless of the runner's timezone (mirrors trends.test.ts).
const at = (y: number, m: number, d: number, h = 9): number => new Date(y, m, d, h, 0, 0).getTime();

const gps = (date: number, distance = 2000): GpsActivity => ({
  id: `g${date}-${distance}`,
  kind: "gps",
  type: "Trote",
  date,
  distance,
  duration: 600,
  route: [],
});

const ex = (date: number): ExerciseSession => ({
  id: `e${date}`,
  kind: "exercise",
  exercise: "dominadas",
  date,
  sets: [10],
  total: 10,
});

describe("currentStreak", () => {
  it("is 0 with no activities", () => {
    expect(currentStreak([], at(2024, 4, 15))).toBe(0);
  });

  it("counts a single active day today", () => {
    const now = at(2024, 4, 15, 20);
    expect(currentStreak([gps(at(2024, 4, 15, 8))], now)).toBe(1);
  });

  it("counts consecutive days up to today", () => {
    const now = at(2024, 4, 15, 20);
    const acts: Activity[] = [gps(at(2024, 4, 13)), ex(at(2024, 4, 14)), gps(at(2024, 4, 15))];
    expect(currentStreak(acts, now)).toBe(3);
  });

  it("stops at a broken streak (gap day)", () => {
    const now = at(2024, 4, 15, 20);
    // 15 and 14 active, 13 missing, 12 active → streak is 2.
    const acts: Activity[] = [gps(at(2024, 4, 15)), gps(at(2024, 4, 14)), gps(at(2024, 4, 12))];
    expect(currentStreak(acts, now)).toBe(2);
  });

  it("keeps the streak alive when today is not yet active", () => {
    const now = at(2024, 4, 15, 20); // nothing logged the 15th yet
    const acts: Activity[] = [gps(at(2024, 4, 14)), gps(at(2024, 4, 13))];
    expect(currentStreak(acts, now)).toBe(2);
  });

  it("is 0 when the most recent activity is older than yesterday", () => {
    const now = at(2024, 4, 15, 20);
    expect(currentStreak([gps(at(2024, 4, 12))], now)).toBe(0);
  });

  it("counts a day only once with multiple activities", () => {
    const now = at(2024, 4, 15, 20);
    const acts: Activity[] = [
      gps(at(2024, 4, 15, 8)),
      ex(at(2024, 4, 15, 18)),
      gps(at(2024, 4, 14)),
    ];
    expect(currentStreak(acts, now)).toBe(2);
  });
});

describe("activeDaysInMonth", () => {
  it("is empty with no activities", () => {
    expect(activeDaysInMonth([], 2024, 4).size).toBe(0);
  });

  it("marks day numbers active in the given month with a dominant type", () => {
    const acts: Activity[] = [gps(at(2024, 4, 3)), ex(at(2024, 4, 10)), gps(at(2024, 5, 1))];
    const map = activeDaysInMonth(acts, 2024, 4); // month 4 = May (0-based)
    expect(map.get(3)).toBe("gps");
    expect(map.get(10)).toBe("exercise");
    expect(map.has(1)).toBe(false); // June activity excluded
    expect(map.size).toBe(2);
  });

  it("picks the dominant type when a day mixes kinds", () => {
    const acts: Activity[] = [ex(at(2024, 4, 7)), ex(at(2024, 4, 7, 12)), gps(at(2024, 4, 7, 18))];
    expect(activeDaysInMonth(acts, 2024, 4).get(7)).toBe("exercise");
  });
});

describe("lastNDays", () => {
  it("returns n days oldest → newest ending today", () => {
    const now = at(2024, 4, 15, 20);
    const days = lastNDays([], 7, now);
    expect(days).toHaveLength(7);
    expect(new Date(days[0]!.date).getDate()).toBe(9);
    expect(new Date(days[6]!.date).getDate()).toBe(15);
    expect(days.every((d) => !d.active)).toBe(true);
  });

  it("marks active days with their dominant type", () => {
    const now = at(2024, 4, 15, 20);
    const acts: Activity[] = [gps(at(2024, 4, 15)), ex(at(2024, 4, 13))];
    const days = lastNDays(acts, 7, now);
    expect(days[6]).toMatchObject({ active: true, type: "gps" });
    expect(days[4]).toMatchObject({ active: true, type: "exercise" });
    expect(days[5]!.active).toBe(false);
  });
});
