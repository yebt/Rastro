/**
 * Month grid for the activity calendar — pure, so the day math is testable.
 * Monday-first weeks, each day carrying how many activities fell on it (local
 * time). `month` is 0-indexed, matching Date.
 */

import type { Activity } from "../tracking";

export interface CalDay {
  day: number;
  active: boolean;
  count: number;
}

export interface CalMonth {
  /** Rows of 7 cells; leading/trailing padding cells are null. */
  weeks: (CalDay | null)[][];
}

function dayCounts(activities: Activity[], year: number, month: number): Map<number, number> {
  const counts = new Map<number, number>();
  for (const a of activities) {
    const d = new Date(a.startedAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      counts.set(d.getDate(), (counts.get(d.getDate()) ?? 0) + 1);
    }
  }
  return counts;
}

export function buildMonth(year: number, month: number, activities: Activity[]): CalMonth {
  const counts = dayCounts(activities, year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0

  const cells: (CalDay | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const count = counts.get(day) ?? 0;
    cells.push({ day, active: count > 0, count });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (CalDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return { weeks };
}
