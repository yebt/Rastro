/**
 * Saved routine templates, persisted locally (local-first, no account).
 */

import { atom } from "nanostores";
import type { Routine } from "./domain/routine";

const KEY = "rastro.routines";

function read(): Routine[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Routine[]) : [];
  } catch {
    return [];
  }
}

function persist(list: Routine[]): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore — private mode / SSR
  }
}

export const $routines = atom<Routine[]>(read());

/** Insert or replace a routine by id. */
export function saveRoutine(routine: Routine): void {
  const list = $routines.get();
  const exists = list.some((r) => r.id === routine.id);
  const next = exists ? list.map((r) => (r.id === routine.id ? routine : r)) : [...list, routine];
  $routines.set(next);
  persist(next);
}

/** Replace the whole routine list (used by backup import). */
export function setRoutines(list: Routine[]): void {
  $routines.set(list);
  persist(list);
}

export function deleteRoutine(id: string): void {
  const next = $routines.get().filter((r) => r.id !== id);
  $routines.set(next);
  persist(next);
}

export function getRoutine(id: string): Routine | undefined {
  return $routines.get().find((r) => r.id === id);
}
