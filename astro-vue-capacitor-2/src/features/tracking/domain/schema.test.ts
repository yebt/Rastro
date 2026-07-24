import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION, migrate } from "./schema";

describe("migrate", () => {
  it("stamps an unversioned record to the current version", () => {
    const out = migrate({ id: "a", kind: "move", startedAt: 1, endedAt: null, points: [] });
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("leaves a current-version record unchanged (idempotent)", () => {
    const record = {
      id: "a",
      schemaVersion: CURRENT_SCHEMA_VERSION,
      kind: "move" as const,
      type: "jog" as const,
      startedAt: 1,
      endedAt: 2,
      points: [],
    };
    expect(migrate(record)).toEqual(record);
  });

  it("does not mutate the input record", () => {
    const record = { id: "a", kind: "move", startedAt: 1, endedAt: null, points: [] };
    migrate(record);
    expect("schemaVersion" in record).toBe(false);
  });
});
