/**
 * Hardware pedometer — Android's TYPE_STEP_COUNTER via @capgo/capacitor-pedometer.
 *
 * Low-power hardware sensor that keeps counting with the screen off (while the
 * process stays alive through the background-geolocation foreground service).
 * The sensor is cumulative since boot, so we subtract a baseline captured on the
 * first reading to get session steps; cadence is derived from step deltas over a
 * sliding window.
 *
 * When no hardware step counter is present, or its permission is refused, this
 * falls back to the accelerometer pedometer so steps still count.
 */

import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { CapacitorPedometer } from "@capgo/capacitor-pedometer";
import { atom } from "nanostores";
import type { Pedometer } from "../ports/pedometer";
import { cadenceFromSteps } from "../steps";
import { createCapacitorPedometer } from "./capacitor-pedometer";

const WINDOW_MS = 10_000;

async function hardwareAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    return (await CapacitorPedometer.isAvailable()).stepCounting;
  } catch {
    return false;
  }
}

export function createHardwarePedometer(): Pedometer {
  const $steps = atom(0);
  const $cadence = atom(0);
  const accel = createCapacitorPedometer();

  let mode: "hardware" | "accel" | null = null;
  let handle: PluginListenerHandle | null = null;
  let unsubs: (() => void)[] = [];
  let baseline: number | null = null;
  let lastTotal: number | null = null;
  let resync = false;
  let sessionSteps = 0;
  let stepTimes: number[] = [];
  let paused = false;

  function reset(): void {
    baseline = null;
    lastTotal = null;
    resync = false;
    sessionSteps = 0;
    stepTimes = [];
    paused = false;
    $steps.set(0);
    $cadence.set(0);
  }

  /** Mirror the accelerometer adapter's live stores into ours. */
  async function fallback(): Promise<void> {
    mode = "accel";
    await accel.start();
    unsubs.push(accel.$steps.subscribe((v) => $steps.set(v)));
    unsubs.push(accel.$cadence.subscribe((v) => $cadence.set(v)));
  }

  function clearFallback(): void {
    unsubs.forEach((u) => u());
    unsubs = [];
  }

  return {
    $steps,
    $cadence,

    async start() {
      reset();
      clearFallback();

      if (!(await hardwareAvailable())) return fallback();
      try {
        const perm = await CapacitorPedometer.requestPermissions();
        if (perm.activityRecognition !== "granted") return fallback();

        handle = await CapacitorPedometer.addListener("measurement", (e) => {
          if (paused || typeof e.numberOfSteps !== "number") return;
          const total = e.numberOfSteps;
          if (baseline === null) {
            baseline = total; // first reading is the cumulative offset
            lastTotal = total;
            return;
          }
          if (resync) {
            // The hardware counter kept ticking while paused. Advance the baseline
            // past that gap so paused steps aren't lumped in on resume.
            baseline += total - lastTotal!;
            resync = false;
          }
          const steps = Math.max(0, total - baseline);
          const now = Date.now();
          for (let i = sessionSteps; i < steps; i++) stepTimes.push(now);
          sessionSteps = steps;
          $steps.set(steps);
          if (stepTimes.length > 0 && stepTimes[0]! < now - WINDOW_MS * 2) {
            stepTimes = stepTimes.filter((ts) => ts >= now - WINDOW_MS * 2);
          }
          $cadence.set(cadenceFromSteps(stepTimes, now, WINDOW_MS));
          lastTotal = total;
        });
        await CapacitorPedometer.startMeasurementUpdates();
        mode = "hardware";
      } catch {
        await fallback();
      }
    },

    pause() {
      paused = true;
      $cadence.set(0);
      if (mode === "accel") accel.pause();
    },

    resume() {
      paused = false;
      resync = true; // re-baseline on the next reading (see the listener)
      if (mode === "accel") accel.resume();
    },

    async stop() {
      if (mode === "accel") {
        clearFallback();
        mode = null;
        return accel.stop();
      }
      const total = sessionSteps;
      try {
        if (handle) {
          await handle.remove();
          handle = null;
        }
        await CapacitorPedometer.stopMeasurementUpdates();
      } catch {
        // never started / already stopped
      }
      $cadence.set(0);
      mode = null;
      return total;
    },
  };
}
