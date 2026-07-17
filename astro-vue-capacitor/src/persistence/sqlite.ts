/**
 * SQLite ActivityRepository (Capacitor native, F7 / SPECS §3).
 *
 * Same port as the IndexedDB adapter — the app and stores don't change; only
 * the storage engine does. Each activity is one row (id + JSON blob); the pure
 * lib still does all computation in memory, so this layer just persists/loads.
 */

import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import type { Activity } from "../lib/types";
import type { ActivityRepository } from "./repository";

const DB_NAME = "rastro";

interface Row {
  data: string;
}

export class SqliteAdapter implements ActivityRepository {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private dbPromise: Promise<SQLiteDBConnection> = this.init();

  private async init(): Promise<SQLiteDBConnection> {
    // Reuse an existing connection if one is already open (hot reload / re-import).
    let consistent = false;
    try {
      consistent = (await this.sqlite.checkConnectionsConsistency()).result ?? false;
    } catch {
      consistent = false;
    }
    const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result ?? false;

    const db =
      consistent && isConn
        ? await this.sqlite.retrieveConnection(DB_NAME, false)
        : await this.sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);

    await db.open();
    await db.execute(
      `CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY NOT NULL,
        date INTEGER,
        kind TEXT,
        data TEXT NOT NULL
      );`,
    );
    return db;
  }

  async all(): Promise<Activity[]> {
    const db = await this.dbPromise;
    const res = await db.query("SELECT data FROM activities ORDER BY date DESC;");
    return ((res.values as Row[] | undefined) ?? []).map((r) => JSON.parse(r.data) as Activity);
  }

  async add(activity: Activity): Promise<void> {
    const db = await this.dbPromise;
    await db.run("INSERT OR REPLACE INTO activities (id, date, kind, data) VALUES (?, ?, ?, ?);", [
      activity.id,
      activity.date,
      activity.kind,
      JSON.stringify(activity),
    ]);
  }

  async remove(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.run("DELETE FROM activities WHERE id = ?;", [id]);
  }

  async replaceAll(activities: Activity[]): Promise<void> {
    const db = await this.dbPromise;
    await db.execute("DELETE FROM activities;");
    if (!activities.length) return;
    await db.executeSet(
      activities.map((a) => ({
        statement: "INSERT OR REPLACE INTO activities (id, date, kind, data) VALUES (?, ?, ?, ?);",
        values: [a.id, a.date, a.kind, JSON.stringify(a)],
      })),
    );
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    await db.execute("DELETE FROM activities;");
  }
}
