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

  it("discard drops the session without saving", async () => {
    await rec.start("jog");
    geo.emit(sample(1000));
    const act = rec.$activity.get()!;

    await rec.discard();
    expect(rec.$status.get()).toBe("idle");
    expect(rec.$activity.get()).toBeNull();
    expect(await repo.get(act.id)).toBeNull();
  });
});
