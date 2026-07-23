import { describe, expect, it } from "vitest";
import { exerciseStats, sessionTotal } from "./exercises";
import type { ExerciseKind, ExerciseSession } from "./types";

const session = (
  id: string,
  date: number,
  sets: number[],
  exercise: ExerciseKind = "dominadas",
): ExerciseSession => ({
  id,
  kind: "exercise",
  exercise,
  date,
  sets,
  total: sets.reduce((a, b) => a + b, 0),
});

describe("sessionTotal", () => {
  it("sums the sets", () => {
    expect(sessionTotal([8, 7, 6, 5])).toBe(26);
    expect(sessionTotal([])).toBe(0);
  });
});

describe("exerciseStats", () => {
  const now = new Date(2026, 6, 15, 10, 0, 0).getTime(); // 2026-07-15
  const yesterday = new Date(2026, 6, 14, 9, 0, 0).getTime();

  it("aggregates all-time, today, best session and best set", () => {
    const sessions = [
      session("p1", now, [10, 8]), // today, total 18
      session("p2", now, [12]), // today, total 12, best set 12
      session("p3", yesterday, [9, 9, 9]), // total 27 (best session)
    ];
    const stats = exerciseStats(sessions, undefined, now);
    expect(stats.all).toBe(57);
    expect(stats.today).toBe(30);
    expect(stats.best).toBe(27);
    expect(stats.bestSet).toBe(12);
  });

  it("filters to a single exercise when one is given", () => {
    const sessions = [
      session("d1", now, [10, 8], "dominadas"), // 18
      session("b1", now, [20], "burpees"), // 20 (ignored)
      session("d2", yesterday, [9, 9, 9], "dominadas"), // 27
    ];
    const stats = exerciseStats(sessions, "dominadas", now);
    expect(stats.all).toBe(45);
    expect(stats.today).toBe(18);
    expect(stats.best).toBe(27);
    expect(stats.bestSet).toBe(10);
  });

  it("returns zeros for no sessions", () => {
    expect(exerciseStats([], undefined, now)).toEqual({ all: 0, today: 0, best: 0, bestSet: 0 });
  });
});
