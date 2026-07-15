import { describe, expect, it } from "vitest";
import { evaluatePoint } from "./track";
import type { RoutePoint } from "./types";

const at = (lat: number, lng: number, t: number): RoutePoint => ({ lat, lng, t });

describe("evaluatePoint", () => {
  it("rejects low-accuracy readings before anything else", () => {
    expect(evaluatePoint(null, at(4.65, -74.08, 0), 41)).toEqual({ kind: "reject-accuracy" });
  });

  it("marks the first fix", () => {
    expect(evaluatePoint(null, at(4.65, -74.08, 0), 10)).toEqual({ kind: "first" });
  });

  it("ignores jitter below the minimum segment", () => {
    const last = at(4.65, -74.08, 0);
    // ~0.5 m away
    const next = at(4.650004, -74.08, 1000);
    expect(evaluatePoint(last, next, 10).kind).toBe("jitter");
  });

  it("flags unrealistic jumps without counting distance", () => {
    const last = at(4.65, -74.08, 0);
    const next = at(4.651, -74.08, 1000); // ~111 m
    const d = evaluatePoint(last, next, 10);
    expect(d.kind).toBe("jump");
  });

  it("accepts valid movement and computes speed", () => {
    const last = at(4.65, -74.08, 0);
    const next = at(4.6501, -74.08, 1000); // ~11 m in 1 s
    const d = evaluatePoint(last, next, 10);
    expect(d.kind).toBe("move");
    if (d.kind === "move") {
      expect(d.meters).toBeGreaterThan(2);
      expect(d.meters).toBeLessThan(60);
      expect(d.speedKmh).toBeGreaterThan(0);
    }
  });
});
