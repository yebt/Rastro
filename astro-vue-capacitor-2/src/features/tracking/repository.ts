/**
 * Composition point: picks the concrete repository for the current environment.
 *
 * IndexedDB when the platform provides it (browser / Capacitor WebView),
 * in-memory otherwise (SSR / tests without a DB). Features import the interface
 * from here and stay ignorant of which engine backs it.
 */

import { createIdbRepository } from "./adapters/idb-repository";
import { createMemoryRepository } from "./adapters/memory-repository";
import { withOrderedPoints } from "./domain/order";
import type { ActivityRepository } from "./ports/activity-repository";

let instance: ActivityRepository | null = null;

/**
 * Reads come back with tracks in time order, so activities recorded before the
 * recorder kept points ordered (late GPS backlog appended out of order) display
 * and compute correctly without rewriting stored data.
 */
function ordered(repo: ActivityRepository): ActivityRepository {
  return {
    ...repo,
    get: async (id) => {
      const a = await repo.get(id);
      return a && withOrderedPoints(a);
    },
    list: async () => (await repo.list()).map(withOrderedPoints),
  };
}

export function activityRepository(): ActivityRepository {
  instance ??= ordered(typeof indexedDB === "undefined" ? createMemoryRepository() : createIdbRepository());
  return instance;
}
