/**
 * The exercise catalog model. Exercise ids are open strings (new ones are data,
 * not code), so the catalog is user-editable and persisted — see the
 * exercise-catalog store. The app seeds a single exercise; the user grows it.
 */

import type { Activity } from "./activity";

export interface ExerciseDef {
  id: string;
  label: string;
}

/** Seed catalog on first run: just dominadas. The user adds the rest. */
export const DEFAULT_EXERCISES: ExerciseDef[] = [{ id: "dominadas", label: "Dominadas" }];

/** Derive a stable id from a label ("Flexiones de pecho" → "flexiones-de-pecho"). */
export function slugifyExercise(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Resolve a label from a catalog, falling back to the id (unknown/old data). */
export function exerciseLabelIn(catalog: ExerciseDef[], id: string): string {
  return catalog.find((e) => e.id === id)?.label ?? id;
}

/** Total reps across an exercise activity's sets. */
export function totalReps(sets: { reps: number }[]): number {
  return sets.reduce((sum, s) => sum + s.reps, 0);
}

export interface ExerciseStats {
  allTime: number;
  today: number;
  bestSession: number;
  bestSet: number;
}

/** Historical stats for one exercise, from saved activities (local time). */
export function exerciseStats(
  activities: Activity[],
  exerciseId: string,
  now: number,
): ExerciseStats {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  const stats: ExerciseStats = { allTime: 0, today: 0, bestSession: 0, bestSet: 0 };
  for (const a of activities) {
    if (a.kind !== "exercise" || a.exercise !== exerciseId) continue;
    const session = totalReps(a.sets);
    stats.allTime += session;
    if (a.startedAt >= todayMs) stats.today += session;
    if (session > stats.bestSession) stats.bestSession = session;
    for (const s of a.sets) if (s.reps > stats.bestSet) stats.bestSet = s.reps;
  }
  return stats;
}
