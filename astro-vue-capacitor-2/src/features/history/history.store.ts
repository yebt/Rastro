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

let inflight: Promise<void> | null = null;
let queued: Promise<void> | null = null;

async function readActivities(): Promise<void> {
  // Hide in-progress drafts (autosaved, endedAt null) from history — they
  // belong to the recovery flow, not the finished-activity list.
  const all = await activityRepository().list();
  $activities.set(all.filter((a) => a.endedAt !== null));
  $loaded.set(true);
}

/**
 * (Re)load the finished activities, coalescing bursts: several screens ask at
 * startup and each read pulls every activity with all its GPS points. A call
 * made while a read is running gets ONE follow-up read after it (shared by
 * every caller in the meantime) — never the in-flight one, which may predate a
 * write (e.g. a delete) the caller just made.
 */
export function loadActivities(): Promise<void> {
  if (!inflight) {
    inflight = readActivities().finally(() => {
      inflight = null;
    });
    return inflight;
  }
  queued ??= inflight
    .catch(() => {})
    .then(() => {
      queued = null;
      return loadActivities();
    });
  return queued;
}

export async function deleteActivity(id: string): Promise<void> {
  await activityRepository().remove(id);
  await loadActivities();
}
