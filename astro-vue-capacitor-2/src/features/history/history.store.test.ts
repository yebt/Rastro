import { beforeEach, describe, expect, it, vi } from "vitest";
import { activityRepository, startMove } from "../tracking";
import { $activities, deleteActivity, loadActivities } from "./history.store";

const done = (id: string) => ({ ...startMove("walk", 1000), id, endedAt: 2000 });

beforeEach(async () => {
  await activityRepository().clear();
  $activities.set([]);
});

describe("loadActivities", () => {
  it("coalesces a burst of calls into at most two reads", async () => {
    await activityRepository().save(done("a"));
    const spy = vi.spyOn(activityRepository(), "list");
    await Promise.all([loadActivities(), loadActivities(), loadActivities(), loadActivities()]);
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    expect($activities.get().map((a) => a.id)).toEqual(["a"]);
    spy.mockRestore();
  });

  it("a load requested after a write is never served by an older read", async () => {
    await activityRepository().save(done("a"));
    await activityRepository().save(done("b"));
    const early = loadActivities(); // started before the delete
    await deleteActivity("a");
    await early;
    expect($activities.get().map((a) => a.id)).toEqual(["b"]);
  });
});
