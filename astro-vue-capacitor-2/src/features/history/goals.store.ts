/**
 * Personal goals, persisted locally: a weekly distance target and a daily reps
 * target. 0 means the goal is off. Home shows progress; settings edits them.
 */

import { atom } from "nanostores";

export interface Goals {
  /** Weekly distance goal in km (0 = off). */
  kmWeekly: number;
  /** Daily reps goal (0 = off). */
  repsDaily: number;
}

const KEY = "rastro.goals";
const DEFAULT: Goals = { kmWeekly: 0, repsDaily: 0 };

function read(): Goals {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Goals>) : {};
    return {
      kmWeekly: Number(parsed.kmWeekly) || 0,
      repsDaily: Number(parsed.repsDaily) || 0,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export const $goals = atom<Goals>(read());

export function setGoals(goals: Goals): void {
  const next: Goals = { kmWeekly: Math.max(0, goals.kmWeekly), repsDaily: Math.max(0, goals.repsDaily) };
  $goals.set(next);
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore — private mode / SSR
  }
}
