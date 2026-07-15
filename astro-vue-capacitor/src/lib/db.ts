/**
 * Local database helpers: import parsing, merge, and summaries.
 * Pure logic only — persistence (localStorage) lives in the store layer.
 * SPECS §4.4 / §13: never lose data on a malformed import; validate before writing.
 */

import { isDominadas, isGps, type Activity, type Database } from "./types";

export type ImportMode = "merge" | "replace";

export interface MergeResult {
  activities: Activity[];
  added: number;
}

/**
 * Pull the activities array out of an unknown imported payload.
 * Accepts both the wrapped export (`{ activities: [...] }`) and a bare array.
 * Throws if the shape is not an array — caller shows an error, data untouched.
 */
export function extractActivities(data: unknown): Activity[] {
  const incoming =
    data && typeof data === "object" && "activities" in data
      ? (data as { activities: unknown }).activities
      : data;
  if (!Array.isArray(incoming)) throw new Error("invalid import format");
  return incoming as Activity[];
}

/**
 * Merge incoming activities into the current set, de-duplicating by id.
 * `replace` starts from an empty base; `merge` keeps existing.
 * Items without an id are skipped here — the IO boundary assigns ids first.
 */
export function mergeActivities(
  current: Activity[],
  incoming: Activity[],
  mode: ImportMode,
): MergeResult {
  const base = mode === "replace" ? [] : current.slice();
  const seen = new Set(base.map((a) => a.id));
  let added = 0;
  for (const a of incoming) {
    if (!a || !a.id || seen.has(a.id)) continue;
    base.push(a);
    seen.add(a.id);
    added++;
  }
  return { activities: base, added };
}

export interface DataSummary {
  count: number;
  /** total km across GPS activities */
  km: number;
  /** total pull-up reps */
  pullups: number;
}

/** Saved-data summary shown in the Datos tab (SPECS §4.4). */
export function summarize(activities: Activity[]): DataSummary {
  let meters = 0;
  let pullups = 0;
  for (const a of activities) {
    if (isGps(a)) meters += a.distance || 0;
    else if (isDominadas(a)) pullups += a.total || 0;
  }
  return { count: activities.length, km: meters / 1000, pullups };
}

export const EMPTY_DB: Database = { activities: [] };
