/**
 * Accent color presets. Each carries a light and a dark variant, and every
 * variant pairs an `accent` fill with an `ink` that sits ON it (button text) —
 * a pairing whose WCAG contrast is guaranteed by accent.contrast.test.ts, so
 * switching accent can never make a button label unreadable.
 */

export type AccentId = "verde" | "naranja" | "violeta" | "azul" | "rosa" | "mono";

export interface AccentVariant {
  accent: string;
  ink: string;
}

export interface AccentDef {
  id: AccentId;
  label: string;
  light: AccentVariant;
  dark: AccentVariant;
}

export const ACCENTS: AccentDef[] = [
  { id: "verde", label: "Verde", light: { accent: "#0e7a45", ink: "#ffffff" }, dark: { accent: "#4ce08c", ink: "#04140a" } },
  { id: "naranja", label: "Naranja", light: { accent: "#c2410c", ink: "#ffffff" }, dark: { accent: "#ff8a4c", ink: "#231000" } },
  { id: "violeta", label: "Violeta", light: { accent: "#6d28d9", ink: "#ffffff" }, dark: { accent: "#b79cff", ink: "#150a2e" } },
  { id: "azul", label: "Azul", light: { accent: "#1d4ed8", ink: "#ffffff" }, dark: { accent: "#7fb0ff", ink: "#04152e" } },
  { id: "rosa", label: "Rosa", light: { accent: "#be185d", ink: "#ffffff" }, dark: { accent: "#f884b6", ink: "#2c0819" } },
  { id: "mono", label: "Mono", light: { accent: "#12161a", ink: "#ffffff" }, dark: { accent: "#eef1ee", ink: "#0a0c0d" } },
];

export const DEFAULT_ACCENT: AccentId = "verde";

export function getAccent(id: string): AccentDef {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]!;
}
