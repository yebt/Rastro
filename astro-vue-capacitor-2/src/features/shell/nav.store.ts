/**
 * App shell navigation — the single source of truth for the active tab.
 *
 * Module-level nanostore so the value survives tab switches and lives outside
 * any single component. This matters for Rastro: the app runs as one Vue island
 * (never a page reload) precisely so an in-progress GPS recording is never lost
 * when moving between tabs.
 */

import { atom } from "nanostores";
import type { IconName } from "../../shared/ui";

export type TabId = "home" | "workout" | "profile" | "more";

export interface TabDef {
  id: TabId;
  label: string;
  icon: IconName;
}

/** Tab order and copy. Labels are Spanish per the product's Spanish-UI rule. */
export const TABS: TabDef[] = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "workout", label: "Actividad", icon: "workout" },
  { id: "profile", label: "Info", icon: "info" },
  { id: "more", label: "Más", icon: "more" },
];

export const $activeTab = atom<TabId>("home");

export function setTab(tab: TabId): void {
  $activeTab.set(tab);
}
