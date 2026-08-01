/**
 * The exercise catalog. Exercise ids are open strings in the model (new ones are
 * data, not code), but the app ships a known set with Spanish labels.
 */

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
