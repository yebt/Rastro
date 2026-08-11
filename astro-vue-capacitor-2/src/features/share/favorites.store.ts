/**
 * Saved share themes (favorites), persisted locally. A favorite keeps the
 * reusable style — layout, palette, typography, effects, a solid/gradient
 * background and any color override — but drops per-activity backgrounds
 * (photo/map snapshots are specific to one route and would bloat storage).
 */

import { atom } from "nanostores";
import type { ShareTheme } from "./themes";

const KEY = "rastro.shareFavorites";
const MAX = 12;

function read(): ShareTheme[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ShareTheme[]) : [];
  } catch {
    return [];
  }
}

function persist(list: ShareTheme[]): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore — private mode / SSR
  }
}

export const $favorites = atom<ShareTheme[]>(read());

function set(list: ShareTheme[]): void {
  $favorites.set(list);
  persist(list);
}

/** Save the reusable part of a theme as a favorite. */
export function addFavorite(theme: ShareTheme): void {
  const bg = theme.background;
  const favorite: ShareTheme = {
    layoutId: theme.layoutId,
    paletteId: theme.paletteId,
    typographyId: theme.typographyId,
    effects: theme.effects ? [...theme.effects] : [],
    background: bg && (bg.kind === "solid" || bg.kind === "gradient") ? bg : { kind: "solid" },
    override: theme.override ? { ...theme.override } : undefined,
  };
  set([...$favorites.get(), favorite].slice(-MAX));
}

export function removeFavorite(index: number): void {
  set($favorites.get().filter((_, i) => i !== index));
}
