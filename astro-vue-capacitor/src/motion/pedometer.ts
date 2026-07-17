/**
 * Pedometer (F2): accelerometer → steps + cadence, via @capacitor/motion.
 *
 * Approximate (accelerometer-based, screen-on). The precise hardware step
 * counter (F6) would be another source behind the same start/stop shape.
 * Sensor plumbing only — the detection algorithm lives in ../lib/steps.
 */

import { Motion } from '@capacitor/motion';
import type { PluginListenerHandle } from '@capacitor/core';
import { atom } from 'nanostores';
import { cadenceFromSteps, magnitude, StepDetector } from '../lib/steps';

export const $steps = atom<number>(0);
export const $cadence = atom<number>(0); // steps/min

const WINDOW_MS = 10000;

let handle: PluginListenerHandle | null = null;
let detector = new StepDetector();
let stepTimes: number[] = [];
let paused = false;

/** iOS 13+ gates DeviceMotion behind a permission prompt (best-effort). */
async function requestMotionPermission(): Promise<void> {
  const dme = (globalThis as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } })
    .DeviceMotionEvent;
  if (dme && typeof dme.requestPermission === 'function') {
    try {
      await dme.requestPermission();
    } catch {
      // denied/unavailable — degrade silently
    }
  }
}

export async function startPedometer(): Promise<void> {
  detector = new StepDetector();
  stepTimes = [];
  paused = false;
  $steps.set(0);
  $cadence.set(0);

  await requestMotionPermission();
  try {
    handle = await Motion.addListener('accel', (e) => {
      if (paused) return;
      const g = e.accelerationIncludingGravity;
      const t = Date.now();
      if (detector.push(magnitude(g.x, g.y, g.z), t)) {
        stepTimes.push(t);
        $steps.set(detector.steps);
      }
      // Prune old timestamps and keep cadence live (decays when you stop).
      if (stepTimes.length > 0 && stepTimes[0]! < t - WINDOW_MS * 2) {
        stepTimes = stepTimes.filter((ts) => ts >= t - WINDOW_MS * 2);
      }
      $cadence.set(cadenceFromSteps(stepTimes, t, WINDOW_MS));
    });
  } catch {
    handle = null; // no accelerometer — cadence/steps simply stay 0
  }
}

export function setPedometerPaused(value: boolean): void {
  paused = value;
}

/** Windowed cadence right now (steps/min). */
export function currentCadence(): number {
  return cadenceFromSteps(stepTimes, Date.now(), WINDOW_MS);
}

/** Stop listening; returns the total step count for the session. */
export async function stopPedometer(): Promise<number> {
  if (handle) {
    await handle.remove();
    handle = null;
  }
  return detector.steps;
}
