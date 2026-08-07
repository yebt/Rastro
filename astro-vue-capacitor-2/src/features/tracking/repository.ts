/**
 * Composition point: picks the concrete repository for the current environment.
 *
 * IndexedDB when the platform provides it (browser / Capacitor WebView),
 * in-memory otherwise (SSR / tests without a DB). Features import the interface
 * from here and stay ignorant of which engine backs it.
 */

import { createIdbRepository } from "./adapters/idb-repository";
import { createMemoryRepository } from "./adapters/memory-repository";
import type { ActivityRepository } from "./ports/activity-repository";

let instance: ActivityRepository | null = null;

export function activityRepository(): ActivityRepository {
  instance ??= typeof indexedDB === "undefined" ? createMemoryRepository() : createIdbRepository();
  return instance;
}
