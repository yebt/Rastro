import { describe, expect, it } from "vitest";
import type { ExerciseActivity } from "./activity";
import { exerciseStats, slugifyExercise } from "./exercises";

describe("slugifyExercise", () => {
  it("lowercases, strips accents and joins words with hyphens", () => {
    expect(slugifyExercise("Flexiones de pecho")).toBe("flexiones-de-pecho");
    expect(slugifyExercise("Dominadas")).toBe("dominadas");
    expect(slugifyExercise("  Sentadillas búlgaras  ")).toBe("sentadillas-bulgaras");
  });

  it("returns an empty string when there is nothing slug-worthy", () => {
    expect(slugifyExercise("   ")).toBe("");
    expect(slugifyExercise("!!!")).toBe("");
  });
});

const NOW = new Date(2026, 7, 1, 12, 0, 0).getTime();
const DAY = 86_400_000;

function ex(id: string, startedAt: number, sets: number[]): ExerciseActivity {
  return {
    id: `${id}-${startedAt}`,
    schemaVersion: 1,
    kind: "exercise",
    exercise: id,
    startedAt,
    endedAt: startedAt,
    sets: sets.map((reps) => ({ reps })),
  };
}

describe("exerciseStats", () => {
  const acts = [
    ex("dominadas", NOW, [10, 8]), // today, session 18, best set 10
    ex("dominadas", NOW - DAY, [12, 12, 12]), // yesterday, session 36, best set 12
    ex("flexiones", NOW, [20]), // other exercise, ignored
  ];

  it("aggregates all-time, today, best session and best set for one exercise", () => {
    const s = exerciseStats(acts, "dominadas", NOW);
    expect(s.allTime).toBe(18 + 36);
    expect(s.today).toBe(18);
    expect(s.bestSession).toBe(36);
    expect(s.bestSet).toBe(12);
  });

  it("is all zeros for an exercise with no history", () => {
    expect(exerciseStats(acts, "sentadillas", NOW)).toEqual({
      allTime: 0,
      today: 0,
      bestSession: 0,
      bestSet: 0,
    });
  });
});
