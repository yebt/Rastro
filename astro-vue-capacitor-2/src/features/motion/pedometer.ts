/**
 * Composition point for the pedometer. One shared instance (the accelerometer
 * adapter works on device and web alike), imported by the recorder singleton
 * and the live UI so both read the same live step/cadence stores.
 */

import { createHardwarePedometer } from "./adapters/hardware-pedometer";
import type { Pedometer } from "./ports/pedometer";

let instance: Pedometer | null = null;

export function pedometer(): Pedometer {
  // Hardware step counter on device; it falls back to the accelerometer itself
  // when no sensor is present (and on the web), so this one adapter covers all.
  instance ??= createHardwarePedometer();
  return instance;
}
