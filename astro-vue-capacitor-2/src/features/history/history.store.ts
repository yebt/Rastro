/**
 * Saved activities, loaded from the repository into a reactive store so Home and
 * the detail view read the same list. The recorder persists straight to the
 * repo; call loadActivities() when a history surface mounts to pick up the
 * latest (and after a delete).
 */

import { atom } from "nanostores";
import type { Activity } from "../tracking";
import { activityRepository } from "../tracking";

export const $activities = atom<Activity[]>([]);
export const $loaded = atom<boolean>(false);

export async function loadActivities(): Promise<void> {
  $activities.set(await activityRepository().list());
  $loaded.set(true);
}

export async function deleteActivity(id: string): Promise<void> {
  await activityRepository().remove(id);
  await loadActivities();
}
