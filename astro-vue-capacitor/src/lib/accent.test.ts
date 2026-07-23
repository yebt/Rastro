import { describe, expect, it } from "vitest";
import { ACCENT_ORDER, ACCENTS, type Accent } from "./accent";
import { contrastRatio } from "./contrast";

/** Page background per theme — the surface the accent sits against. */
const BG: Record<"light" | "dark", string> = {
  light: "#F5F6F3",
  dark: "#15181A",
};

/** WCAG AA thresholds. Text on the fill needs 4.5:1; a UI element needs 3:1. */
const TEXT_ON_FILL = 4.5;
const UI_VS_BG = 3;

describe("accent contrast guarantees (WCAG AA)", () => {
  const modes: ("light" | "dark")[] = ["light", "dark"];

  for (const accent of ACCENT_ORDER) {
    for (const mode of modes) {
      const tokens = ACCENTS[accent][mode];

      it(`${accent}/${mode}: contrast text passes AA on the accent fill`, () => {
        expect(contrastRatio(tokens.accent, tokens.contrast)).toBeGreaterThanOrEqual(TEXT_ON_FILL);
      });

      it(`${accent}/${mode}: accent passes AA against the ${mode} background`, () => {
        expect(contrastRatio(tokens.accent, BG[mode])).toBeGreaterThanOrEqual(UI_VS_BG);
      });
    }
  }

  it("defines exactly the five expected accents", () => {
    const keys = Object.keys(ACCENTS).toSorted();
    const expected: Accent[] = ["blue", "green", "mono", "orange", "purple"];
    expect(keys).toEqual(expected);
  });
});
