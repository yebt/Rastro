/**
 * The activity aggregate — the top-level unit Rastro records and stores.
 *
 * A discriminated union on `kind` keeps two very different things under one
 * repository: GPS movement (walk/jog/run) and exercises (dominadas, burpees…).
 * Exercises are an open string on purpose — new ones are data, not code — which
 * is what makes routines possible later without a schema change.
 *
 * Only raw, captured data lives here. Distance, pace, elevation gain and every
 * other metric are DERIVED from `points`, never stored, so rethinking the
 * metrics never means migrating records.
 */

import { CURRENT_SCHEMA_VERSION } from "./schema";
import type { TrackPoint } from "./track-point";

export type ActivityKind = "move" | "exercise" | "routine";

/** Movement modes, mapped to the Spanish UI: caminar / trotar / correr. */
export type MoveType = "walk" | "jog" | "run";

interface BaseActivity {
  id: string;
  schemaVersion: number;
  /** When recording started, epoch ms. */
  startedAt: number;
  /** When it finished, epoch ms — null while still in progress. */
  endedAt: number | null;
}

export interface MoveActivity extends BaseActivity {
  kind: "move";
  type: MoveType;
  points: TrackPoint[];
  /** Step count for the session; absent on older records. */
  steps?: number;
  /** Moving time in ms (excludes pauses); absent on older records. */
  movingMs?: number;
  /** How many times the recording was paused; absent on older records. */
  pauses?: number;
}

export interface ExerciseSet {
  reps: number;
}

export interface ExerciseActivity extends BaseActivity {
  kind: "exercise";
  /** Exercise id, e.g. 'dominadas'. Open by design — extensible without a migration. */
  exercise: string;
  sets: ExerciseSet[];
}

/** One completed exercise within a routine run (one entry per exercise per round). */
export interface RoutineEntry {
  exerciseId: string;
  reps: number;
}

/** A completed guided run of a routine template (see routine-run.ts). */
export interface RoutineActivity extends BaseActivity {
  kind: "routine";
  /** The template this run came from (may no longer exist). */
  routineId: string;
  name: string;
  rounds: number;
  entries: RoutineEntry[];
}

export type Activity = MoveActivity | ExerciseActivity | RoutineActivity;

/** Cryptographically-random id; available in browsers, Capacitor and Node. */
export function newId(): string {
  return crypto.randomUUID();
}

/** Start a fresh, in-progress movement activity (no points yet). */
export function startMove(type: MoveType, startedAt: number): MoveActivity {
  return {
    id: newId(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    kind: "move",
    type,
    startedAt,
    endedAt: null,
    points: [],
  };
}

/** Start a fresh, in-progress exercise activity (no sets yet). */
export function startExercise(exercise: string, startedAt: number): ExerciseActivity {
  return {
    id: newId(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    kind: "exercise",
    exercise,
    startedAt,
    endedAt: null,
    sets: [],
  };
}
