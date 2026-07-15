/**
 * Activities store (nanostores).
 *
 * Single source of truth for all saved activities. Talks to the persistence
 * port only — never to a storage engine directly. Computation is delegated to
 * the pure lib, so this layer just orchestrates repo I/O + reactive state.
 */

import { atom, computed } from "nanostores";
import { extractActivities, mergeActivities, summarize, type ImportMode } from "../lib/db";
import { genId } from "../lib/id";
import type { Activity } from "../lib/types";
import { createRepository, type ActivityRepository } from "../persistence";

let repo: ActivityRepository = createRepository();

/** Swap the repository (dependency injection for tests / native adapter). */
export function configureRepository(next: ActivityRepository): void {
  repo = next;
}

export const $activities = atom<Activity[]>([]);
export const $ready = atom<boolean>(false);

/** Saved-data summary (count / km / pull-ups) for the Datos tab. */
export const $summary = computed($activities, (acts) => summarize(acts));

/** Load everything from storage into the store. Call once on app mount. */
export async function loadActivities(): Promise<void> {
  $activities.set(await repo.all());
  $ready.set(true);
}

export async function addActivity(activity: Activity): Promise<void> {
  await repo.add(activity);
  $activities.set([...$activities.get(), activity]);
}

export async function removeActivity(id: string): Promise<void> {
  await repo.remove(id);
  $activities.set($activities.get().filter((a) => a.id !== id));
}

/**
 * Import a parsed JSON payload. Validates before writing (SPECS §13): a bad
 * payload throws in `extractActivities` and the store is left untouched.
 * Returns how many new activities were added.
 */
export async function importActivities(data: unknown, mode: ImportMode): Promise<number> {
  // Assign ids to id-less items so a hand-made file never silently drops rows.
  const incoming = extractActivities(data).map((a) => (a && a.id ? a : { ...a, id: genId("i") }));
  const { activities, added } = mergeActivities($activities.get(), incoming, mode);
  await repo.replaceAll(activities);
  $activities.set(activities);
  return added;
}

export async function clearAllActivities(): Promise<void> {
  await repo.clear();
  $activities.set([]);
}
