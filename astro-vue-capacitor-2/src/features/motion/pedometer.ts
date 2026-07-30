/**
 * Composition point for the pedometer. One shared instance (the accelerometer
 * adapter works on device and web alike), imported by the recorder singleton
 * and the live UI so both read the same live step/cadence stores.
 */

import { createCapacitorPedometer } from "./adapters/capacitor-pedometer";
import type { Pedometer } from "./ports/pedometer";

let instance: Pedometer | null = null;

export function pedometer(): Pedometer {
  instance ??= createCapacitorPedometer();
  return instance;
}
