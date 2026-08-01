/**
 * The exercise catalog. Exercise ids are open strings in the model (new ones are
 * data, not code), but the app ships a known set with Spanish labels.
 */

import type { Activity } from "./activity";

export interface ExerciseDef {
  id: string;
  label: string;
}

export const EXERCISES: ExerciseDef[] = [
  { id: "dominadas", label: "Dominadas" },
  { id: "flexiones", label: "Flexiones" },
  { id: "abdominales", label: "Abdominales" },
  { id: "burpees", label: "Burpees" },
];

export function exerciseLabel(id: string): string {
  return EXERCISES.find((e) => e.id === id)?.label ?? id;
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
