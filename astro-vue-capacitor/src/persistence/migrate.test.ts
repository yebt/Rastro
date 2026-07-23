import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION, type GpsActivity, type TrackPoint } from "../lib/types";
import { migrateActivity, migrateAll } from "./migrate";

const legacyGps = (id: string): Record<string, unknown> => ({
  id,
  kind: "gps",
  type: "Caminata",
  date: 1_720_000_000_000,
  distance: 1234,
  duration: 600,
  route: [[4.65, -74.08]],
});

describe("migrateActivity", () => {
  it("stamps a legacy activity (no schemaVersion) and preserves original fields", () => {
    const raw = legacyGps("a1");
    const migrated = migrateActivity(raw) as GpsActivity;

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.id).toBe("a1");
    expect(migrated.kind).toBe("gps");
    expect(migrated.distance).toBe(1234);
    expect(migrated.duration).toBe(600);
    // Route tuples must survive untouched (renderers depend on them).
    expect(migrated.route).toEqual([[4.65, -74.08]]);
  });

  it("returns an already-current activity unchanged", () => {
    const current = { ...legacyGps("a2"), schemaVersion: CURRENT_SCHEMA_VERSION };
    const migrated = migrateActivity(current);

    expect(migrated).toBe(current);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("preserves a track when present", () => {
    const track: TrackPoint[] = [{ lat: 4.65, lng: -74.08, t: 1_720_000_000_000, alt: 2600, acc: 5 }];
    const raw = { ...legacyGps("a3"), track };
    const migrated = migrateActivity(raw) as GpsActivity;

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.track).toEqual(track);
  });
});

describe("migrateAll", () => {
  it("maps a mixed list and drops non-object garbage entries", () => {
    const list: unknown[] = [
      legacyGps("a1"),
      { ...legacyGps("a2"), schemaVersion: CURRENT_SCHEMA_VERSION },
      null,
      42,
      "nope",
      ["not", "an", "activity"],
    ];

    const migrated = migrateAll(list);

    expect(migrated).toHaveLength(2);
    expect(migrated.map((a) => a.id)).toEqual(["a1", "a2"]);
    expect(migrated.every((a) => a.schemaVersion === CURRENT_SCHEMA_VERSION)).toBe(true);
  });
});
