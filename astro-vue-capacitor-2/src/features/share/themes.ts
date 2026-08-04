/**
 * Share themes — the set of looks a route card can take. A theme is a
 * `layout × palette` pair, so a handful of each multiplies into many distinct
 * cards. All values are plain data (offline-safe, unit-testable); the renderer
 * in route-card.ts consumes them and never hard-codes a color or size.
 */

/** Colors for a card. Pure canvas, so every surface resolves to a hex here. */
export interface SharePalette {
  id: string;
  label: string;
  bg: string;
  /** Route stroke. */
  route: string;
  /** Primary text (headline numbers, title). */
  ink: string;
  /** Secondary text (labels, date, coordinates). */
  muted: string;
  /** Start marker fill. */
  startDot: string;
  /** End marker fill. */
  endDot: string;
}

/** A card shape. Aspect ratio is what changes the feel most, so it lives here. */
export interface ShareLayout {
  id: string;
  label: string;
  w: number;
  h: number;
}

/** Where a card's background comes from. Photo stays offline (local dataURL). */
export type ShareBackground =
  | { kind: "solid" }
  | { kind: "gradient"; from: string; to: string; angle: number }
  | {
      kind: "photo";
      /** A local data/blob URL — never a remote fetch, so offline holds. */
      src: string;
      /** "auto" derives ink/muted from the image luminance; "manual" keeps the palette. */
      adjust: "auto" | "manual";
    };

/** Stackable canvas passes, drawn in array order. */
export type ShareEffect =
  | { kind: "scrim"; direction: "top" | "bottom" | "full"; color: string; from: number; to: number }
  | { kind: "grain"; opacity: number }
  | { kind: "routeGlow"; blur: number }
  /** Gaussian blur applied to the background image (photo). */
  | { kind: "blur"; radius: number }
  /** Exposure: amount < 0 darkens, > 0 brightens (0..1). */
  | { kind: "exposure"; amount: number }
  /** Darkened edges. strength 0..1. */
  | { kind: "vignette"; strength: number }
  /** Map the photo's luminance onto a two-color ramp. */
  | { kind: "duotone"; shadow: string; highlight: string }
  /** Halftone dot pattern over the background (the v1 "dots" look). */
  | { kind: "halftone"; color: string; alpha: number; gap: number; radius: number }
  /** Shadow behind all text, for legibility over busy photos. */
  | { kind: "textShadow"; blur: number; color: string };

export interface ShareGradient {
  id: string;
  label: string;
  from: string;
  to: string;
  angle: number;
}

/** Preset gradients offered in the UI (the v1 violeta/atardecer looks, offline). */
export const SHARE_GRADIENTS: ShareGradient[] = [
  { id: "violeta", label: "Violeta", from: "#3a1c8c", to: "#7b3ff2", angle: 120 },
  { id: "atardecer", label: "Atardecer", from: "#241021", to: "#ff5a1f", angle: 120 },
  { id: "oceano", label: "Océano", from: "#04263b", to: "#0e7a45", angle: 120 },
  { id: "carbon", label: "Carbón", from: "#0a0c0d", to: "#2a3236", angle: 120 },
];

/** Font treatment. Just the three faces the app self-hosts, recombined. */
export interface ShareTypography {
  id: string;
  label: string;
  /** Big number face. */
  headline: string;
  /** Title / activity type face. */
  title: string;
  /** Labels, date, coordinates, wordmark. */
  meta: string;
}

export interface ShareTheme {
  layoutId: string;
  paletteId: string;
  /** Defaults applied by the renderer keep v1 themes valid without these. */
  typographyId?: string;
  background?: ShareBackground;
  effects?: ShareEffect[];
}

const COND = "'Barlow Condensed', sans-serif";
const MONO = "'Roboto Mono', monospace";
const SANS = "'Roboto', system-ui, sans-serif";

export const SHARE_TYPOGRAPHIES: ShareTypography[] = [
  { id: "mono", label: "Mono", headline: MONO, title: COND, meta: MONO },
  { id: "grotesk", label: "Grotesk", headline: COND, title: SANS, meta: MONO },
  { id: "tecnica", label: "Técnica", headline: MONO, title: MONO, meta: MONO },
];

export function getTypography(id: string | undefined): ShareTypography {
  return SHARE_TYPOGRAPHIES.find((t) => t.id === id) ?? SHARE_TYPOGRAPHIES[0]!;
}

export const SHARE_PALETTES: SharePalette[] = [
  {
    id: "noche",
    label: "Noche",
    bg: "#0a0c0d",
    route: "#4ce08c",
    ink: "#eef1ee",
    muted: "#838c86",
    startDot: "#4ce08c",
    endDot: "#eef1ee",
  },
  {
    id: "papel",
    label: "Papel",
    bg: "#e7e8e4",
    route: "#12161a",
    ink: "#12161a",
    muted: "#5b635f",
    startDot: "#0e7a45",
    endDot: "#12161a",
  },
  {
    id: "oro",
    label: "Oro",
    bg: "#0b0b0d",
    route: "#d9a441",
    ink: "#f2e6c8",
    muted: "#9a8b63",
    startDot: "#d9a441",
    endDot: "#f2e6c8",
  },
  {
    id: "neon",
    label: "Neón",
    bg: "#0a0a0f",
    route: "#ff5a1f",
    ink: "#f6f2ef",
    muted: "#8a817b",
    startDot: "#ff5a1f",
    endDot: "#ffd0a3",
  },
  {
    id: "mono",
    label: "Mono",
    bg: "#111111",
    route: "#e8e8e8",
    ink: "#f4f4f4",
    muted: "#8a8a8a",
    startDot: "#ffffff",
    endDot: "#8a8a8a",
  },
];

export const SHARE_LAYOUTS: ShareLayout[] = [
  { id: "clasico", label: "Clásico", w: 1080, h: 1080 },
  { id: "poster", label: "Póster", w: 1080, h: 1350 },
  { id: "minimal", label: "Minimal", w: 1080, h: 1080 },
  { id: "story", label: "Historia", w: 1080, h: 1920 },
  { id: "overlay", label: "Overlay", w: 1080, h: 1350 },
  { id: "editorial", label: "Editorial", w: 1080, h: 1350 },
  { id: "dataGrid", label: "Datos", w: 1080, h: 1350 },
];

export const DEFAULT_THEME: ShareTheme = { layoutId: "clasico", paletteId: "noche" };

/** Look up a palette by id, falling back to the first (never undefined). */
export function getPalette(id: string): SharePalette {
  return SHARE_PALETTES.find((p) => p.id === id) ?? SHARE_PALETTES[0]!;
}

/** Look up a layout by id, falling back to the first (never undefined). */
export function getLayout(id: string): ShareLayout {
  return SHARE_LAYOUTS.find((l) => l.id === id) ?? SHARE_LAYOUTS[0]!;
}

/** Stable id for a theme pair — used as the gallery record's theme key. */
export function themeKey(theme: ShareTheme): string {
  return `${theme.layoutId}:${theme.paletteId}`;
}

/** Human label for a theme pair, e.g. "Póster · Oro". */
export function themeLabel(theme: ShareTheme): string {
  return `${getLayout(theme.layoutId).label} · ${getPalette(theme.paletteId).label}`;
}
