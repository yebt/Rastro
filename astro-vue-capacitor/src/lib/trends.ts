/**
 * Cross-activity trends & records (F9, SPECS §9.2 / §9.3). Pure — no DOM.
 * Aggregates the whole history into weekly buckets and all-time records so the
 * user can see whether they're improving, not just what a single outing looked
 * like. Degrades cleanly: activities without samples still count for distance,
 * pace and pull-ups; only sample-derived detail is skipped.
 */

import { avgCadence } from "./reports";
import { type Activity, type GpsActivity, isGps, type Prs } from "./types";

/** One weekly data point: value aggregated over the ISO week starting Monday. */
export interface WeekPoint {
  /** epoch ms of that week's Monday, 00:00 local */
  weekStart: number;
  /** short label, e.g. "12 may" */
  label: string;
  value: number;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Monday 00:00 (local) of the week containing `ms`. */
export function weekStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

/** Short "d mmm" label for a week start. */
export function weekLabel(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * Bucket activities by week and reduce each bucket to a single number.
 * `pick` returns a contribution per activity; `combine` folds them. Only weeks
 * with a non-null contribution appear, sorted oldest → newest.
 */
function weekly(
  activities: Activity[],
  pick: (a: Activity) => number | null,
  combine: (values: number[]) => number,
): WeekPoint[] {
  const buckets = new Map<number, number[]>();
  for (const a of activities) {
    const v = pick(a);
    if (v === null) continue;
    const ws = weekStart(a.date);
    const list = buckets.get(ws);
    if (list) list.push(v);
    else buckets.set(ws, [v]);
  }
  return [...buckets.entries()]
    .toSorted((x, y) => x[0] - y[0])
    .map(([ws, values]) => ({ weekStart: ws, label: weekLabel(ws), value: combine(values) }));
}

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

/** Distance run/walked per week, in km. */
export function weeklyDistanceKm(activities: Activity[]): WeekPoint[] {
  return weekly(activities, (a) => (isGps(a) ? a.distance / 1000 : null), sum);
}

/**
 * Weighted average pace per week, sec/km (weighted by each outing's distance so
 * a long steady run isn't outvoted by a short sprint). Weeks with no GPS drop out.
 */
export function weeklyAvgPaceSecPerKm(activities: Activity[]): WeekPoint[] {
  const buckets = new Map<number, { sec: number; m: number }>();
  for (const a of activities) {
    if (!isGps(a) || a.distance <= 0) continue;
    const ws = weekStart(a.date);
    const b = buckets.get(ws) ?? { sec: 0, m: 0 };
    b.sec += a.duration;
    b.m += a.distance;
    buckets.set(ws, b);
  }
  return [...buckets.entries()]
    .toSorted((x, y) => x[0] - y[0])
    .map(([ws, b]) => ({ weekStart: ws, label: weekLabel(ws), value: b.sec / (b.m / 1000) }));
}

/** Average cadence per week (steps/min), weighted by duration. Cadence-less weeks drop out. */
export function weeklyAvgCadence(activities: Activity[]): WeekPoint[] {
  const buckets = new Map<number, { cad: number; dur: number }>();
  for (const a of activities) {
    if (!isGps(a)) continue;
    const cad = avgCadence(a);
    if (cad <= 0 || a.duration <= 0) continue;
    const ws = weekStart(a.date);
    const b = buckets.get(ws) ?? { cad: 0, dur: 0 };
    b.cad += cad * a.duration;
    b.dur += a.duration;
    buckets.set(ws, b);
  }
  return [...buckets.entries()]
    .toSorted((x, y) => x[0] - y[0])
    .map(([ws, b]) => ({ weekStart: ws, label: weekLabel(ws), value: Math.round(b.cad / b.dur) }));
}

/** Total pull-up reps per week. */
export function weeklyPullups(activities: Activity[]): WeekPoint[] {
  return weekly(activities, (a) => (a.kind === "dominadas" ? a.total : null), sum);
}

/**
 * Fastest continuous `meters` within one activity, in seconds (normalized to
 * exactly `meters`). Two-pointer over samples; falls back to whole-activity
 * average pace when there are no samples. null when the outing is too short.
 */
export function fastestWindowSec(activity: GpsActivity, meters: number): number | null {
  const s = activity.samples;
  if (s && s.length >= 2 && activity.distance >= meters) {
    let best = Infinity;
    let lo = 0;
    for (let hi = 0; hi < s.length; hi++) {
      while (s[hi]!.d - s[lo]!.d >= meters) {
        const dist = s[hi]!.d - s[lo]!.d;
        const time = s[hi]!.t - s[lo]!.t;
        if (dist > 0) best = Math.min(best, time * (meters / dist));
        lo++;
      }
    }
    if (Number.isFinite(best)) return best;
  }
  if (activity.distance >= meters && activity.duration > 0) {
    return activity.duration * (meters / activity.distance);
  }
  return null;
}

/** All-time records recomputed from the full history (SPECS §6.3). */
export function computeRecords(activities: Activity[]): Prs {
  const prs: Prs = {};
  for (const a of activities) {
    if (isGps(a)) {
      const t1 = fastestWindowSec(a, 1000);
      if (t1 !== null && (prs.fastest1k === undefined || t1 < prs.fastest1k)) prs.fastest1k = t1;
      const t5 = fastestWindowSec(a, 5000);
      if (t5 !== null && (prs.fastest5k === undefined || t5 < prs.fastest5k)) prs.fastest5k = t5;
      if (prs.longestRun === undefined || a.distance > prs.longestRun) prs.longestRun = a.distance;
    } else {
      if (prs.bestPullSession === undefined || a.total > prs.bestPullSession) {
        prs.bestPullSession = a.total;
      }
      const bestSet = Math.max(0, ...a.sets);
      if (prs.bestPullSet === undefined || bestSet > prs.bestPullSet) prs.bestPullSet = bestSet;
    }
  }
  return prs;
}
