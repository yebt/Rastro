/**
 * User settings persisted to localStorage. Kept tiny and synchronous so the UI
 * can read them without awaiting the activity repository.
 */

import { atom } from "nanostores";

/** Which pedometer drives the primary steps/cadence: accelerometer (F2) or hardware (F6). */
export type StepSource = "accelerometer" | "hardware";

const KEY = "rastro.stepSource";

function load(): StepSource {
  try {
    return globalThis.localStorage?.getItem(KEY) === "hardware" ? "hardware" : "accelerometer";
  } catch {
    return "accelerometer";
  }
}

export const $stepSource = atom<StepSource>(load());

export function setStepSource(source: StepSource): void {
  $stepSource.set(source);
  try {
    globalThis.localStorage?.setItem(KEY, source);
  } catch {
    // ignore — private mode / SSR
  }
}
