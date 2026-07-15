/** In-memory ActivityRepository — for unit tests and SSR fallback. */

import type { Activity } from "../lib/types";
import type { ActivityRepository } from "./repository";

export class MemoryAdapter implements ActivityRepository {
  private items = new Map<string, Activity>();

  constructor(seed: Activity[] = []) {
    for (const a of seed) this.items.set(a.id, a);
  }

  async all(): Promise<Activity[]> {
    return [...this.items.values()];
  }

  async add(activity: Activity): Promise<void> {
    this.items.set(activity.id, activity);
  }

  async remove(id: string): Promise<void> {
    this.items.delete(id);
  }

  async replaceAll(activities: Activity[]): Promise<void> {
    this.items = new Map(activities.map((a) => [a.id, a]));
  }

  async clear(): Promise<void> {
    this.items.clear();
  }
}
