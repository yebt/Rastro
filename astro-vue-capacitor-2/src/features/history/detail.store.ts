/**
 * The currently open activity detail, as a global overlay id. Any surface
 * (history, calendar, or the just-finished recording) opens a detail the same
 * way, so there's one detail view and one back behaviour.
 */

import { atom } from "nanostores";

export const $openActivityId = atom<string | null>(null);

export function openActivity(id: string): void {
  $openActivityId.set(id);
}

export function closeActivity(): void {
  $openActivityId.set(null);
}
