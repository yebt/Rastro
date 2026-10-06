/**
 * Small, dependency-free color helpers. Shared so features (accent theming,
 * share-card contrast) agree on one implementation of WCAG contrast.
 */

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/(.)/g, "$1$1") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative luminance (0..1) per WCAG. */
export function relLuminance([r, g, b]: RGB): number {
  const f = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio (1..21) between two hex colors. */
export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(hexToRgb(a));
  const lb = relLuminance(hexToRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** "#rgb" / "rgb" / "#rrggbb" → "#rrggbb" (lowercase), or null if not a hex color. */
export function normalizeHex(input: string): string | null {
  const h = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(h)) return `#${h.replace(/(.)/g, "$1$1")}`;
  if (/^[0-9a-f]{6}$/.test(h)) return `#${h}`;
  return null;
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number): string => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Hue 0..360, saturation/value 0..1. */
export interface HSV {
  h: number;
  s: number;
  v: number;
}

export function hexToHsv(hex: string): HSV {
  const [r, g, b] = hexToRgb(hex).map((x) => x / 255) as RGB;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

export function hsvToHex({ h, s, v }: HSV): string {
  const f = (n: number): number => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return rgbToHex([f(5) * 255, f(3) * 255, f(1) * 255]);
}

/** Hue 0..360, saturation/lightness 0..1. */
export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): HSL {
  const { h, s: sv, v } = hexToHsv(hex);
  const l = v * (1 - sv / 2);
  const s = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
  return { h, s, l };
}

export function hslToHex({ h, s, l }: HSL): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

/**
 * Shift `hex`'s lightness (keeping hue and saturation) toward dark or light, in
 * small steps, until it reaches `minRatio` contrast against `against`. Returns
 * the first color that clears it (or the extreme if none does).
 */
export function adjustForContrast(hex: string, against: string, minRatio: number, direction: "darker" | "lighter"): string {
  const hsl = hexToHsl(hex);
  for (let i = 0; i <= 100; i++) {
    const l = direction === "darker" ? hsl.l - i / 100 : hsl.l + i / 100;
    const c = hslToHex({ ...hsl, l: Math.min(1, Math.max(0, l)) });
    if (contrastRatio(c, against) >= minRatio) return c;
    // Hit the end of the range in the direction we're moving: nothing further to try.
    if (direction === "darker" ? l <= 0 : l >= 1) return c;
  }
  return hex;
}
