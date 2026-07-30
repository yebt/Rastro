/**
 * Pedometer port (hexagonal architecture).
 *
 * The recorder counts steps against this interface, never a concrete sensor:
 * the accelerometer on device, a scripted fake in tests. Steps and cadence are
 * exposed as nanostores so the live UI can read them reactively; `stop()`
 * returns the final total for persistence.
 */

import type { ReadableAtom } from "nanostores";

export interface Pedometer {
  /** Total steps counted since the last start(), updated live. */
  readonly $steps: ReadableAtom<number>;
  /** Current cadence in steps/min (decays to 0 when you stop moving). */
  readonly $cadence: ReadableAtom<number>;
  /** Begin counting from zero. */
  start(): Promise<void>;
  /** Stop counting while paused; resume() continues the same total. */
  pause(): void;
  resume(): void;
  /** Stop for good and return the final step total. */
  stop(): Promise<number>;
}
