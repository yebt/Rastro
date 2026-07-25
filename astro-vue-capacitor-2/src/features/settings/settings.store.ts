/**
 * App settings — persisted to localStorage and applied to the document.
 *
 * Theme is the first setting. 'auto' follows the OS via the CSS
 * `prefers-color-scheme` rules in tokens.css (no attribute set); 'light'/'dark'
 * stamp `data-theme` on <html> to force it. Accent color and other options join
 * here as their features land.
 */

import { atom } from "nanostores";

export type Theme = "auto" | "light" | "dark";

const THEME_KEY = "rastro.theme";

function readTheme(): Theme {
  try {
    const t = globalThis.localStorage?.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    return "auto";
  }
}

export const $theme = atom<Theme>(readTheme());

/** Reflect the chosen theme onto <html> so the token overrides take effect. */
export function applyTheme(theme: Theme = $theme.get()): void {
  const root = globalThis.document?.documentElement;
  if (!root) return;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function setTheme(theme: Theme): void {
  $theme.set(theme);
  applyTheme(theme);
  try {
    globalThis.localStorage?.setItem(THEME_KEY, theme);
  } catch {
    // ignore — private mode / SSR
  }
}
