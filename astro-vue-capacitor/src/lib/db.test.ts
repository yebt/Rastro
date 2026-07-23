import { describe, expect, it } from "vitest";
import { extractActivities, mergeActivities, summarize } from "./db";
import type { Activity } from "./types";

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
  kind: "exercise",
  exercise: "dominadas",
  date: 1_720_000_000_000,
  sets: [total],
  total,
});

describe("extractActivities", () => {
  it("unwraps the exported payload", () => {
    expect(extractActivities({ app: "Rastro", activities: [gps("a1", 1000)] })).toHaveLength(1);
  });
  it("accepts a bare array", () => {
    expect(extractActivities([gps("a1", 1000)])).toHaveLength(1);
  });
  it("throws on invalid shapes", () => {
    expect(() => extractActivities({ foo: "bar" })).toThrow();
    expect(() => extractActivities("nope")).toThrow();
  });
});

describe("mergeActivities", () => {
  it("merges de-duplicating by id", () => {
    const current = [gps("a1", 1000)];
    const incoming = [gps("a1", 1000), pull("p1", 20)];
    const result = mergeActivities(current, incoming, "merge");
    expect(result.added).toBe(1);
    expect(result.activities).toHaveLength(2);
  });
  it("replaces existing data", () => {
    const current = [gps("a1", 1000)];
    const incoming = [pull("p1", 20)];
    const result = mergeActivities(current, incoming, "replace");
    expect(result.added).toBe(1);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]?.id).toBe("p1");
  });
  it("skips items without an id", () => {
    const incoming = [{ ...gps("", 1000), id: "" }];
    const result = mergeActivities([], incoming, "merge");
    expect(result.added).toBe(0);
  });
});

describe("summarize", () => {
  it("totals count, km and exercise reps", () => {
    const acts = [gps("a1", 5230), gps("a2", 2770), pull("p1", 26), pull("p2", 14)];
    const s = summarize(acts);
    expect(s.count).toBe(4);
    expect(s.km).toBeCloseTo(8, 5);
    expect(s.reps).toBe(40);
  });
});
