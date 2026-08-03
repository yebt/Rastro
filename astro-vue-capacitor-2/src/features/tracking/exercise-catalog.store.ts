/**
 * The editable exercise catalog, persisted locally (local-first, no account).
 * Seeded with a single exercise on first run; the user adds, renames and
 * removes entries. Routines reference exercises by id, so removals warn when the
 * exercise is still in use — see routinesUsing().
 */

import { atom } from "nanostores";
import { DEFAULT_EXERCISES, type ExerciseDef, slugifyExercise } from "./domain/exercises";
import type { Routine } from "./domain/routine";
import { $routines } from "./routines.store";

const KEY = "rastro.exercises";

function read(): ExerciseDef[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed as ExerciseDef[];
  } catch {
    // ignore — private mode / SSR
  }
  return [...DEFAULT_EXERCISES];
}

function persist(list: ExerciseDef[]): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export const $exercises = atom<ExerciseDef[]>(read());

function set(list: ExerciseDef[]): void {
  $exercises.set(list);
  persist(list);
}

/** Reactive label lookup, falling back to the id for unknown/old ids. */
export function exerciseLabel(id: string): string {
  return $exercises.get().find((e) => e.id === id)?.label ?? id;
}

/**
 * Add an exercise from a free-text label. Returns the new entry, or null if the
 * label is empty or collides with an existing id (e.g. a duplicate name).
 */
export function addExercise(label: string): ExerciseDef | null {
  const trimmed = label.trim();
  const id = slugifyExercise(trimmed);
  if (!id) return null;
  const list = $exercises.get();
  if (list.some((e) => e.id === id)) return null;
  const def: ExerciseDef = { id, label: trimmed };
  set([...list, def]);
  return def;
}

/** Rename an exercise (keeps its id, so routines/history stay linked). */
export function renameExercise(id: string, label: string): void {
  const trimmed = label.trim();
  if (!trimmed) return;
  set($exercises.get().map((e) => (e.id === id ? { ...e, label: trimmed } : e)));
}

export function removeExercise(id: string): void {
  set($exercises.get().filter((e) => e.id !== id));
}

/** Routines that still reference this exercise — used to warn before removal. */
export function routinesUsing(id: string): Routine[] {
  return $routines.get().filter((r) => r.exercises.some((e) => e.exerciseId === id));
}
