/** Persistence composition root: pick the right adapter for the environment. */

import { Capacitor } from "@capacitor/core";
import { IndexedDBAdapter } from "./indexeddb";
import { MemoryAdapter } from "./memory";
import { SqliteAdapter } from "./sqlite";
import type { ActivityRepository } from "./repository";

export type { ActivityRepository } from "./repository";
export { IndexedDBAdapter } from "./indexeddb";
export { MemoryAdapter } from "./memory";
export { SqliteAdapter } from "./sqlite";

/**
 * Return the default repository for the current runtime.
 * Native (Capacitor) → SQLite; browser → IndexedDB; otherwise → in-memory.
 */
export function createRepository(): ActivityRepository {
  if (Capacitor.isNativePlatform()) return new SqliteAdapter();
  if (typeof indexedDB !== "undefined") return new IndexedDBAdapter();
  return new MemoryAdapter();
}
