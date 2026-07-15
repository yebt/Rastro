import { describe, expect, it } from "vitest";
import { SAMPLE_INTERVAL_S, shouldSample } from "./track";

describe("shouldSample", () => {
  it("records the first sample (lastSample far in the past)", () => {
    expect(shouldSample(0, -Infinity)).toBe(true);
  });

  it("throttles within the interval", () => {
    expect(shouldSample(2, 0)).toBe(false);
    expect(shouldSample(SAMPLE_INTERVAL_S, 0)).toBe(true);
  });

  it("records once the interval has elapsed", () => {
    expect(shouldSample(10, 7)).toBe(true);
    expect(shouldSample(9.9, 7)).toBe(false);
  });

  it("honors a custom interval", () => {
    expect(shouldSample(5, 0, 10)).toBe(false);
    expect(shouldSample(10, 0, 10)).toBe(true);
  });
});
