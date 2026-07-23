import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "./contrast";

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("accepts shorthand #rgb notation", () => {
    expect(relativeLuminance("#000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
  });

  it("throws on malformed input", () => {
    expect(() => relativeLuminance("#zzzzzz")).toThrow();
    expect(() => relativeLuminance("#1234")).toThrow();
  });
});

describe("contrastRatio", () => {
  it("is ~21 for black vs white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("is symmetric regardless of argument order", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
  });

  it("is 1 for identical colors", () => {
    expect(contrastRatio("#12a150", "#12a150")).toBe(1);
    expect(contrastRatio("#fff", "#ffffff")).toBe(1);
  });
});
