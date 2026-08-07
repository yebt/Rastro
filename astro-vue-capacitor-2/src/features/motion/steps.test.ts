import { describe, expect, it } from "vitest";
import { cadenceFromSteps, magnitude, StepDetector } from "./steps";

describe("step detection", () => {
  it("magnitude of a 3-axis vector", () => {
    expect(magnitude(3, 4, 0)).toBe(5);
    expect(magnitude(0, 0, 0)).toBe(0);
  });

  it("counts peaks above the baseline, debounced by min interval", () => {
    const d = new StepDetector();
    d.push(10, 0); // first sample sets the baseline
    expect(d.push(12, 100)).toBe(true); // peak → step 1
    d.push(10, 200); // valley → re-arm
    expect(d.push(12, 400)).toBe(true); // peak 300ms later → step 2
    d.push(10, 500); // valley → re-arm
    expect(d.push(12, 650)).toBe(false); // peak only 250ms after step 2 → debounced
    expect(d.steps).toBe(2);
  });

  it("reset clears the count and baseline", () => {
    const d = new StepDetector();
    d.push(10, 0);
    d.push(12, 100);
    expect(d.steps).toBe(1);
    d.reset();
    expect(d.steps).toBe(0);
  });

  it("cadence is 0 with fewer than two recent steps", () => {
    expect(cadenceFromSteps([], 1000)).toBe(0);
    expect(cadenceFromSteps([1000], 1000)).toBe(0);
  });

  it("cadence extrapolates recent steps to steps/min", () => {
    const now = 100_000;
    // 20 steps 500ms apart, all within the 10s window → 120 steps/min.
    const times = Array.from({ length: 20 }, (_, i) => now - i * 500);
    expect(cadenceFromSteps(times, now)).toBe(120);
  });

  it("cadence ignores steps outside the window", () => {
    const now = 100_000;
    const times = [now - 50_000, now - 40_000, now - 1000, now - 500];
    // Only the last two are within 10s → still counts as 2 recent.
    expect(cadenceFromSteps(times, now)).toBe(Math.round((2 / 10_000) * 60_000));
  });
});
