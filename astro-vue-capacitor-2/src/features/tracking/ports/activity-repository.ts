/**
 * Persistence port (hexagonal architecture).
 *
 * The app depends on this interface, never on a concrete storage engine.
 * IndexedDB today, SQLite tomorrow, in-memory in tests — all behind the same
 * contract, so swapping the engine never touches feature code.
 *
 * Every read returns records already migrated to the current schema; callers
 * always get the current shape.
 */

import type { Activity } from "../domain/activity";

export interface ActivityRepository {
  /** Insert or replace an activity by id. */
  save(activity: Activity): Promise<void>;
  /** Fetch one activity, or null if absent. */
  get(id: string): Promise<Activity | null>;
  /** All activities, newest first (by startedAt). */
  list(): Promise<Activity[]>;
  /** Remove one activity; no-op if absent. */
  remove(id: string): Promise<void>;
  /** Remove every activity. */
  clear(): Promise<void>;
}
