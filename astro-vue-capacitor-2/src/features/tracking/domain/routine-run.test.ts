import { describe, expect, it } from "vitest";
import type { Routine } from "./routine";
import {
  buildRun,
  entriesFrom,
  exercisesDone,
  exerciseStepCount,
  routineActivity,
  routineEntriesReps,
} from "./routine-run";

function routine(over: Partial<Routine>): Routine {
  return {
    id: "r1",
    name: "Test",
    rounds: 2,
    restBetweenExercisesSec: 30,
    restBetweenRoundsSec: 60,
    exercises: [
      { exerciseId: "dominadas", reps: 10 },
      { exerciseId: "flexiones", reps: 15 },
    ],
    ...over,
  };
}

describe("buildRun", () => {
  it("interleaves exercises with rests and never ends on a rest", () => {
    const steps = buildRun(routine({}));
    // ex, rest(ex), ex, rest(round), ex, rest(ex), ex
    expect(steps.map((s) => s.kind)).toEqual([
      "exercise",
      "rest",
      "exercise",
      "rest",
      "exercise",
      "rest",
      "exercise",
    ]);
    expect(steps.at(-1)!.kind).toBe("exercise");
    const roundRest = steps[3];
    expect(roundRest).toMatchObject({ kind: "rest", scope: "round", seconds: 60, nextRound: 2 });
    expect(exerciseStepCount(steps)).toBe(4);
  });

  it("omits zero-second rests", () => {
    const steps = buildRun(routine({ restBetweenExercisesSec: 0, restBetweenRoundsSec: 0 }));
    expect(steps.every((s) => s.kind === "exercise")).toBe(true);
    expect(steps).toHaveLength(4);
  });

  it("handles a single-exercise circuit (only round rests)", () => {
    const steps = buildRun(
      routine({ rounds: 3, exercises: [{ exerciseId: "dominadas", reps: 8 }] }),
    );
    expect(steps.map((s) => s.kind)).toEqual([
      "exercise",
      "rest",
      "exercise",
      "rest",
      "exercise",
    ]);
  });

  it("returns nothing for an empty or zero-round routine", () => {
    expect(buildRun(routine({ exercises: [] }))).toEqual([]);
    expect(buildRun(routine({ rounds: 0 }))).toEqual([]);
  });

  it("counts exercises done up to an index", () => {
    const steps = buildRun(routine({}));
    expect(exercisesDone(steps, 0)).toBe(0);
    expect(exercisesDone(steps, 1)).toBe(1); // after first exercise
    expect(exercisesDone(steps, 3)).toBe(2); // after 2nd exercise (index 2) + its rest
    expect(exercisesDone(steps, steps.length)).toBe(4);
  });
});

describe("routine session persistence", () => {
  it("derives entries from completed exercise steps (one per round)", () => {
    const entries = entriesFrom(buildRun(routine({})));
    expect(entries).toEqual([
      { exerciseId: "dominadas", reps: 10 },
      { exerciseId: "flexiones", reps: 15 },
      { exerciseId: "dominadas", reps: 10 },
      { exerciseId: "flexiones", reps: 15 },
    ]);
    expect(routineEntriesReps(entries)).toBe(50);
  });

  it("builds a routine activity linked to its template", () => {
    const r = routine({});
    const entries = entriesFrom(buildRun(r));
    const a = routineActivity(r, entries, 1000, 2000);
    expect(a).toMatchObject({
      kind: "routine",
      routineId: "r1",
      name: "Test",
      rounds: 2,
      startedAt: 1000,
      endedAt: 2000,
    });
    expect(a.id).toBeTruthy();
    expect(routineEntriesReps(a.entries)).toBe(50);
  });
});
