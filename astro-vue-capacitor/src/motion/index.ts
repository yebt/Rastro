/**
 * Motion facade: one entry point over the two step engines — the accelerometer
 * pedometer (F2, ./pedometer) and the hardware step counter (F6, ./hardware).
 *
 * Both run during a session so the saved activity can compare them, but the
 * live UI and the samples only ever read the ACTIVE source (the user's default
 * in settings, falling back to the accelerometer when no hardware is present).
 */

import { computed } from "nanostores";
import { $stepSource, type StepSource } from "../stores/settings";
import {
  $cadence,
  $steps,
  currentCadence,
  setPedometerPaused,
  startPedometer,
  stopPedometer,
} from "./pedometer";
import {
  $hwAvailable,
  $hwCadence,
  $hwSteps,
  currentHwCadence,
  setHardwarePedometerPaused,
  startHardwarePedometer,
  stopHardwarePedometer,
} from "./hardware";

/** The source actually in use: hardware only when chosen AND present. */
export const $activeSource = computed(
  [$stepSource, $hwAvailable],
  (src, hw): StepSource => (src === "hardware" && hw ? "hardware" : "accelerometer"),
);

export const $activeSteps = computed(
  [$activeSource, $steps, $hwSteps],
  (src, accel, hw) => (src === "hardware" ? hw : accel),
);

export const $activeCadence = computed(
  [$activeSource, $cadence, $hwCadence],
  (src, accel, hw) => (src === "hardware" ? hw : accel),
);

/** Windowed cadence of the active source right now (for sample capture). */
export function currentActiveCadence(): number {
  return $activeSource.get() === "hardware" ? currentHwCadence() : currentCadence();
}

/** Start both engines (accelerometer always; hardware when available). */
export async function startPedometers(): Promise<void> {
  await Promise.all([startPedometer(), startHardwarePedometer()]);
}

export function pausePedometers(paused: boolean): void {
  setPedometerPaused(paused);
  setHardwarePedometerPaused(paused);
}

/** Stop both; returns each engine's session total for the comparison. */
export async function stopPedometers(): Promise<{ accel: number; hardware: number }> {
  const [accel, hardware] = await Promise.all([stopPedometer(), stopHardwarePedometer()]);
  return { accel, hardware };
}
