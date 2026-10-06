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

/**
 * Id of the session in progress, kept in localStorage so launch can fetch the
 * draft with ONE `get(id)` instead of reading every activity (with all its GPS
 * points). "" = known to be none; absent = unknown (first launch of this
 * version) → one full scan, then the key is kept current.
 */
const DRAFT_KEY = "rastro.draftId";

function readDraftId(): string | null {
  try {
    return globalThis.localStorage?.getItem(DRAFT_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeDraftId(id: string): void {
  try {
    globalThis.localStorage?.setItem(DRAFT_KEY, id);
  } catch {
    // ignore — private mode
  }
}

// Track the live session's id. Only TRANSITIONS clear it: the initial "idle" at
// launch must not wipe the id of a draft the app was killed with.
let lastStatus = recorder.$status.get();
recorder.$status.subscribe((status) => {
  const active = status === "recording" || status === "paused";
  const id = recorder.$activity.get()?.id;
  if (active && id) writeDraftId(id);
  else if (lastStatus === "recording" || lastStatus === "paused") writeDraftId("");
  lastStatus = status;
});

function isDraft(a: unknown): a is MoveActivity {
  return !!a && (a as MoveActivity).kind === "move" && (a as MoveActivity).endedAt === null;
}

/** Look for an autosaved, unfinished move from a previous run. */
export async function checkForDraft(): Promise<void> {
  // Don't surface a draft while a session is live (e.g. right after resuming one).
  if (recorder.$status.get() !== "idle") return;
  const id = readDraftId();
  let draft: MoveActivity | null = null;
  if (id === null) {
    // Unknown (older version left no key): scan once, then remember.
    const all = await activityRepository().list();
    draft = all.find(isDraft) ?? null;
  } else if (id !== "") {
    const found = await activityRepository().get(id);
    draft = isDraft(found) ? found : null;
  }
  writeDraftId(draft?.id ?? "");
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
  writeDraftId("");
  await activityRepository().save(finalizeInProgress(d, Date.now()));
}

/** Throw the draft away — it never reaches history. */
export async function discardDraft(): Promise<void> {
  const d = $draft.get();
  if (!d) return;
  $draft.set(null);
  writeDraftId("");
  await activityRepository().remove(d.id);
}
