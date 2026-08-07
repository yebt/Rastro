/**
 * IndexedDB ActivityRepository — the default persistence engine.
 *
 * Works the same in the browser PWA and inside the Capacitor WebView, entirely
 * offline. Records are migrated to the current schema on every read, so old
 * data opened by a newer app version is always returned in the current shape.
 */

import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { Activity } from "../domain/activity";
import { migrate } from "../domain/schema";
import type { ActivityRepository } from "../ports/activity-repository";

const DB_NAME = "rastro";
const DB_VERSION = 1;
const STORE = "activities";

interface RastroDB extends DBSchema {
  activities: {
    key: string;
    value: Activity;
    indexes: { "by-startedAt": number };
  };
}

let dbPromise: Promise<IDBPDatabase<RastroDB>> | null = null;

function db(): Promise<IDBPDatabase<RastroDB>> {
  dbPromise ??= openDB<RastroDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      const store = database.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("by-startedAt", "startedAt");
    },
  });
  return dbPromise;
}

export function createIdbRepository(): ActivityRepository {
  return {
    async save(activity) {
      await (await db()).put(STORE, activity);
    },
    async get(id) {
      const found = await (await db()).get(STORE, id);
      return found ? migrate(found) : null;
    },
    async list() {
      // Index gives ascending startedAt; reverse for newest-first.
      const rows = await (await db()).getAllFromIndex(STORE, "by-startedAt");
      return rows.toReversed().map((row) => migrate(row));
    },
    async remove(id) {
      await (await db()).delete(STORE, id);
    },
    async clear() {
      await (await db()).clear(STORE);
    },
  };
}
