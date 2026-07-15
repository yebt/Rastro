/**
 * Pure GPS noise-filtering logic (SPECS §4.1 / §13).
 * Extracted from the tracking loop so the decision rules are unit-testable
 * without a real geolocation feed.
 */

import { haversine, type LatLng } from "./geo";
import type { RoutePoint } from "./types";

/** Discard readings with worse accuracy than this (meters). */
export const MAX_ACCURACY_M = 40;
/** Ignore micro-movements below this (meters) — jitter while standing still. */
export const MIN_SEGMENT_M = 2;
/** Segments longer than this (meters) are unrealistic jumps: keep point, drop distance. */
export const MAX_JUMP_M = 60;

/** Minimum spacing between recorded samples, in seconds (SPECS §14.4 — tunable). */
export const SAMPLE_INTERVAL_S = 3;

/**
 * Whether to record a time-series sample now (F3), throttled by SAMPLE_INTERVAL_S.
 * Keeps the samples array manageable on long activities.
 */
export function shouldSample(
  nowSec: number,
  lastSampleSec: number,
  intervalSec: number = SAMPLE_INTERVAL_S,
): boolean {
  return nowSec - lastSampleSec >= intervalSec;
}

export type PointDecision =
  /** Accuracy too poor: ignore entirely for distance (UI may still recenter the map). */
  | { kind: "reject-accuracy" }
  /** First fix of the track: record the point, no distance yet. */
  | { kind: "first" }
  /** Below the jitter threshold: ignore. */
  | { kind: "jitter" }
  /** Unrealistic jump: record the point but do not add its distance. */
  | { kind: "jump"; meters: number }
  /** Valid movement: add distance and update instantaneous speed. */
  | { kind: "move"; meters: number; speedKmh: number };

/**
 * Decide what to do with a new GPS reading given the previous accepted point.
 * `last` is null for the first fix.
 */
export function evaluatePoint(
  last: RoutePoint | null,
  next: RoutePoint,
  accuracy: number,
): PointDecision {
  if (accuracy > MAX_ACCURACY_M) return { kind: "reject-accuracy" };
  if (!last) return { kind: "first" };

  const meters = haversine(last as LatLng, next as LatLng);
  if (meters < MIN_SEGMENT_M) return { kind: "jitter" };
  if (meters > MAX_JUMP_M) return { kind: "jump", meters };

  const dt = (next.t - last.t) / 1000;
  const speedKmh = dt > 0 ? (meters / dt) * 3.6 : 0;
  return { kind: "move", meters, speedKmh };
}
