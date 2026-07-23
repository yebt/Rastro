/**
 * Accent color system (F18). Single source of truth for the app's brand accent.
 *
 * Each accent ships light and dark variants of four tokens that are applied as
 * CSS custom properties (`--accent`, `--accent-strong`, `--accent-soft`,
 * `--accent-contrast`). The contrast guarantees live in accent.test.ts: swapping
 * the accent must never break WCAG contrast, so any palette tweak that drops a
 * ratio below threshold fails CI.
 */

export type Accent = "green" | "orange" | "purple" | "blue" | "mono";

export interface AccentTokens {
  /** Brand color — buttons, active states, links, focus rings. */
  accent: string;
  /** Pressed/emphasis variant (darker in light, brighter in dark). */
  strong: string;
  /** Low-alpha rgba() tint of the accent for tinted backgrounds. */
  soft: string;
  /** Text/icon color placed ON the accent fill (passes AA). */
  contrast: string;
}

export const DEFAULT_ACCENT: Accent = "green";

export const ACCENT_ORDER: Accent[] = ["green", "orange", "purple", "blue", "mono"];

/**
 * Palette. Values are guarded by accent.test.ts — the tests are authoritative;
 * do not tweak a color without re-running them.
 */
export const ACCENTS: Record<Accent, { light: AccentTokens; dark: AccentTokens }> = {
  green: {
    light: {
      accent: "#0A7F3D",
      strong: "#086B33",
      soft: "rgba(10,127,61,.14)",
      contrast: "#ffffff",
    },
    dark: {
      accent: "#2FBF6E",
      strong: "#37D07C",
      soft: "rgba(47,191,110,.18)",
      contrast: "#05130A",
    },
  },
  orange: {
    light: {
      accent: "#E85410",
      strong: "#CF4A0D",
      soft: "rgba(232,84,16,.14)",
      contrast: "#15181A",
    },
    dark: {
      accent: "#FF7A45",
      strong: "#FF8D5F",
      soft: "rgba(255,122,69,.18)",
      contrast: "#1A0D05",
    },
  },
  purple: {
    light: {
      accent: "#7C3AED",
      strong: "#6D28D9",
      soft: "rgba(124,58,237,.14)",
      contrast: "#ffffff",
    },
    dark: {
      accent: "#A78BFA",
      strong: "#B9A5FB",
      soft: "rgba(167,139,250,.18)",
      contrast: "#1E1033",
    },
  },
  blue: {
    light: {
      accent: "#1B4DFF",
      strong: "#123BD6",
      soft: "rgba(27,77,255,.14)",
      contrast: "#ffffff",
    },
    dark: {
      accent: "#4D7BFF",
      strong: "#6B93FF",
      soft: "rgba(77,123,255,.18)",
      contrast: "#04123A",
    },
  },
  mono: {
    light: {
      accent: "#15181A",
      strong: "#000000",
      soft: "rgba(21,24,26,.10)",
      contrast: "#ffffff",
    },
    dark: {
      accent: "#F5F6F3",
      strong: "#ffffff",
      soft: "rgba(245,246,243,.14)",
      contrast: "#15181A",
    },
  },
};

/** True when `value` is one of the known accents. */
export function isAccent(value: unknown): value is Accent {
  return typeof value === "string" && value in ACCENTS;
}
