/**
 * Persistence port (hexagonal architecture).
 *
 * The app and stores depend ONLY on this interface, never on a concrete
 * storage engine. Adapters implement it:
 *   - IndexedDBAdapter  → web / PWA parity (current)
 *   - SqliteAdapter     → Capacitor native, Phase 2 (drop-in, SPECS §3)
 *   - MemoryAdapter     → tests / SSR fallback
 *
 * Swapping storage engines means swapping an adapter, not rewriting the app.
 */

import type { Activity } from "../lib/types";

export interface ActivityRepository {
  /** All stored activities (order not guaranteed; callers sort). */
  all(): Promise<Activity[]>;
  /** Insert or overwrite a single activity by id. */
  add(activity: Activity): Promise<void>;
  /** Remove an activity by id (no-op if absent). */
  remove(id: string): Promise<void>;
  /** Replace the entire collection (used by import replace + bulk merge). */
  replaceAll(activities: Activity[]): Promise<void>;
  /** Remove everything (SPECS §4.4 "borrar todo"). */
  clear(): Promise<void>;
}
