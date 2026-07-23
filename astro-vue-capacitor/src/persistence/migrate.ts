/**
 * Schema migration layer (Phase 1).
 *
 * This is the SINGLE entry point applied to every activity that enters the app
 * from persistent storage or an imported backup. Inputs are assumed to be our
 * own activity-shaped objects; migration is pure and defensive, so a stale
 * record is upgraded in place rather than rejected. Bump CURRENT_SCHEMA_VERSION
 * and add a step below whenever the on-disk shape changes.
 */

import { CURRENT_SCHEMA_VERSION, type Activity } from "../lib/types";

/** True for a non-null plain object (the only thing we can migrate). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Upgrade a single stored/imported activity to CURRENT_SCHEMA_VERSION.
 *
 * A record without a numeric `schemaVersion` is legacy v1: it simply lacks the
 * additive `track` / `photos` fields, so no structural change is needed — we
 * only stamp the current version.
 *
 * Upgrades run as a sequential `if (version < N)` ladder rather than a
 * fall-through switch: each guard runs when the record is older than that
 * version, transforms it, and advances `version`, so an old record is upgraded
 * through EVERY intermediate version in order. Add one guard per new version.
 */
export function migrateActivity(raw: unknown): Activity {
  if (!isPlainObject(raw)) return raw as Activity;

  const record = raw as Record<string, unknown>;
  let version = typeof record.schemaVersion === "number" ? record.schemaVersion : 1;

  if (version >= CURRENT_SCHEMA_VERSION) return record as unknown as Activity;

  const migrated: Record<string, unknown> = { ...record };

  if (version < 2) {
    // v1 -> v2: additive only (track/photos are optional), no structural change.
    version = 2;
  }
  if (version < 3) {
    // v2 -> v3: the single "dominadas" kind became the generic "exercise" model.
    if (migrated.kind === "dominadas") {
      migrated.kind = "exercise";
      migrated.exercise = "dominadas";
      delete migrated.type;
    }
    version = 3;
  }
  // Future: if (version < 4) { ...transform migrated...; version = 4; }

  // Stamp whatever version the ladder reached (equals CURRENT once complete).
  migrated.schemaVersion = version;
  return migrated as unknown as Activity;
}

/**
 * Migrate a list of stored/imported activities, dropping any entry that is not
 * a usable object (malformed rows never crash a load or import).
 */
export function migrateAll(list: unknown[]): Activity[] {
  return list.filter(isPlainObject).map((item) => migrateActivity(item));
}
