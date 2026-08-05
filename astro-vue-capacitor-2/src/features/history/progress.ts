/**
 * Cross-activity progress — how distance and speed evolve across sessions of a
 * given movement type. Pure and derived from stored points, so it stays honest
 * with whatever metrics rethink happens later. Sessions are chronological
 * (oldest first) for left-to-right charts.
 */

import {
  avgPaceSecPerKm,
  avgSpeedMps,
  cleanTrack,
  distanceMeters,
  type Activity,
  type MoveType,
} from "../tracking";

export interface SessionPoint {
  /** startedAt, epoch ms. */
  t: number;
  distanceM: number;
  /** Average moving speed, m/s. */
  mps: number;
  /** Average pace, s/km, or null. */
  paceSecPerKm: number | null;
}

export function sessionSeries(activities: Activity[], type: MoveType): SessionPoint[] {
  return activities
    .filter((a) => a.kind === "move" && a.type === type)
    .map((a) => {
      const clean = cleanTrack(a.kind === "move" ? a.points : []);
      return {
        t: a.startedAt,
        distanceM: distanceMeters(clean),
        mps: avgSpeedMps(clean),
        paceSecPerKm: avgPaceSecPerKm(clean),
      };
    })
    .sort((x, y) => x.t - y.t);
}

export interface Records {
  count: number;
  longestM: number;
  bestPaceSecPerKm: number | null;
}

export function records(series: SessionPoint[]): Records {
  const paces = series.map((s) => s.paceSecPerKm).filter((p): p is number => p != null);
  return {
    count: series.length,
    longestM: series.reduce((m, s) => Math.max(m, s.distanceM), 0),
    bestPaceSecPerKm: paces.length ? Math.min(...paces) : null,
  };
}
