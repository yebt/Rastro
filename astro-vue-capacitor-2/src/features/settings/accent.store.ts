/**
 * The chosen accent color, persisted and applied to the document.
 *
 * tokens.css sets --accent per light/dark; we override those same custom
 * properties by injecting one <style> that mirrors tokens.css's exact selectors
 * (plain :root, the dark media query, and the forced data-theme rules). Placed
 * after the bundled CSS, source order wins — so accent tracks light/dark AND a
 * forced theme without JS re-running on every OS change.
 */

import { atom } from "nanostores";
import { normalizeHex } from "../../shared/color";
import { type AccentChoice, type AccentDef, DEFAULT_ACCENT, deriveAccent, getAccent } from "./accent";

const KEY = "rastro.accent";
const CUSTOM_KEY = "rastro.accentCustom";
const STYLE_ID = "rastro-accent";
const DEFAULT_CUSTOM = "#12a150";

function read(): AccentChoice {
  try {
    const v = globalThis.localStorage?.getItem(KEY);
    if (v === "custom") return "custom";
    return v && getAccent(v).id === v ? (v as AccentChoice) : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

function readCustom(): string {
  try {
    return normalizeHex(globalThis.localStorage?.getItem(CUSTOM_KEY) ?? "") ?? DEFAULT_CUSTOM;
  } catch {
    return DEFAULT_CUSTOM;
  }
}

export const $accent = atom<AccentChoice>(read());
/** The free color behind the "custom" accent (the raw pick, before contrast tuning). */
export const $accentCustom = atom<string>(readCustom());

/** The accent definition currently in effect (preset, or derived from the custom pick). */
export function resolveAccent(id: AccentChoice = $accent.get()): AccentDef {
  return id === "custom" ? deriveAccent($accentCustom.get()) : getAccent(id);
}

function css(id: AccentChoice): string {
  const a = resolveAccent(id);
  const light = `--accent:${a.light.accent};--accent-ink:${a.light.ink};`;
  const dark = `--accent:${a.dark.accent};--accent-ink:${a.dark.ink};`;
  return [
    `:root{${light}}`,
    `@media (prefers-color-scheme: dark){:root{${dark}}}`,
    `:root[data-theme="light"]{${light}}`,
    `:root[data-theme="dark"]{${dark}}`,
  ].join("");
}

export function applyAccent(id: AccentChoice = $accent.get()): void {
  const doc = globalThis.document;
  if (!doc) return;
  let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = STYLE_ID;
    doc.head.appendChild(style);
  }
  style.textContent = css(id);
}

/** Use a free color as the accent (contrast-tuned per theme by deriveAccent). */
export function setCustomAccent(hex: string): void {
  const n = normalizeHex(hex);
  if (!n) return;
  $accentCustom.set(n);
  try {
    globalThis.localStorage?.setItem(CUSTOM_KEY, n);
  } catch {
    // ignore — private mode / SSR
  }
  setAccent("custom");
}

export function setAccent(id: AccentChoice): void {
  $accent.set(id);
  applyAccent(id);
  try {
    globalThis.localStorage?.setItem(KEY, id);
  } catch {
    // ignore — private mode / SSR
  }
}
