/**
 * Expand a routine template into the linear sequence of steps a guided player
 * walks through. AGREED MODEL: "vuelta = serie" — one pass through every exercise
 * is a round, repeated `rounds` times, with a timed rest between exercises and a
 * (longer) timed rest between rounds. Zero-second rests are omitted, and there is
 * never a trailing rest after the very last exercise.
 *
 * Pure data: the UI drives the clock, this only says what comes next.
 */

import { newId, type RoutineActivity, type RoutineEntry } from "./activity";
import type { Routine } from "./routine";
import { CURRENT_SCHEMA_VERSION } from "./schema";

export type RunStep =
  | {
      kind: "exercise";
      exerciseId: string;
      reps: number;
      /** 1-based round this exercise belongs to. */
      round: number;
      rounds: number;
      /** 1-based position of this exercise within the round. */
      position: number;
      /** Exercises per round. */
      perRound: number;
    }
  | {
      kind: "rest";
      seconds: number;
      /** Rest between exercises within a round, or between whole rounds. */
      scope: "exercise" | "round";
      /** Round the upcoming exercise belongs to. */
      nextRound: number;
      rounds: number;
    };

/** Flatten a routine into ordered steps for the player. */
export function buildRun(routine: Routine): RunStep[] {
  const steps: RunStep[] = [];
  const perRound = routine.exercises.length;
  if (perRound === 0 || routine.rounds < 1) return steps;

  for (let r = 1; r <= routine.rounds; r++) {
    routine.exercises.forEach((ex, i) => {
      steps.push({
        kind: "exercise",
        exerciseId: ex.exerciseId,
        reps: ex.reps,
        round: r,
        rounds: routine.rounds,
        position: i + 1,
        perRound,
      });
      const lastInRound = i === perRound - 1;
      if (!lastInRound && routine.restBetweenExercisesSec > 0) {
        steps.push({
          kind: "rest",
          seconds: routine.restBetweenExercisesSec,
          scope: "exercise",
          nextRound: r,
          rounds: routine.rounds,
        });
      }
    });

    const lastRound = r === routine.rounds;
    if (!lastRound && routine.restBetweenRoundsSec > 0) {
      steps.push({
        kind: "rest",
        seconds: routine.restBetweenRoundsSec,
        scope: "round",
        nextRound: r + 1,
        rounds: routine.rounds,
      });
    }
  }
  return steps;
}

/** Number of exercise steps — the denominator for progress. */
export function exerciseStepCount(steps: RunStep[]): number {
  return steps.reduce((n, s) => (s.kind === "exercise" ? n + 1 : n), 0);
}

/** How many exercise steps are at or before `index` (1-based progress). */
export function exercisesDone(steps: RunStep[], index: number): number {
  let n = 0;
  for (let i = 0; i < index && i < steps.length; i++) {
    if (steps[i]!.kind === "exercise") n++;
  }
  return n;
}

/** The completed exercise steps as routine entries (target reps, in order). */
export function entriesFrom(steps: RunStep[]): RoutineEntry[] {
  return steps.flatMap((s) =>
    s.kind === "exercise" ? [{ exerciseId: s.exerciseId, reps: s.reps }] : [],
  );
}

/** Total reps across a routine session's entries. */
export function routineEntriesReps(entries: RoutineEntry[]): number {
  return entries.reduce((sum, e) => sum + e.reps, 0);
}

/** Build the persisted activity for a completed routine run. */
export function routineActivity(
  routine: Routine,
  entries: RoutineEntry[],
  startedAt: number,
  endedAt: number,
): RoutineActivity {
  return {
    id: newId(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    kind: "routine",
    startedAt,
    endedAt,
    routineId: routine.id,
    name: routine.name,
    rounds: routine.rounds,
    entries,
  };
}
