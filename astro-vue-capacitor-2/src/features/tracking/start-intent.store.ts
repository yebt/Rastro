/**
 * A one-shot "start this activity" intent, so Home's quick-start can hand a move
 * type to the Actividad tab. WorkoutScreen consumes and clears it, then shows
 * the Ready screen for that type (the user still taps Iniciar).
 */

import { atom } from "nanostores";
import type { MoveType } from "./domain/activity";

export const $startIntent = atom<MoveType | null>(null);

export function setStartIntent(type: MoveType): void {
  $startIntent.set(type);
}

export function clearStartIntent(): void {
  $startIntent.set(null);
}
