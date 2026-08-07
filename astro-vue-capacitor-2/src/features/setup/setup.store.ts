/**
 * First-run gate + wizard position.
 *
 * The setup is a short stepped flow (permissions → identity → measures) so the
 * first run never dumps everything on one crowded screen. `$setupStep` holds the
 * current step; the hardware back button walks it backwards through prevStep().
 * Once finished, `$setupDone` keeps it from ever showing again.
 */

import { atom } from "nanostores";

const KEY = "rastro.setupDone";

/** Ordered wizard steps. */
export const SETUP_STEPS = ["permissions", "identity", "measures"] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

function read(): boolean {
  try {
    return globalThis.localStorage?.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export const $setupDone = atom<boolean>(read());
export const $setupStep = atom<number>(0);

export const isFirstStep = (): boolean => $setupStep.get() === 0;
export const isLastStep = (): boolean => $setupStep.get() === SETUP_STEPS.length - 1;

export function nextStep(): void {
  if (!isLastStep()) $setupStep.set($setupStep.get() + 1);
}

/** Step back one; returns false when already at the first step. */
export function prevStep(): boolean {
  if (isFirstStep()) return false;
  $setupStep.set($setupStep.get() - 1);
  return true;
}

export function completeSetup(): void {
  $setupDone.set(true);
  try {
    globalThis.localStorage?.setItem(KEY, "1");
  } catch {
    // ignore — private mode / SSR
  }
}
