import { describe, expect, it } from "vitest";
import type { ExerciseActivity, MoveActivity, TrackPoint } from "../tracking";
import { activityBadges, recordActivityIds } from "./badges";

const KM_DEG = 0.008993;

function move(id: string, secsPerKm: number, km: number, steps = 0): MoveActivity {
  const points: TrackPoint[] = [];
  const total = secsPerKm * km;
  for (let s = 0; s <= total; s += 5) points.push({ t: s * 1000, lat: 0, lng: (s / total) * KM_DEG * km, alt: null, acc: null, altAcc: null, spd: null });
  return { id, schemaVersion: 1, kind: "move", type: "run", startedAt: 0, endedAt: 1, points, movingMs: total * 1000, steps };
}

function ex(id: string, sets: number[]): ExerciseActivity {
  return { id, schemaVersion: 1, kind: "exercise", exercise: "dominadas", startedAt: 0, endedAt: 1, sets: sets.map((reps) => ({ reps })) };
}

describe("activityBadges", () => {
  it("awards distance record to the longest run", () => {
    const short = move("s", 600, 2);
    const long = move("l", 600, 5);
    const all = [short, long];
    expect(activityBadges(long, all)).toContain("Distancia récord");
    expect(activityBadges(short, all)).not.toContain("Distancia récord");
  });

  it("awards ritmo récord to the fastest pace", () => {
    const slow = move("slow", 600, 3);
    const fast = move("fast", 480, 3);
    expect(activityBadges(fast, [slow, fast])).toContain("Ritmo récord");
  });

  it("awards best session and set to the top exercise", () => {
    const a = ex("a", [10, 8]); // 18, best set 10
    const b = ex("b", [12, 12]); // 24, best set 12
    const badges = activityBadges(b, [a, b]);
    expect(badges).toContain("Mejor sesión");
    expect(badges).toContain("Mejor serie");
    expect(activityBadges(a, [a, b])).not.toContain("Mejor sesión");
  });
});

describe("recordActivityIds", () => {
  it("flags every record holder in one pass", () => {
    const short = move("s", 600, 2);
    const long = move("l", 600, 5); // distance record
    const fast = move("f", 400, 2); // pace record
    const ids = recordActivityIds([short, long, fast]);
    expect(ids.has("l")).toBe(true);
    expect(ids.has("f")).toBe(true);
    expect(ids.has("s")).toBe(false);
  });
});
