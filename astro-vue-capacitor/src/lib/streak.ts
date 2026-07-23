/**
 * Streak & calendar aggregations for Home / Profile (Phase 1). Pure — no DOM.
 *
 * Timezone-safe: days are compared through local calendar-day keys / the local
 * Date constructor, mirroring date.ts (`dayKey`) and trends.ts (`weekStart`), so
 * bucketing never drifts across timezones or DST.
 */

import { dayKey } from "./date";
import { type Activity, isGps } from "./types";

/** Which kind of activity dominated a day, for calendar/strip rendering. */
export type DayType = "gps" | "exercise";

interface DayCounts {
  gps: number;
  exercise: number;
}

/** One day in a rolling window (see `lastNDays`). */
export interface DayMark {
  /** epoch ms at local 00:00 of that day */
  date: number;
  active: boolean;
  /** dominant type when active, else null */
  type: DayType | null;
}

function kindOf(a: Activity): DayType {
  return isGps(a) ? "gps" : "exercise";
}

/** Dominant type of a day. Ties resolve to "gps" (the neutral mark). */
function dominant(c: DayCounts): DayType {
  return c.exercise > c.gps ? "exercise" : "gps";
}

/** Group activities by local day key, counting kinds per day. */
function countByDay(activities: Activity[]): Map<string, DayCounts> {
  const map = new Map<string, DayCounts>();
  for (const a of activities) {
    const key = dayKey(a.date);
    const c = map.get(key) ?? { gps: 0, exercise: 0 };
    c[kindOf(a)]++;
    map.set(key, c);
  }
  return map;
}

/**
 * Number of consecutive days, counting back from today, that had at least one
 * activity of any kind. Today not yet being active does NOT break the streak:
 * counting simply starts from yesterday in that case.
 */
export function currentStreak(activities: Activity[], now: number = Date.now()): number {
  if (activities.length === 0) return 0;
  const active = new Set(countByDay(activities).keys());

  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  // Grace: if nothing is logged today yet, start counting from yesterday.
  if (!active.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (active.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Map of day-number → dominant type for the days that had activity in the given
 * month. `month` is 0-based (JS convention: 0 = January). For calendar rendering.
 */
export function activeDaysInMonth(
  activities: Activity[],
  year: number,
  month: number,
): Map<number, DayType> {
  const perDay = new Map<number, DayCounts>();
  for (const a of activities) {
    const d = new Date(a.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const day = d.getDate();
    const c = perDay.get(day) ?? { gps: 0, exercise: 0 };
    c[kindOf(a)]++;
    perDay.set(day, c);
  }
  const out = new Map<number, DayType>();
  for (const [day, c] of perDay) out.set(day, dominant(c));
  return out;
}

/**
 * The last `n` calendar days, oldest → newest and ending today, each marked with
 * whether it had activity and its dominant type. Powers the Home week strip.
 */
export function lastNDays(activities: Activity[], n: number, now: number = Date.now()): DayMark[] {
  const counts = countByDay(activities);
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (n - 1));

  const out: DayMark[] = [];
  for (let i = 0; i < n; i++) {
    const c = counts.get(dayKey(cursor.getTime()));
    out.push({ date: cursor.getTime(), active: c !== undefined, type: c ? dominant(c) : null });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
