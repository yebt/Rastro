import { describe, expect, it } from "vitest";
import { evaluatePoint } from "./track";
import type { RoutePoint } from "./types";

const at = (lat: number, lng: number, t: number): RoutePoint => ({ lat, lng, t });

describe("evaluatePoint — accuracy-aware drift gate", () => {
  const last = at(4.65, -74.08, 0);
  const next = at(4.6501, -74.08, 1000); // ~11 m from last

  it("rejects an ~11m move as jitter when accuracy is poor (noise floor ~15m)", () => {
    expect(evaluatePoint(last, next, 30).kind).toBe("jitter");
  });

  it("accepts the same ~11m move when accuracy is good (noise floor ~4m)", () => {
    expect(evaluatePoint(last, next, 8).kind).toBe("move");
  });

  it("still honors the fixed 2m floor when accuracy is excellent", () => {
    const tiny = at(4.650008, -74.08, 1000); // ~0.9 m
    expect(evaluatePoint(last, tiny, 1).kind).toBe("jitter");
  });
});
