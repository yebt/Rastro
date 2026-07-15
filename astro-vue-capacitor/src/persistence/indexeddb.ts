/**
 * IndexedDB ActivityRepository (web / PWA).
 *
 * Async and high-quota — replaces v1's localStorage, which overflowed at ~5MB.
 * The `idb` wrapper keeps this tiny; aggregation stays in the pure lib, so this
 * adapter only persists and loads the collection.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Activity } from "../lib/types";
import type { ActivityRepository } from "./repository";

const DB_NAME = "rastro";
const DB_VERSION = 1;
const STORE = "activities";

interface RastroDB extends DBSchema {
  activities: {
    key: string;
    value: Activity;
    indexes: { "by-date": number };
  };
}

export class IndexedDBAdapter implements ActivityRepository {
  private dbPromise: Promise<IDBPDatabase<RastroDB>>;

  constructor() {
    this.dbPromise = openDB<RastroDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Versioned schema: future migrations bump DB_VERSION and branch here.
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("by-date", "date");
        }
      },
    });
  }

  async all(): Promise<Activity[]> {
    return (await this.dbPromise).getAll(STORE);
  }

  async add(activity: Activity): Promise<void> {
    await (await this.dbPromise).put(STORE, activity);
  }

  async remove(id: string): Promise<void> {
    await (await this.dbPromise).delete(STORE, id);
  }

  async replaceAll(activities: Activity[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE, "readwrite");
    await tx.store.clear();
    // Fire all puts within the same transaction, then wait for it to commit.
    await Promise.all(activities.map((a) => tx.store.put(a)));
    await tx.done;
  }

  async clear(): Promise<void> {
    await (await this.dbPromise).clear(STORE);
  }
}
