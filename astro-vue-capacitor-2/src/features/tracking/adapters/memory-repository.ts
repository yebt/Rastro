/**
 * In-memory ActivityRepository.
 *
 * Used by tests and as a safe fallback where IndexedDB is unavailable (SSR).
 * Deep-clones on the way in and out so callers can't mutate stored state by
 * reference, matching the isolation a real storage engine gives.
 */

import type { Activity } from "../domain/activity";
import { migrate } from "../domain/schema";
import type { ActivityRepository } from "../ports/activity-repository";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createMemoryRepository(): ActivityRepository {
  const store = new Map<string, Activity>();

  return {
    async save(activity) {
      store.set(activity.id, clone(activity));
    },
    async get(id) {
      const found = store.get(id);
      return found ? migrate(clone(found)) : null;
    },
    async list() {
      return [...store.values()]
        .map((a) => migrate(clone(a)))
        .toSorted((a, b) => b.startedAt - a.startedAt);
    },
    async remove(id) {
      store.delete(id);
    },
    async clear() {
      store.clear();
    },
  };
}
