import { describe, expect, it } from "vitest";
import { newRoutine, type Routine, routineTotalReps } from "./routine";

describe("routine", () => {
  it("a new routine starts empty with sane defaults", () => {
    const r = newRoutine();
    expect(r.exercises).toEqual([]);
    expect(r.rounds).toBeGreaterThan(0);
    expect(r.id).toBeTruthy();
  });

  it("total reps is rounds × per-round reps", () => {
    const r: Routine = {
      ...newRoutine(),
      rounds: 3,
      exercises: [
        { exerciseId: "dominadas", reps: 10 },
        { exerciseId: "sentadillas", reps: 20 },
      ],
    };
    expect(routineTotalReps(r)).toBe(3 * 30);
  });
});
