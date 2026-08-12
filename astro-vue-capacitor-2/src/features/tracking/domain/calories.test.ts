import { describe, expect, it } from "vitest";
import { estimateCalories } from "./calories";

describe("estimateCalories", () => {
  it("scales with MET, weight and time", () => {
    // run (MET 9.8), 70 kg, 1 h → ~686 kcal
    expect(estimateCalories("run", 3_600_000, 70)).toBe(686);
    // walk is lower than run for the same time/weight
    expect(estimateCalories("walk", 3_600_000, 70)!).toBeLessThan(
      estimateCalories("run", 3_600_000, 70)!,
    );
  });

  it("returns null without a weight or time", () => {
    expect(estimateCalories("run", 3_600_000, null)).toBeNull();
    expect(estimateCalories("run", 0, 70)).toBeNull();
  });
});
