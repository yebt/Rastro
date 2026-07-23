/** Bodyweight-exercise aggregations (SPECS §4.2). Pure. */

import { dayKey } from "./date";
import type { ExerciseKind, ExerciseSession } from "./types";

export interface ExerciseStats {
  /** all-time total reps */
  all: number;
  /** reps done today */
  today: number;
  /** best single session total */
  best: number;
  /** best single set */
  bestSet: number;
}

/**
 * Compute exercise stat-card values across a list of sessions.
 * When `exercise` is given, only sessions of that exercise are aggregated;
 * otherwise every session counts. `now` is injectable so "today" is
 * deterministic in tests.
 */
export function exerciseStats(
  sessions: ExerciseSession[],
  exercise?: ExerciseKind,
  now: number = Date.now(),
): ExerciseStats {
  const todayKey = dayKey(now);
  let all = 0;
  let today = 0;
  let best = 0;
  let bestSet = 0;

  for (const s of sessions) {
    if (exercise !== undefined && s.exercise !== exercise) continue;
    all += s.total;
    if (dayKey(s.date) === todayKey) today += s.total;
    if (s.total > best) best = s.total;
    for (const reps of s.sets ?? []) {
      if (reps > bestSet) bestSet = reps;
    }
  }

  return { all, today, best, bestSet };
}

/** Sum of a list of set rep counts. */
export function sessionTotal(sets: number[]): number {
  return sets.reduce((a, b) => a + b, 0);
}
