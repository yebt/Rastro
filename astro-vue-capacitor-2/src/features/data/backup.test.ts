import { beforeEach, describe, expect, it } from "vitest";
import type { ExerciseActivity } from "../tracking";
import { activityRepository } from "../tracking";
import {
  applyBackup,
  type BackupPayload,
  buildBackup,
  parseBackup,
  serializeBackup,
} from "./backup";

function exercise(id: string): ExerciseActivity {
  return {
    id,
    schemaVersion: 1,
    kind: "exercise",
    exercise: "dominadas",
    startedAt: 1000,
    endedAt: 1000,
    sets: [{ reps: 10 }],
  };
}

function payload(over: Partial<BackupPayload> = {}): BackupPayload {
  return {
    app: "rastro",
    version: 1,
    exportedAt: 1_700_000_000_000,
    activities: [],
    routines: [],
    exercises: [],
    profile: { name: "", heightCm: null, weights: [] },
    ...over,
  };
}

describe("backup serialize/parse", () => {
  it("round-trips a payload and builds an FS-safe filename", () => {
    const { json, filename } = serializeBackup(payload({ activities: [exercise("a")] }));
    expect(filename).toMatch(/^rastro-\d{4}-\d{2}-\d{2}T[\d-]+\.json$/);
    expect(filename).not.toContain(":");
    const back = parseBackup(json);
    expect(back.activities).toHaveLength(1);
    expect(back.app).toBe("rastro");
  });

  it("rejects a file that isn't a Rastro backup", () => {
    expect(() => parseBackup(JSON.stringify({ app: "otra", activities: [] }))).toThrow();
    expect(() => parseBackup("{not json")).toThrow();
  });

  it("tolerates missing optional sections", () => {
    const b = parseBackup(JSON.stringify({ app: "rastro", activities: [] }));
    expect(b.routines).toEqual([]);
    expect(b.exercises).toEqual([]);
    expect(b.profile.name).toBe("");
  });
});

describe("applyBackup", () => {
  beforeEach(async () => {
    await activityRepository().clear();
  });

  it("replace wipes then restores the backup's activities", async () => {
    await activityRepository().save(exercise("old"));
    const res = await applyBackup(payload({ activities: [exercise("x"), exercise("y")] }), "replace");
    expect(res.added).toBe(2);
    const ids = (await activityRepository().list()).map((a) => a.id).sort();
    expect(ids).toEqual(["x", "y"]);
  });

  it("merge keeps existing and adds only new activities (dedup by id)", async () => {
    await activityRepository().save(exercise("keep"));
    const res = await applyBackup(payload({ activities: [exercise("keep"), exercise("new")] }), "merge");
    expect(res.added).toBe(1);
    const ids = (await activityRepository().list()).map((a) => a.id).sort();
    expect(ids).toEqual(["keep", "new"]);
  });
});

describe("buildBackup", () => {
  it("captures current activities with a stamp", async () => {
    await activityRepository().clear();
    await activityRepository().save(exercise("z"));
    const b = await buildBackup(1234);
    expect(b.app).toBe("rastro");
    expect(b.exportedAt).toBe(1234);
    expect(b.activities.map((a) => a.id)).toContain("z");
  });
});
