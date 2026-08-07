/**
 * Interchangeable track-processing methods, all pure functions of the raw fixes.
 * The UI can compute any of them from the same stored points and switch which
 * one it shows — an A/B bench for "which matches reality best".
 */

import { cleanTrack } from "./clean";
import { kalmanFilter } from "./kalman";
import type { TrackPoint } from "./track-point";

export type TrackFilterId = "raw" | "drift" | "kalman" | "smooth";

export interface TrackFilterDef {
  id: TrackFilterId;
  label: string;
  apply: (points: TrackPoint[]) => TrackPoint[];
}

/** Selector order. `drift` is the default (see the store). */
export const TRACK_FILTERS: TrackFilterDef[] = [
  { id: "raw", label: "Crudo", apply: (p) => p },
  { id: "drift", label: "Drift", apply: cleanTrack },
  { id: "kalman", label: "Kalman", apply: kalmanFilter },
  // Gate stationary jitter first, then smooth the real movement.
  { id: "smooth", label: "D+K", apply: (p) => kalmanFilter(cleanTrack(p)) },
];

export function applyFilter(id: TrackFilterId, points: TrackPoint[]): TrackPoint[] {
  return (TRACK_FILTERS.find((f) => f.id === id) ?? TRACK_FILTERS[1]!).apply(points);
}
