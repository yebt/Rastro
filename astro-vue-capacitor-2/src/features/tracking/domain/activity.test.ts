import { describe, expect, it } from "vitest";
import { finalizeInProgress, isInProgress, startMove } from "./activity";
import type { MoveActivity } from "./activity";
import { toTrackPoint } from "./track-point";

function draft(times: number[]): MoveActivity {
  const base = startMove("walk", times[0] ?? 0);
  return { ...base, points: times.map((t) => toTrackPoint({ t, lat: -34.6, lng: -58.4 })) };
}

describe("isInProgress", () => {
  it("is true while endedAt is null", () => {
    expect(isInProgress(startMove("run", 0))).toBe(true);
  });

  it("is false once finalized", () => {
    expect(isInProgress(finalizeInProgress(startMove("run", 0), 10))).toBe(false);
  });
});

describe("finalizeInProgress", () => {
  it("stamps endedAt at the last captured point, not `now`", () => {
    const done = finalizeInProgress(draft([1000, 5000]), 999_999);
    expect(done.endedAt).toBe(5000);
  });

  it("derives movingMs from the point span", () => {
    const done = finalizeInProgress(draft([1000, 5000]), 999_999);
    expect(done.movingMs).toBe(4000);
  });

  it("falls back to `now` and zero moving time when there are no points", () => {
    const done = finalizeInProgress(draft([]), 7777);
    expect(done.endedAt).toBe(7777);
    expect(done.movingMs).toBe(0);
  });

  it("keeps an already-set movingMs instead of overwriting it", () => {
    const d = { ...draft([1000, 5000]), movingMs: 1234 };
    expect(finalizeInProgress(d, 0).movingMs).toBe(1234);
  });

  it("does not mutate the input", () => {
    const d = draft([1000, 5000]);
    finalizeInProgress(d, 0);
    expect(d.endedAt).toBeNull();
  });
});
