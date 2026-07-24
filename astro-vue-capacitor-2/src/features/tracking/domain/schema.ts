/**
 * Persisted-record versioning.
 *
 * Every stored Activity carries a `schemaVersion`. On read, `migrate()` walks a
 * SEQUENTIAL ladder — one `if (version < N)` step per version, each upgrading
 * the record by exactly one step and advancing `version`. This is deliberately
 * NOT a fall-through `switch`: with a switch, a record two versions behind can
 * silently skip an intermediate step yet still get stamped current. The ladder
 * guarantees every step runs, in order, for every old record.
 *
 * Bump CURRENT_SCHEMA_VERSION and add the next `if (version < N)` block whenever
 * the stored shape changes.
 */

import type { Activity } from "./activity";

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Upgrade a persisted record to the current schema. Input is `unknown` on
 * purpose: a record read from storage is untrusted until this function has
 * walked it up to the current shape. Idempotent for current-version records.
 */
export function migrate(record: unknown): Activity {
  const draft = { ...(record as Record<string, unknown>) };
  let version = typeof draft.schemaVersion === "number" ? draft.schemaVersion : 0;

  if (version < 1) {
    // v0 → v1: first versioned shape. No structural change; just stamp it.
    version = 1;
  }
  // Future steps go here, each advancing exactly one version:
  // if (version < 2) { /* transform draft */ version = 2; }

  draft.schemaVersion = version;
  return draft as unknown as Activity;
}
