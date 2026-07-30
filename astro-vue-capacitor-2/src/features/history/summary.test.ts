import { describe, expect, it } from "vitest";
import type { MoveActivity, TrackPoint } from "../tracking";
import { currentStreak, weekSummary } from "./summary";

const DAY = 86_400_000;
// Noon, mid-June — away from any DST transition, so day math is stable.
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();

function pt(lat: number, lng: number): TrackPoint {
  return { lat, lng, t: 0, alt: null, acc: null, altAcc: null, spd: null };
}

function move(startedAt: number, movingMs: number, points: TrackPoint[] = []): MoveActivity {
  return {
    id: String(startedAt),
    schemaVersion: 1,
    kind: "move",
    type: "run",
    startedAt,
    endedAt: startedAt + movingMs,
    points,
    movingMs,
  };
}

describe("home summary", () => {
  it("weekSummary totals movement in the last 7 days only", () => {
    const acts = [
      move(NOW, 600_000, [pt(0, 0), pt(0, 0.001)]),
      move(NOW - 3 * DAY, 300_000),
      move(NOW - 10 * DAY, 999_000), // outside the window
    ];
    const s = weekSummary(acts, NOW);
    expect(s.count).toBe(2);
    expect(s.movingMs).toBe(900_000);
    expect(s.distanceM).toBeGreaterThan(100); // one leg ~111m
  });

  it("streak counts consecutive active days ending today", () => {
    const acts = [move(NOW, 1000), move(NOW - DAY, 1000), move(NOW - 2 * DAY, 1000)];
    expect(currentStreak(acts, NOW)).toBe(3);
  });

  it("streak breaks on a missing day", () => {
    const acts = [move(NOW, 1000), move(NOW - 2 * DAY, 1000)];
    expect(currentStreak(acts, NOW)).toBe(1);
  });

  it("streak still stands if today is empty but yesterday isn't", () => {
    const acts = [move(NOW - DAY, 1000), move(NOW - 2 * DAY, 1000)];
    expect(currentStreak(acts, NOW)).toBe(2);
  });

  it("streak is 0 with nothing recent", () => {
    expect(currentStreak([move(NOW - 5 * DAY, 1000)], NOW)).toBe(0);
    expect(currentStreak([], NOW)).toBe(0);
  });
});
