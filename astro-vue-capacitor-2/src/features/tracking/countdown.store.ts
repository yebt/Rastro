/**
 * Pre-start countdown: seconds to count down after "Iniciar" before recording
 * actually begins (0 = off). Persisted locally; read by WorkoutScreen.
 */

import { atom } from "nanostores";

const KEY = "rastro.countdown";

/** Offered choices, in seconds. */
export const COUNTDOWN_OPTIONS = [0, 3, 5, 10] as const;

function read(): number {
  try {
    const n = Number(globalThis.localStorage?.getItem(KEY));
    return (COUNTDOWN_OPTIONS as readonly number[]).includes(n) ? n : 0;
  } catch {
    return 0;
  }
}

export const $countdown = atom<number>(read());

export function setCountdown(seconds: number): void {
  $countdown.set(seconds);
  try {
    globalThis.localStorage?.setItem(KEY, String(seconds));
  } catch {
    // ignore — private mode / SSR
  }
}
