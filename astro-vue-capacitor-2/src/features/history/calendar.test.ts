import { describe, expect, it } from "vitest";
import type { Activity, MoveActivity } from "../tracking";
import { buildMonth, type CalDay } from "./calendar";

function act(year: number, month: number, day: number): MoveActivity {
  const t = new Date(year, month, day, 12).getTime(); // local noon — unambiguous day
  return {
    id: `${year}-${month}-${day}-${t}`,
    schemaVersion: 1,
    kind: "move",
    type: "run",
    startedAt: t,
    endedAt: t,
    points: [],
  };
}

describe("buildMonth", () => {
  const acts: Activity[] = [act(2026, 6, 15), act(2026, 6, 15), act(2026, 6, 20)];
  const month = buildMonth(2026, 6, acts); // July 2026

  it("lays out every day of the month in Monday-first weeks", () => {
    const days = month.weeks.flat().filter(Boolean) as CalDay[];
    expect(days.map((d) => d.day)).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
    month.weeks.forEach((w) => expect(w).toHaveLength(7));
  });

  it("marks days with activities and counts them", () => {
    const days = month.weeks.flat().filter(Boolean) as CalDay[];
    expect(days.find((d) => d.day === 15)).toMatchObject({ active: true, count: 2 });
    expect(days.find((d) => d.day === 20)).toMatchObject({ active: true, count: 1 });
    expect(days.find((d) => d.day === 10)).toMatchObject({ active: false, count: 0 });
  });

  it("pads with nulls so weeks align to the weekday of the 1st", () => {
    // July 1 2026 is a Wednesday → Monday-first index 2, so two leading nulls.
    expect(month.weeks[0]!.slice(0, 2)).toEqual([null, null]);
    expect(month.weeks[0]![2]).toMatchObject({ day: 1 });
  });

  it("ignores activities from other months", () => {
    const m = buildMonth(2026, 6, [act(2026, 5, 15), act(2026, 7, 15)]);
    const active = (m.weeks.flat().filter(Boolean) as CalDay[]).filter((d) => d.active);
    expect(active).toHaveLength(0);
  });
});
