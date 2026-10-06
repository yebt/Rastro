import { describe, expect, it } from "vitest";
import { contrastRatio } from "../../shared/color";
import { ACCENTS, deriveAccent, getAccent } from "./accent";

describe("accent contrast", () => {
  // Button label sits on the accent fill — must clear WCAG AA for large text.
  it("every accent keeps ink readable on its fill in light and dark", () => {
    for (const a of ACCENTS) {
      const light = contrastRatio(a.light.accent, a.light.ink);
      const dark = contrastRatio(a.dark.accent, a.dark.ink);
      expect(light, `${a.id} light`).toBeGreaterThanOrEqual(3);
      expect(dark, `${a.id} dark`).toBeGreaterThanOrEqual(3);
    }
  });

  it("any custom color is tuned to keep the label readable in light and dark", () => {
    // Includes the hard cases: near-white, near-black, pure yellow, gray.
    for (const hex of ["#ffffff", "#000000", "#ffff00", "#808080", "#12a150", "#ff00ff", "#00ffff", "#ffe066"]) {
      const a = deriveAccent(hex);
      expect(contrastRatio(a.light.accent, a.light.ink), `${hex} light`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(a.dark.accent, a.dark.ink), `${hex} dark`).toBeGreaterThanOrEqual(6);
    }
  });

  it("falls back to the default for an unknown id", () => {
    expect(getAccent("nope")).toBe(ACCENTS[0]);
  });
});
