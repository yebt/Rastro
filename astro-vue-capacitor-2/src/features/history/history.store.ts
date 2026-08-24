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
  // Hide in-progress drafts (autosaved, endedAt null) from history — they belong
  // to the recovery flow, not the finished-activity list.
  const all = await activityRepository().list();
  $activities.set(all.filter((a) => a.endedAt !== null));
  $loaded.set(true);
}

export async function deleteActivity(id: string): Promise<void> {
  await activityRepository().remove(id);
  await loadActivities();
}
