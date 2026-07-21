/**
 * Hardware pedometer (F6): Android's TYPE_STEP_COUNTER via @capgo/capacitor-pedometer.
 *
 * Runs as an ALTERNATE counter alongside the accelerometer one (../motion/pedometer)
 * so the user can compare both and pick a default. Low-power hardware sensor;
 * counts even with the screen off (while the process is alive via the F5 service).
 *
 * The sensor reports a cumulative step total, so we subtract a baseline captured
 * on the first reading to get session steps. Cadence isn't exposed on Android,
 * so we derive it from step deltas over a sliding window (same as the accel path).
 */

import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { CapacitorPedometer } from "@capgo/capacitor-pedometer";
import { atom } from "nanostores";
import { cadenceFromSteps } from "../lib/steps";

export const $hwSteps = atom<number>(0);
export const $hwCadence = atom<number>(0); // steps/min
/** True once we've confirmed a working hardware step counter this session. */
export const $hwAvailable = atom<boolean>(false);

const WINDOW_MS = 10000;

let handle: PluginListenerHandle | null = null;
let baseline: number | null = null;
let sessionSteps = 0;
let stepTimes: number[] = [];
let paused = false;

/** Whether this device exposes a hardware step counter (native + sensor present). */
export async function hardwareAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    return (await CapacitorPedometer.isAvailable()).stepCounting;
  } catch {
    return false;
  }
}

export async function startHardwarePedometer(): Promise<void> {
  baseline = null;
  sessionSteps = 0;
  stepTimes = [];
  paused = false;
  $hwSteps.set(0);
  $hwCadence.set(0);
  $hwAvailable.set(false);

  if (!(await hardwareAvailable())) return;

  try {
    const perm = await CapacitorPedometer.requestPermissions();
    if (perm.activityRecognition !== "granted") return;

    handle = await CapacitorPedometer.addListener("measurement", (e) => {
      if (paused || typeof e.numberOfSteps !== "number") return;
      const total = e.numberOfSteps;
      if (baseline === null) {
        baseline = total; // first reading is the cumulative offset
        return;
      }
      const steps = Math.max(0, total - baseline);
      const now = Date.now();
      for (let i = sessionSteps; i < steps; i++) stepTimes.push(now);
      sessionSteps = steps;
      $hwSteps.set(steps);
      if (stepTimes.length > 0 && stepTimes[0]! < now - WINDOW_MS * 2) {
        stepTimes = stepTimes.filter((ts) => ts >= now - WINDOW_MS * 2);
      }
      $hwCadence.set(cadenceFromSteps(stepTimes, now, WINDOW_MS));
    });
    await CapacitorPedometer.startMeasurementUpdates();
    $hwAvailable.set(true);
  } catch {
    handle = null; // no hardware pedometer — atoms simply stay 0
  }
}

export function setHardwarePedometerPaused(value: boolean): void {
  paused = value;
}

/** Windowed hardware cadence right now (steps/min). */
export function currentHwCadence(): number {
  return cadenceFromSteps(stepTimes, Date.now(), WINDOW_MS);
}

/** Stop the hardware counter; returns the session step total (0 if unavailable). */
export async function stopHardwarePedometer(): Promise<number> {
  const total = sessionSteps;
  try {
    if (handle) {
      await handle.remove();
      handle = null;
    }
    await CapacitorPedometer.stopMeasurementUpdates();
  } catch {
    // ignore — never fired / already stopped
  }
  return total;
}
