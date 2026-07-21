/** UI-level state: active tab and toast. */

import { atom } from "nanostores";

export type Tab = "track" | "pull" | "hist" | "progress" | "data";

export const $activeTab = atom<Tab>("track");

export function setTab(tab: Tab): void {
  $activeTab.set(tab);
}

/** Id of the activity shown in the detail overlay, or null when closed. */
export const $detailId = atom<string | null>(null);

export function openDetail(id: string): void {
  $detailId.set(id);
}

export function closeDetail(): void {
  $detailId.set(null);
}

/** Whether the global settings overlay is open. */
export const $settingsOpen = atom<boolean>(false);

export function openSettings(): void {
  $settingsOpen.set(true);
}

export function closeSettings(): void {
  $settingsOpen.set(false);
}

export const $toast = atom<string>("");

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, ms = 2200): void {
  $toast.set(message);
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.set(""), ms);
}
