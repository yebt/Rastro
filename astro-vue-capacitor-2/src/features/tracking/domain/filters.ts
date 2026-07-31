/**
 * Interchangeable track-processing methods, all pure functions of the raw fixes.
 * The UI can compute any of them from the same stored points and switch which
 * one it shows — an A/B bench for "which matches reality best".
 */

import { cleanTrack } from "./clean";
import { kalmanFilter } from "./kalman";
import type { TrackPoint } from "./track-point";

export type TrackFilterId = "raw" | "drift" | "kalman";

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
];

export function applyFilter(id: TrackFilterId, points: TrackPoint[]): TrackPoint[] {
  return (TRACK_FILTERS.find((f) => f.id === id) ?? TRACK_FILTERS[1]!).apply(points);
}
