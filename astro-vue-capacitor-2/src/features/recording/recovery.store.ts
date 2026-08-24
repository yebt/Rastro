/**
 * Session recovery — surfaces an autosaved, still-in-progress move left behind
 * when the app was killed mid-recording (crash, battery, force-close), so the
 * user never silently loses what they already tracked.
 *
 * On launch, `checkForDraft()` looks for a persisted move with `endedAt === null`
 * (the recorder autosaves these as it records). If one exists, `$draft` is set and
 * the UI offers three exits: resume it, save it as is, or discard it.
 */

import { atom } from "nanostores";
import { activityRepository, finalizeInProgress, type MoveActivity } from "../tracking";
import { recorder } from "./singleton";

/** The recovered in-progress session awaiting the user's decision, or null. */
export const $draft = atom<MoveActivity | null>(null);

/** Look for an autosaved, unfinished move from a previous run. */
export async function checkForDraft(): Promise<void> {
  // Don't surface a draft while a session is live (e.g. right after resuming one).
  if (recorder.$status.get() !== "idle") return;
  const all = await activityRepository().list();
  const draft = all.find((a): a is MoveActivity => a.kind === "move" && a.endedAt === null) ?? null;
  $draft.set(draft);
}

/** Re-open the draft and keep recording where it left off. */
export async function resumeDraft(): Promise<void> {
  const d = $draft.get();
  if (!d) return;
  $draft.set(null);
  await recorder.restore(d);
}

/** Close the draft out as a finished (incomplete) activity and keep it in history. */
export async function saveDraft(): Promise<void> {
  const d = $draft.get();
  if (!d) return;
  $draft.set(null);
  await activityRepository().save(finalizeInProgress(d, Date.now()));
}

/** Throw the draft away — it never reaches history. */
export async function discardDraft(): Promise<void> {
  const d = $draft.get();
  if (!d) return;
  $draft.set(null);
  await activityRepository().remove(d.id);
}
