/**
 * Accelerometer step detection (F2) — pure & testable, no sensor coupling.
 *
 * Peak-picking over the magnitude of acceleration (incl. gravity): a step is a
 * peak that rises above a smoothed baseline by `peakThreshold`, debounced by
 * `minIntervalMs`. Approximate by design (SPECS §7 F2) — the hardware pedometer
 * (F6) is the precise path.
 */

export interface StepConfig {
  /** m/s² a peak must rise above the smoothed baseline to arm */
  peakThreshold: number;
  /** minimum ms between counted steps (debounce) */
  minIntervalMs: number;
  /** low-pass factor for the gravity baseline (0..1) */
  smoothing: number;
}

export const DEFAULT_STEP_CONFIG: StepConfig = {
  peakThreshold: 1.1,
  minIntervalMs: 260,
  smoothing: 0.1,
};

/** Magnitude of a 3-axis acceleration vector. */
export function magnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/** Cadence in steps/min from recent step timestamps within a sliding window. */
export function cadenceFromSteps(stepTimesMs: number[], now: number, windowMs = 10000): number {
  const cutoff = now - windowMs;
  const recent = stepTimesMs.filter((t) => t >= cutoff);
  if (recent.length < 2) return 0;
  return Math.round((recent.length / windowMs) * 60000);
}

export class StepDetector {
  private baseline: number | null = null;
  private armed = false;
  private lastStepT = -Infinity;
  private count = 0;
  private cfg: StepConfig;

  constructor(cfg: StepConfig = DEFAULT_STEP_CONFIG) {
    this.cfg = cfg;
  }

  get steps(): number {
    return this.count;
  }

  /** Feed one acceleration magnitude (m/s²) at time `t` (ms). True if a step was counted. */
  push(mag: number, t: number): boolean {
    if (this.baseline === null) {
      this.baseline = mag;
      return false;
    }
    this.baseline += (mag - this.baseline) * this.cfg.smoothing;
    const delta = mag - this.baseline;

    if (!this.armed && delta > this.cfg.peakThreshold) {
      this.armed = true;
      if (t - this.lastStepT >= this.cfg.minIntervalMs) {
        this.count++;
        this.lastStepT = t;
        return true;
      }
    } else if (this.armed && delta < this.cfg.peakThreshold * 0.5) {
      this.armed = false;
    }
    return false;
  }

  reset(): void {
    this.baseline = null;
    this.armed = false;
    this.lastStepT = -Infinity;
    this.count = 0;
  }
}
