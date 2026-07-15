/** Pull-up (dominadas) aggregations (SPECS §4.2). Pure. */

import { dayKey } from "./date";
import type { DominadasSession } from "./types";

export interface PullStats {
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
 * Compute pull-up stat card values.
 * `now` is injectable so "today" is deterministic in tests.
 */
export function pullStats(sessions: DominadasSession[], now: number = Date.now()): PullStats {
  const todayKey = dayKey(now);
  let all = 0;
  let today = 0;
  let best = 0;
  let bestSet = 0;

  for (const s of sessions) {
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
