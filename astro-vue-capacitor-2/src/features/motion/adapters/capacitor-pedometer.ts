/**
 * Accelerometer pedometer — @capacitor/motion feeding the pure StepDetector.
 *
 * Works on device and on the web (both go through DeviceMotion). If no
 * accelerometer is available the listener simply never fires, so steps and
 * cadence stay at 0 rather than erroring.
 */

import type { PluginListenerHandle } from "@capacitor/core";
import { Motion } from "@capacitor/motion";
import { atom } from "nanostores";
import type { Pedometer } from "../ports/pedometer";
import { cadenceFromSteps, magnitude, StepDetector } from "../steps";

const WINDOW_MS = 10_000;

/** iOS 13+ gates DeviceMotion behind a prompt; best-effort, degrades silently. */
async function requestMotionPermission(): Promise<void> {
  const dme = (globalThis as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } })
    .DeviceMotionEvent;
  if (dme && typeof dme.requestPermission === "function") {
    try {
      await dme.requestPermission();
    } catch {
      // denied / unavailable — steps just stay 0
    }
  }
}

export function createCapacitorPedometer(): Pedometer {
  const $steps = atom(0);
  const $cadence = atom(0);

  let handle: PluginListenerHandle | null = null;
  let detector = new StepDetector();
  let stepTimes: number[] = [];
  let paused = false;

  return {
    $steps,
    $cadence,

    async start() {
      detector = new StepDetector();
      stepTimes = [];
      paused = false;
      $steps.set(0);
      $cadence.set(0);

      await requestMotionPermission();
      try {
        handle = await Motion.addListener("accel", (e) => {
          if (paused) return;
          const g = e.accelerationIncludingGravity;
          const t = Date.now();
          if (detector.push(magnitude(g.x, g.y, g.z), t)) {
            stepTimes.push(t);
            $steps.set(detector.steps);
          }
          // Prune old timestamps so cadence stays live and decays when you stop.
          if (stepTimes.length > 0 && stepTimes[0]! < t - WINDOW_MS * 2) {
            stepTimes = stepTimes.filter((ts) => ts >= t - WINDOW_MS * 2);
          }
          $cadence.set(cadenceFromSteps(stepTimes, t, WINDOW_MS));
        });
      } catch {
        handle = null; // no accelerometer — steps/cadence stay 0
      }
    },

    pause() {
      paused = true;
      $cadence.set(0);
    },

    resume() {
      paused = false;
    },

    async stop() {
      if (handle) {
        await handle.remove();
        handle = null;
      }
      $cadence.set(0);
      return detector.steps;
    },
  };
}
