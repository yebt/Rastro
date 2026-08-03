import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  getLayout,
  getPalette,
  SHARE_LAYOUTS,
  SHARE_PALETTES,
  themeKey,
  themeLabel,
} from "./themes";

describe("share themes", () => {
  it("resolves a known palette and layout", () => {
    expect(getPalette("oro").label).toBe("Oro");
    expect(getLayout("poster").label).toBe("Póster");
  });

  it("falls back to the first entry for an unknown id (never undefined)", () => {
    expect(getPalette("nope")).toBe(SHARE_PALETTES[0]);
    expect(getLayout("nope")).toBe(SHARE_LAYOUTS[0]);
  });

  it("has a valid default theme pointing at real entries", () => {
    expect(getPalette(DEFAULT_THEME.paletteId).id).toBe(DEFAULT_THEME.paletteId);
    expect(getLayout(DEFAULT_THEME.layoutId).id).toBe(DEFAULT_THEME.layoutId);
  });

  it("builds a stable key and a human label for a theme pair", () => {
    const t = { layoutId: "poster", paletteId: "oro" };
    expect(themeKey(t)).toBe("poster:oro");
    expect(themeLabel(t)).toBe("Póster · Oro");
  });

  it("every palette defines all required colors", () => {
    for (const p of SHARE_PALETTES) {
      for (const key of ["bg", "route", "ink", "muted", "startDot", "endDot"] as const) {
        expect(p[key], `${p.id}.${key}`).toMatch(/^#[0-9a-f]{3,8}$/i);
      }
    }
  });
});
