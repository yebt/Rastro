/** Current pull-up session (draft) + derived all-time stats. */

import { atom, computed } from "nanostores";
import { genId } from "../lib/id";
import { pullStats, sessionTotal } from "../lib/pullups";
import { isDominadas } from "../lib/types";
import { $activities, addActivity } from "./activities";
import { showToast } from "./ui";

export const $repCount = atom<number>(8);
export const $curSets = atom<number[]>([]);

/** Live total of the draft session. */
export const $sessTotal = computed($curSets, (sets) => sessionTotal(sets));

/** All-time pull-up stat card, recomputed whenever activities change. */
export const $pullStats = computed($activities, (acts) => pullStats(acts.filter(isDominadas)));

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
  await addActivity({
    id: genId("p"),
    kind: "dominadas",
    type: "dominadas",
    date: Date.now(),
    sets: [...sets],
    total,
  });
  $curSets.set([]);
  showToast(`Sesión guardada · ${total} dominadas`);
}
