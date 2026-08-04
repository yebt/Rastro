import { describe, expect, it } from "vitest";
import { contrastRatio } from "../../shared/color";
import { ACCENTS, getAccent } from "./accent";

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

  it("falls back to the default for an unknown id", () => {
    expect(getAccent("nope")).toBe(ACCENTS[0]);
  });
});
