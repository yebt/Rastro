import { beforeEach, describe, expect, it } from "vitest";
import { $exercises, addExercise, removeExercise, renameExercise } from "./exercise-catalog.store";
import { DEFAULT_EXERCISES } from "./domain/exercises";

describe("exercise catalog store", () => {
  beforeEach(() => {
    $exercises.set([...DEFAULT_EXERCISES]);
  });

  it("seeds with the default catalog", () => {
    expect($exercises.get().map((e) => e.id)).toEqual(["dominadas"]);
  });

  it("adds an exercise, deriving its id from the label", () => {
    const created = addExercise("Flexiones de pecho");
    expect(created).toEqual({ id: "flexiones-de-pecho", label: "Flexiones de pecho" });
    expect($exercises.get()).toHaveLength(2);
  });

  it("rejects empty labels and duplicate ids", () => {
    expect(addExercise("   ")).toBeNull();
    addExercise("Sentadillas");
    expect(addExercise("sentadillas")).toBeNull(); // same slug
    expect($exercises.get().filter((e) => e.id === "sentadillas")).toHaveLength(1);
  });

  it("renames without changing the id (keeps history/routines linked)", () => {
    renameExercise("dominadas", "Pull-ups");
    const d = $exercises.get().find((e) => e.id === "dominadas");
    expect(d?.label).toBe("Pull-ups");
  });

  it("removes an exercise by id", () => {
    addExercise("Burpees");
    removeExercise("burpees");
    expect($exercises.get().some((e) => e.id === "burpees")).toBe(false);
  });
});
