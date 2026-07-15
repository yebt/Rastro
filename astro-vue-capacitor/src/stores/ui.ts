/** UI-level state: active tab and toast. */

import { atom } from "nanostores";

export type Tab = "track" | "pull" | "hist" | "data";

export const $activeTab = atom<Tab>("track");

export function setTab(tab: Tab): void {
  $activeTab.set(tab);
}

export const $toast = atom<string>("");

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, ms = 2200): void {
  $toast.set(message);
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.set(""), ms);
}
