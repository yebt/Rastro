/**
 * Routine templates — circuits of exercises. AGREED MODEL (locked with the user):
 * reps only for now (no timed exercises), and "vuelta = serie" — one pass through
 * every exercise is a round, repeated `rounds` times, with rest between exercises
 * and between rounds. Templates are reusable; running one is a separate flow.
 */

import { newId } from "./activity";

export interface RoutineExercise {
  exerciseId: string;
  /** Target repetitions per round. */
  reps: number;
}

export interface Routine {
  id: string;
  name: string;
  /** Rounds of the whole circuit (vueltas). */
  rounds: number;
  restBetweenExercisesSec: number;
  restBetweenRoundsSec: number;
  exercises: RoutineExercise[];
}

export function newRoutine(): Routine {
  return {
    id: newId(),
    name: "",
    rounds: 3,
    restBetweenExercisesSec: 30,
    restBetweenRoundsSec: 60,
    exercises: [],
  };
}

/** Total reps a full run of the routine adds up to (rounds × per-round reps). */
export function routineTotalReps(r: Routine): number {
  return r.rounds * r.exercises.reduce((sum, e) => sum + e.reps, 0);
}
