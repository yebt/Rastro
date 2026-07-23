/** Current exercise session (draft) + derived all-time stats. */

import { atom, computed } from "nanostores";
import { exerciseStats, sessionTotal } from "../lib/exercises";
import { genId } from "../lib/id";
import { CURRENT_SCHEMA_VERSION, type ExerciseKind, isExercise } from "../lib/types";
import { $activities, addActivity } from "./activities";
import { showToast } from "./ui";
import { EXERCISE_LABEL } from "../lib/labels";

export const $repCount = atom<number>(8);
export const $curSets = atom<number[]>([]);
/** Which exercise the logging screen is currently capturing. */
export const $curExercise = atom<ExerciseKind>("dominadas");

export function setExercise(exercise: ExerciseKind): void {
  $curExercise.set(exercise);
}

/** Live total of the draft session. */
export const $sessTotal = computed($curSets, (sets) => sessionTotal(sets));

/** All-time stat card for the currently selected exercise, recomputed reactively. */
export const $exerciseStats = computed([$activities, $curExercise], (acts, exercise) =>
  exerciseStats(acts.filter(isExercise), exercise),
);

export function incRep(): void {
  $repCount.set($repCount.get() + 1);
}

export function decRep(): void {
  if ($repCount.get() > 1) $repCount.set($repCount.get() - 1);
}

export function addSet(): void {
  $curSets.set([...$curSets.get(), $repCount.get()]);
}

export function removeSet(index: number): void {
  const next = $curSets.get().slice();
  next.splice(index, 1);
  $curSets.set(next);
}

export async function saveSession(): Promise<void> {
  const sets = $curSets.get();
  if (!sets.length) return;
  const total = sessionTotal(sets);
  const exercise = $curExercise.get();
  await addActivity({
    id: genId("p"),
    kind: "exercise",
    exercise,
    date: Date.now(),
    sets: [...sets],
    total,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  });
  $curSets.set([]);
  showToast(`Sesión guardada · ${total} ${EXERCISE_LABEL[exercise].toLowerCase()}`);
}
