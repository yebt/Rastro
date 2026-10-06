import { describe, expect, it } from "vitest";
import { adjustForContrast, contrastRatio, hexToHsl, hexToHsv, hslToHex, hsvToHex, normalizeHex } from "./color";

describe("color helpers", () => {
  it("normalizes hex input", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("12a150")).toBe("#12a150");
    expect(normalizeHex("#12a15")).toBeNull();
    expect(normalizeHex("verde")).toBeNull();
  });

  it("round-trips HSV and HSL", () => {
    for (const hex of ["#12a150", "#ff8a4c", "#1d4ed8", "#000000", "#ffffff", "#808080"]) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
      expect(hslToHex(hexToHsl(hex))).toBe(hex);
    }
  });

  it("adjustForContrast reaches the ratio keeping the hue", () => {
    const out = adjustForContrast("#ffe066", "#ffffff", 4.5, "darker"); // pale yellow vs white
    expect(contrastRatio(out, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(Math.abs(hexToHsl(out).h - hexToHsl("#ffe066").h)).toBeLessThan(6);
  });
});
