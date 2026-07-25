/**
 * First-run gate. Once the user finishes (or skips) the setup screen, the app
 * never shows it again unless storage is cleared.
 */

import { atom } from "nanostores";

const KEY = "rastro.setupDone";

function read(): boolean {
  try {
    return globalThis.localStorage?.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export const $setupDone = atom<boolean>(read());

export function completeSetup(): void {
  $setupDone.set(true);
  try {
    globalThis.localStorage?.setItem(KEY, "1");
  } catch {
    // ignore — private mode / SSR
  }
}
