import { beforeEach, describe, expect, it } from "vitest";
import { MemoryAdapter } from "../persistence/memory";
import type { Activity } from "../lib/types";
import {
  $activities,
  $summary,
  addActivity,
  clearAllActivities,
  configureRepository,
  importActivities,
  loadActivities,
  removeActivity,
} from "./activities";

const gps = (id: string, distance: number): Activity => ({
  id,
  kind: "gps",
  type: "Trote",
  date: 1_720_000_000_000,
  distance,
  duration: 600,
  route: [],
});

const pull = (id: string, total: number): Activity => ({
  id,
  kind: "dominadas",
  type: "dominadas",
  date: 1_720_000_000_000,
  sets: [total],
  total,
});

beforeEach(async () => {
  configureRepository(new MemoryAdapter());
  $activities.set([]);
  await loadActivities();
});

describe("activities store", () => {
  it("starts empty and ready after load", () => {
    expect($activities.get()).toEqual([]);
  });

  it("adds and persists activities", async () => {
    await addActivity(gps("a1", 1000));
    await addActivity(pull("p1", 20));
    expect($activities.get()).toHaveLength(2);
  });

  it("removes by id", async () => {
    await addActivity(gps("a1", 1000));
    await removeActivity("a1");
    expect($activities.get()).toHaveLength(0);
  });

  it("recomputes the summary reactively", async () => {
    await addActivity(gps("a1", 5000));
    await addActivity(pull("p1", 26));
    expect($summary.get()).toEqual({ count: 2, km: 5, pullups: 26 });
  });

  it("imports (merge) de-duplicating by id", async () => {
    await addActivity(gps("a1", 1000));
    const added = await importActivities(
      { activities: [gps("a1", 1000), pull("p1", 20)] },
      "merge",
    );
    expect(added).toBe(1);
    expect($activities.get()).toHaveLength(2);
  });

  it("imports (replace) wiping existing", async () => {
    await addActivity(gps("a1", 1000));
    const added = await importActivities([pull("p1", 20)], "replace");
    expect(added).toBe(1);
    expect($activities.get()).toHaveLength(1);
    expect($activities.get()[0]?.id).toBe("p1");
  });

  it("leaves state untouched on a malformed import", async () => {
    await addActivity(gps("a1", 1000));
    await expect(importActivities({ garbage: true }, "merge")).rejects.toThrow();
    expect($activities.get()).toHaveLength(1);
  });

  it("clears everything", async () => {
    await addActivity(gps("a1", 1000));
    await clearAllActivities();
    expect($activities.get()).toEqual([]);
  });
});
