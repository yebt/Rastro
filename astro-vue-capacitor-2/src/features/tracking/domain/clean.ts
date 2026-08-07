/**
 * GPS drift filtering — derived, not destructive.
 *
 * Rastro stores every raw fix (lossless), but distance and the drawn route are
 * computed from a CLEANED view: fixes with poor accuracy are dropped, and moves
 * that don't clear the position noise floor are treated as jitter (GPS wander
 * while standing still) rather than real movement. On a rejected fix the last
 * accepted point is kept, so slow but sustained movement still accumulates
 * across several fixes — only true drift is dropped.
 */

import { haversineMeters } from "./metrics";
import type { TrackPoint } from "./track-point";

/** Discard readings worse than this accuracy (metres). */
export const MAX_ACCURACY_M = 40;
/** Ignore micro-moves below this (metres) even with perfect accuracy. */
export const MIN_SEGMENT_M = 2;
/** A move must exceed `accuracy × this` to count as real (drift gate). */
export const ACCURACY_FACTOR = 0.5;

/** The subset of fixes that represent real movement, jitter and noise removed. */
export function cleanTrack(points: TrackPoint[]): TrackPoint[] {
  const out: TrackPoint[] = [];
  let last: TrackPoint | null = null;

  for (const next of points) {
    const acc = next.acc ?? 0;
    if (acc > MAX_ACCURACY_M) continue; // too noisy to trust
    if (last === null) {
      out.push(next);
      last = next;
      continue;
    }
    const meters = haversineMeters(last, next);
    const noiseFloor = Math.max(MIN_SEGMENT_M, acc * ACCURACY_FACTOR);
    if (meters < noiseFloor) continue; // jitter — keep `last`, drop this fix
    out.push(next);
    last = next;
  }

  return out;
}
