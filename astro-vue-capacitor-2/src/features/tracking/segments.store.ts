/**
 * Saved segments, persisted locally (local-first, no account).
 */

import { atom } from "nanostores";
import type { Segment } from "./domain/segment";

const KEY = "rastro.segments";

function read(): Segment[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Segment[]) : [];
  } catch {
    return [];
  }
}

function persist(list: Segment[]): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore — private mode / SSR
  }
}

export const $segments = atom<Segment[]>(read());

export function saveSegment(segment: Segment): void {
  const next = [...$segments.get(), segment];
  $segments.set(next);
  persist(next);
}

export function deleteSegment(id: string): void {
  const next = $segments.get().filter((s) => s.id !== id);
  $segments.set(next);
  persist(next);
}
