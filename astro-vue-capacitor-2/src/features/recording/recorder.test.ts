import { beforeEach, describe, expect, it } from "vitest";
import { createFakeGeolocation, type FakeGeolocation, type GeoSample } from "../geolocation";
import { createFakePedometer, type FakePedometer } from "../motion";
import { createMemoryRepository } from "../tracking/adapters/memory-repository";
import type { ActivityRepository, MoveActivity } from "../tracking";
import { createRecorder, type Recorder } from "./recorder";

function sample(t: number, n = 0): GeoSample {
  return { t, lat: -34.6 + n * 0.001, lng: -58.4, alt: null, acc: 5, altAcc: null, spd: null };
}

let geo: FakeGeolocation;
let repo: ActivityRepository;
let ped: FakePedometer;
let clock: number;
let rec: Recorder;

beforeEach(() => {
  geo = createFakeGeolocation();
  geo.setEnabled(false); // off by default so the start-seed one-shot is a no-op
  repo = createMemoryRepository();
  ped = createFakePedometer();
  clock = 0;
  rec = createRecorder({ geo, repo, pedometer: ped, now: () => clock });
});

describe("recorder", () => {
  it("starts a recording and opens the GPS watch", async () => {
    await rec.start("jog");
    expect(rec.$status.get()).toBe("recording");
    expect(rec.$activity.get()?.type).toBe("jog");
    expect(geo.isWatching()).toBe(true);
  });

  it("seeds a first point from a one-shot fix on start", async () => {
    geo.setEnabled(true); // getCurrentPosition now returns a fix
    await rec.start("walk");
    await new Promise((r) => setTimeout(r, 0)); // let the async seed resolve
    expect(rec.$activity.get()?.points).toHaveLength(1);
  });

  it("appends each fix as a point", async () => {
    await rec.start("run");
    geo.emit(sample(1000, 0));
    geo.emit(sample(2000, 1));
    expect(rec.$activity.get()?.points).toHaveLength(2);
  });

  it("stops sampling while paused and resumes after", async () => {
    await rec.start("walk");
    geo.emit(sample(1000));
    await rec.pause();
    expect(rec.$status.get()).toBe("paused");
    expect(geo.isWatching()).toBe(false);

    await rec.resume();
    expect(geo.isWatching()).toBe(true);
    geo.emit(sample(3000, 1));
    expect(rec.$activity.get()?.points).toHaveLength(2);
  });

  it("excludes paused time from elapsed", async () => {
    clock = 0;
    await rec.start("jog");
    clock = 5000;
    expect(rec.elapsedMs()).toBe(5000);

    await rec.pause(); // banks 5000
    clock = 8000;
    expect(rec.elapsedMs()).toBe(5000); // frozen while paused

    await rec.resume();
    clock = 10_000;
    expect(rec.elapsedMs()).toBe(7000); // 5000 + 2000
  });

  it("finish stamps the end time and persists", async () => {
    clock = 0;
    await rec.start("run");
    geo.emit(sample(1000));
    clock = 6000;

    const done = await rec.finish();
    expect(done?.endedAt).toBe(6000);
    expect(rec.$status.get()).toBe("finished");

    const saved = await repo.get(done!.id);
    expect(saved?.kind).toBe("move");
    expect((saved as MoveActivity).points).toHaveLength(1);
  });

  it("stores the pedometer step total on finish", async () => {
    await rec.start("run");
    ped.emit(1234);
    const done = await rec.finish();
    expect(done?.steps).toBe(1234);
    expect(((await repo.get(done!.id)) as MoveActivity).steps).toBe(1234);
  });

  it("requestFinish ends at the finish instant despite a slow confirm", async () => {
    clock = 0;
    await rec.start("run");
    clock = 5000;
    rec.requestFinish(); // finish instant = 5000
    clock = 20_000; // user takes a while to confirm
    const done = await rec.finish();
    expect(done?.endedAt).toBe(5000);
    expect(done?.movingMs).toBe(5000);
  });

  it("cancelFinish (keep going) loses no time and counts no pause", async () => {
    clock = 0;
    await rec.start("jog");
    clock = 4000;
    rec.requestFinish();
    clock = 6000;
    rec.cancelFinish(); // kept going — the 4000–6000 confirm window must survive
    clock = 9000;
    const done = await rec.finish();
    expect(done?.endedAt).toBe(9000);
    expect(done?.movingMs).toBe(9000); // nothing lost
    expect(done?.pauses).toBe(0);
  });

  it("finish drops fixes captured after the finish instant", async () => {
    clock = 0;
    await rec.start("run");
    geo.emit(sample(1000));
    geo.emit(sample(2000, 1));
    clock = 2500;
    rec.requestFinish(); // instant = 2500
    geo.emit(sample(3000, 2)); // arrives while the confirm is open — after the instant
    const done = await rec.finish();
    expect((done as MoveActivity).points.map((p) => p.t)).toEqual([1000, 2000]);
  });

  it("counts pauses and stores the total on finish", async () => {
    await rec.start("jog");
    await rec.pause();
    await rec.resume();
    await rec.pause();
    await rec.resume();
    const done = await rec.finish();
    expect(done?.pauses).toBe(2);
  });

  it("discard drops the session and deletes its autosaved draft", async () => {
    await rec.start("jog");
    geo.emit(sample(1000));
    const act = rec.$activity.get()!;
    expect(await repo.get(act.id)).not.toBeNull(); // autosaved on the first fix

    await rec.discard();
    expect(rec.$status.get()).toBe("idle");
    expect(rec.$activity.get()).toBeNull();
    expect(await repo.get(act.id)).toBeNull();
  });

  it("autosaves the in-progress session on the first fix (endedAt still null)", async () => {
    await rec.start("run");
    geo.emit(sample(1000));
    const draft = (await repo.get(rec.$activity.get()!.id)) as MoveActivity;
    expect(draft).not.toBeNull();
    expect(draft.endedAt).toBeNull();
    expect(draft.points).toHaveLength(1);
  });

  it("throttles autosave, then persists again past the interval", async () => {
    clock = 0;
    rec = createRecorder({ geo, repo, pedometer: ped, now: () => clock, autosaveMs: 5000 });
    await rec.start("run");
    geo.emit(sample(0)); // first fix → saved immediately
    const id = rec.$activity.get()!.id;

    clock = 1000;
    geo.emit(sample(1000, 1)); // within the throttle window → not persisted yet
    expect(((await repo.get(id)) as MoveActivity).points).toHaveLength(1);

    clock = 6000;
    geo.emit(sample(6000, 2)); // past the interval → persisted with all points
    expect(((await repo.get(id)) as MoveActivity).points).toHaveLength(3);
  });

  it("finish replaces the in-progress draft with the finished record (same id)", async () => {
    clock = 0;
    await rec.start("run");
    geo.emit(sample(1000));
    const id = rec.$activity.get()!.id;
    expect(((await repo.get(id)) as MoveActivity).endedAt).toBeNull(); // draft

    clock = 6000;
    await rec.finish();
    const saved = (await repo.get(id)) as MoveActivity;
    expect(saved.endedAt).toBe(6000); // same record, now finalized
  });

  it("restore re-opens a saved draft and keeps recording", async () => {
    // A draft as it would be read back after a crash: points, endedAt null.
    clock = 0;
    await rec.start("jog");
    geo.emit(sample(1000)); // saved immediately (first fix)
    clock = 6000;
    geo.emit(sample(2000, 1)); // past the throttle → draft now has both points
    const draft = (await repo.get(rec.$activity.get()!.id)) as MoveActivity;
    expect(draft.points).toHaveLength(2);
    await rec.discard(); // simulate app restart: recorder idle, draft gone from state

    const fresh = createRecorder({ geo, repo, pedometer: ped, now: () => clock });
    await fresh.restore(draft);
    expect(fresh.$status.get()).toBe("recording");
    expect(fresh.$activity.get()?.id).toBe(draft.id);
    expect(fresh.$activity.get()?.points).toHaveLength(2);

    geo.emit(sample(3000, 2)); // keeps appending on top of the recovered points
    expect(fresh.$activity.get()?.points).toHaveLength(3);
    clock = 7000; // so finish()'s end instant is past the last fix
    const done = await fresh.finish();
    expect(done?.id).toBe(draft.id);
    expect((done as MoveActivity).points).toHaveLength(3);
  });

  it("flush persists the current in-progress session on demand", async () => {
    clock = 0;
    rec = createRecorder({ geo, repo, pedometer: ped, now: () => clock, autosaveMs: 999_999 });
    await rec.start("walk");
    geo.emit(sample(0));
    geo.emit(sample(1000, 1)); // throttled away by the huge interval
    const id = rec.$activity.get()!.id;
    expect(((await repo.get(id)) as MoveActivity).points).toHaveLength(1);

    await rec.flush();
    expect(((await repo.get(id)) as MoveActivity).points).toHaveLength(2);
  });
});
