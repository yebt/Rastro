/**
 * Applies the color theme (F17). Resolves "auto" against the system preference,
 * stamps `data-theme` on <html> (CSS in app.css swaps the tokens), and keeps the
 * browser/status-bar theme-color meta in sync. Reactive to the $theme store and
 * to OS theme changes while on "auto".
 *
 * A tiny inline script in index.astro applies the stored theme before paint to
 * avoid a flash; this module takes over for live updates once the app mounts.
 */

import { $theme, type Theme } from "./stores/settings";

const PAPER_LIGHT = "#f5f6f3";
const PAPER_DARK = "#14171a";

function systemPrefersDark(): boolean {
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function effectiveTheme(theme: Theme): "light" | "dark" {
  return theme === "auto" ? (systemPrefersDark() ? "dark" : "light") : theme;
}

function apply(): void {
  const eff = effectiveTheme($theme.get());
  document.documentElement.dataset.theme = eff;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", eff === "dark" ? PAPER_DARK : PAPER_LIGHT);
}

export function initTheme(): void {
  apply();
  $theme.subscribe(() => apply());
  globalThis
    .matchMedia?.("(prefers-color-scheme: dark)")
    .addEventListener?.("change", () => {
      if ($theme.get() === "auto") apply();
    });
}
