/** Persistence composition root: pick the right adapter for the environment. */

import { IndexedDBAdapter } from "./indexeddb";
import { MemoryAdapter } from "./memory";
import type { ActivityRepository } from "./repository";

export type { ActivityRepository } from "./repository";
export { IndexedDBAdapter } from "./indexeddb";
export { MemoryAdapter } from "./memory";

/**
 * Return the default repository for the current runtime.
 * Browser → IndexedDB; anything without it (SSR/build/tests) → in-memory.
 * Phase 2 will branch here to a Capacitor SQLite adapter on native.
 */
export function createRepository(): ActivityRepository {
  if (typeof indexedDB !== "undefined") return new IndexedDBAdapter();
  return new MemoryAdapter();
}
