/**
 * Gallery of previously shared cards. Each generated PNG is persisted (as a data
 * URL) with the activity and theme it came from, so the Compartir view can show
 * a history the user can re-share or delete. Fully offline: IndexedDB when
 * available, an in-memory list otherwise (SSR / tests).
 */

import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import { newId } from "../tracking";

export interface SharedImage {
  id: string;
  activityId: string;
  /** `${layoutId}:${paletteId}` — see themeKey() in themes.ts. */
  themeKey: string;
  dataUrl: string;
  createdAt: number;
}

export interface GalleryStore {
  add(record: Omit<SharedImage, "id">): Promise<SharedImage>;
  list(): Promise<SharedImage[]>;
  remove(id: string): Promise<void>;
}

const DB_NAME = "rastro-shares";
const DB_VERSION = 1;
const STORE = "shares";

interface SharesDB extends DBSchema {
  shares: {
    key: string;
    value: SharedImage;
    indexes: { "by-createdAt": number };
  };
}

let dbPromise: Promise<IDBPDatabase<SharesDB>> | null = null;

function db(): Promise<IDBPDatabase<SharesDB>> {
  dbPromise ??= openDB<SharesDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      const store = database.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("by-createdAt", "createdAt");
    },
  });
  return dbPromise;
}

function createIdbGallery(): GalleryStore {
  return {
    async add(record) {
      const full: SharedImage = { ...record, id: newId() };
      await (await db()).put(STORE, full);
      return full;
    },
    async list() {
      const rows = await (await db()).getAllFromIndex(STORE, "by-createdAt");
      return rows.toReversed(); // newest first
    },
    async remove(id) {
      await (await db()).delete(STORE, id);
    },
  };
}

function createMemoryGallery(): GalleryStore {
  const rows: SharedImage[] = [];
  return {
    async add(record) {
      const full: SharedImage = { ...record, id: newId() };
      rows.push(full);
      return full;
    },
    async list() {
      return [...rows].sort((a, b) => b.createdAt - a.createdAt);
    },
    async remove(id) {
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) rows.splice(i, 1);
    },
  };
}

let instance: GalleryStore | null = null;

export function shareGallery(): GalleryStore {
  instance ??= typeof indexedDB === "undefined" ? createMemoryGallery() : createIdbGallery();
  return instance;
}
