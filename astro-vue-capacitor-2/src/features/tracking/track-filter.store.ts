/**
 * Which track-processing method the UI shows. Global + persisted so the choice
 * sticks across the live screen, the review and activity details while testing.
 */

import { atom } from "nanostores";
import type { TrackFilterId } from "./domain/filters";

const KEY = "rastro.trackFilter";

function read(): TrackFilterId {
  try {
    const v = globalThis.localStorage?.getItem(KEY);
    return v === "raw" || v === "kalman" ? v : "drift";
  } catch {
    return "drift";
  }
}

export const $trackFilter = atom<TrackFilterId>(read());

export function setTrackFilter(id: TrackFilterId): void {
  $trackFilter.set(id);
  try {
    globalThis.localStorage?.setItem(KEY, id);
  } catch {
    // ignore — private mode / SSR
  }
}
