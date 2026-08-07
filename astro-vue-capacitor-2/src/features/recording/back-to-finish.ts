/**
 * Hardware-back handling while recording.
 *
 * A single back press doesn't leave the immersive screen — it arms a hint
 * ("press back again to finish"); a second press within the window asks to
 * finish. State is exposed as stores the live view reads reactively.
 */

import { atom } from "nanostores";
import { recorder } from "./singleton";

/** True while the first back press is armed — the live view shows the hint. */
export const $backArmed = atom(false);
/** Flips true on the second back press; the live view opens its finish confirm. */
export const $finishRequested = atom(false);

const ARM_MS = 2500;
let timer: ReturnType<typeof setTimeout> | null = null;

function disarm(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  $backArmed.set(false);
}

/** Reset after the live view has handled a finish request. */
export function clearFinishRequest(): void {
  $finishRequested.set(false);
  disarm();
}

/**
 * Consume a hardware-back press during recording. Returns true if it was handled
 * here (so the global handler should stop), false when not recording.
 */
export function handleRecordingBack(): boolean {
  const status = recorder.$status.get();
  if (status !== "recording" && status !== "paused") return false;

  if ($backArmed.get()) {
    disarm();
    $finishRequested.set(true);
  } else {
    $backArmed.set(true);
    timer = setTimeout(disarm, ARM_MS);
  }
  return true;
}
