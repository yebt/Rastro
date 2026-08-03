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

export interface ShareTheme {
  layoutId: string;
  paletteId: string;
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
