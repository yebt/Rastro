/**
 * Scripted pedometer for tests — no sensor. `emit()` sets the running step
 * count so a test can drive the recorder without real accelerometer input.
 */

import { atom } from "nanostores";
import type { Pedometer } from "../ports/pedometer";

export interface FakePedometer extends Pedometer {
  /** Set the current step count (only while running). */
  emit(steps: number): void;
}

export function createFakePedometer(): FakePedometer {
  const $steps = atom(0);
  const $cadence = atom(0);
  let running = false;

  return {
    $steps,
    $cadence,
    async start() {
      running = true;
      $steps.set(0);
      $cadence.set(0);
    },
    pause() {
      $cadence.set(0);
    },
    resume() {},
    async stop() {
      running = false;
      $cadence.set(0);
      return $steps.get();
    },
    emit(steps) {
      if (running) $steps.set(steps);
    },
  };
}
