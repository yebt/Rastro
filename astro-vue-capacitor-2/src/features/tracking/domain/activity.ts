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

export type ActivityKind = "move" | "exercise";

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
  /** Accelerometer step count for the session; absent on older records. */
  steps?: number;
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

export type Activity = MoveActivity | ExerciseActivity;

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
