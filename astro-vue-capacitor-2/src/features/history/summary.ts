/**
 * Pure aggregates over saved activities for the Home dashboard — week totals and
 * the active-day streak. Days are local (midnight boundaries) so "today" matches
 * the user's clock. `now` is injected for testability.
 */

import type { Activity, MoveActivity } from "../tracking";
import { distanceMeters } from "../tracking";

const DAY_MS = 86_400_000;

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isMove(a: Activity): a is MoveActivity {
  return a.kind === "move";
}

export interface WeekSummary {
  count: number;
  distanceM: number;
  movingMs: number;
}

/** Totals over movement activities started within the last 7 days. */
export function weekSummary(activities: Activity[], now: number): WeekSummary {
  const cutoff = now - 7 * DAY_MS;
  const recent = activities.filter((a) => isMove(a) && a.startedAt >= cutoff) as MoveActivity[];
  return recent.reduce<WeekSummary>(
    (acc, a) => ({
      count: acc.count + 1,
      distanceM: acc.distanceM + distanceMeters(a.points),
      movingMs: acc.movingMs + (a.movingMs ?? 0),
    }),
    { count: 0, distanceM: 0, movingMs: 0 },
  );
}

/**
 * Consecutive days (ending today, or yesterday if today is empty) with at least
 * one activity. 0 when the most recent activity is older than yesterday.
 */
export function currentStreak(activities: Activity[], now: number): number {
  const days = new Set(activities.map((a) => startOfDay(a.startedAt)));
  let cursor = startOfDay(now);
  if (!days.has(cursor)) cursor -= DAY_MS; // today empty — a streak can still stand on yesterday
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor -= DAY_MS;
  }
  return streak;
}
