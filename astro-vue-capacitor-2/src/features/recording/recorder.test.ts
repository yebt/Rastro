import { beforeEach, describe, expect, it } from "vitest";
import { createFakeGeolocation, type FakeGeolocation, type GeoSample } from "../geolocation";
import { createMemoryRepository } from "../tracking/adapters/memory-repository";
import type { ActivityRepository, MoveActivity } from "../tracking";
import { createRecorder, type Recorder } from "./recorder";

function sample(t: number, n = 0): GeoSample {
  return { t, lat: -34.6 + n * 0.001, lng: -58.4, alt: null, acc: 5, altAcc: null, spd: null };
}

let geo: FakeGeolocation;
let repo: ActivityRepository;
let clock: number;
let rec: Recorder;

beforeEach(() => {
  geo = createFakeGeolocation();
  repo = createMemoryRepository();
  clock = 0;
  rec = createRecorder({ geo, repo, now: () => clock });
});

describe("recorder", () => {
  it("starts a recording and opens the GPS watch", async () => {
    await rec.start("jog");
    expect(rec.$status.get()).toBe("recording");
    expect(rec.$activity.get()?.type).toBe("jog");
    expect(geo.isWatching()).toBe(true);
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
