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
import { type AccentId, DEFAULT_ACCENT, getAccent } from "./accent";

const KEY = "rastro.accent";
const STYLE_ID = "rastro-accent";

function read(): AccentId {
  try {
    const v = globalThis.localStorage?.getItem(KEY);
    return v && getAccent(v).id === v ? (v as AccentId) : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

export const $accent = atom<AccentId>(read());

function css(id: AccentId): string {
  const a = getAccent(id);
  const light = `--accent:${a.light.accent};--accent-ink:${a.light.ink};`;
  const dark = `--accent:${a.dark.accent};--accent-ink:${a.dark.ink};`;
  return [
    `:root{${light}}`,
    `@media (prefers-color-scheme: dark){:root{${dark}}}`,
    `:root[data-theme="light"]{${light}}`,
    `:root[data-theme="dark"]{${dark}}`,
  ].join("");
}

export function applyAccent(id: AccentId = $accent.get()): void {
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

export function setAccent(id: AccentId): void {
  $accent.set(id);
  applyAccent(id);
  try {
    globalThis.localStorage?.setItem(KEY, id);
  } catch {
    // ignore — private mode / SSR
  }
}
