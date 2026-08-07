import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { type Activity, startMove } from "../domain/activity";
import { CURRENT_SCHEMA_VERSION } from "../domain/schema";
import type { ActivityRepository } from "../ports/activity-repository";
import { createIdbRepository } from "./idb-repository";
import { createMemoryRepository } from "./memory-repository";

// Both adapters must satisfy the same contract — run every case against each.
const adapters = [
  { name: "memory", make: createMemoryRepository },
  { name: "idb", make: createIdbRepository },
];

describe.each(adapters)("ActivityRepository: $name", ({ make }) => {
  let repo: ActivityRepository;

  beforeEach(async () => {
    repo = make();
    await repo.clear();
  });

  it("saves and reads back an activity", async () => {
    const act = startMove("jog", 1000);
    await repo.save(act);
    expect(await repo.get(act.id)).toEqual(act);
  });

  it("returns null for an unknown id", async () => {
    expect(await repo.get("nope")).toBeNull();
  });

  it("lists activities newest first", async () => {
    await repo.save(startMove("walk", 1000));
    await repo.save(startMove("run", 3000));
    await repo.save(startMove("jog", 2000));

    const times = (await repo.list()).map((a) => a.startedAt);
    expect(times).toEqual([3000, 2000, 1000]);
  });

  it("removes an activity", async () => {
    const act = startMove("jog", 1000);
    await repo.save(act);
    await repo.remove(act.id);
    expect(await repo.get(act.id)).toBeNull();
  });

  it("clears every activity", async () => {
    await repo.save(startMove("jog", 1000));
    await repo.save(startMove("run", 2000));
    await repo.clear();
    expect(await repo.list()).toEqual([]);
  });

  it("migrates a legacy record on read", async () => {
    // A record persisted before versioning existed (no schemaVersion).
    const legacy = {
      id: "legacy-1",
      kind: "move",
      type: "jog",
      startedAt: 500,
      endedAt: 800,
      points: [],
    } as unknown as Activity;
    await repo.save(legacy);

    const read = await repo.get("legacy-1");
    expect(read?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});
