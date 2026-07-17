import { describe, expect, it } from "vitest";
import { cadenceFromSteps, magnitude, StepDetector } from "./steps";

describe("magnitude", () => {
  it("is the vector length", () => {
    expect(magnitude(3, 4, 0)).toBe(5);
    expect(magnitude(0, 0, 9.81)).toBeCloseTo(9.81, 5);
  });
});

// Feed a baseline reading, then alternating peak/valley pairs = one step each.
function walk(det: StepDetector, peaks: number, spacingMs: number, startBaseline = 9.81) {
  det.push(startBaseline, 0); // set baseline, no count
  let t = 0;
  for (let i = 0; i < peaks; i++) {
    t += spacingMs;
    det.push(11.6, t); // peak
    det.push(8.4, t + spacingMs / 2); // valley → disarm
  }
}

describe("StepDetector", () => {
  it("counts one step per well-spaced peak", () => {
    const det = new StepDetector();
    walk(det, 5, 400);
    expect(det.steps).toBe(5);
  });

  it("debounces peaks that are too close together", () => {
    const det = new StepDetector();
    det.push(9.81, 0);
    det.push(11.6, 100); // step 1
    det.push(8.4, 150); // disarm
    det.push(11.6, 200); // only 100ms later → debounced
    expect(det.steps).toBe(1);
  });

  it("ignores small wobble below the threshold", () => {
    const det = new StepDetector();
    det.push(9.81, 0);
    for (let t = 100; t <= 2000; t += 100) det.push(9.9 + (t % 200 === 0 ? 0.3 : 0), t);
    expect(det.steps).toBe(0);
  });

  it("resets cleanly", () => {
    const det = new StepDetector();
    walk(det, 3, 400);
    det.reset();
    expect(det.steps).toBe(0);
  });
});

describe("cadenceFromSteps", () => {
  it("computes steps/min over the window", () => {
    // 10 steps in the last 10s → 60 steps/min
    const now = 100000;
    const times = Array.from({ length: 10 }, (_, i) => now - i * 1000);
    expect(cadenceFromSteps(times, now)).toBe(60);
  });
  it("is 0 with too few recent steps", () => {
    expect(cadenceFromSteps([0], 100000)).toBe(0);
    expect(cadenceFromSteps([], 100000)).toBe(0);
  });
});
