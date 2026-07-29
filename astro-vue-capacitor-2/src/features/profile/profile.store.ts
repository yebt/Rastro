/**
 * Local user profile — name, nickname, height, and weight as an append-only log.
 *
 * Weight is a list of dated measurements, not a single number, on purpose: the
 * point is to re-weigh over time and see the change. Everything lives in
 * localStorage (local-first, no account) and is read synchronously so the UI
 * never waits on it.
 */

import { atom } from "nanostores";

const NAME_KEY = "rastro.name";
/** Legacy key — folded into NAME_KEY on load (identity is one field now). */
const LEGACY_NICK_KEY = "rastro.nickname";
const HEIGHT_KEY = "rastro.heightCm";
const WEIGHTS_KEY = "rastro.weights";

/** One dated weight measurement. */
export interface WeightEntry {
  /** Measured at, epoch ms. */
  t: number;
  /** Kilograms. */
  kg: number;
}

function read(key: string): string {
  try {
    return globalThis.localStorage?.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, value);
  } catch {
    // ignore — private mode / SSR
  }
}

/**
 * The name, migrating a legacy nickname the first time it's read. Older installs
 * stored the identity under `rastro.nickname`; there's only one field now, so we
 * fold that value into NAME_KEY once and drop the old key.
 */
function readName(): string {
  const name = read(NAME_KEY);
  if (name) return name;
  const legacy = read(LEGACY_NICK_KEY);
  if (legacy) {
    write(NAME_KEY, legacy);
    write(LEGACY_NICK_KEY, null);
    return legacy;
  }
  return "";
}

function readHeight(): number | null {
  const raw = read(HEIGHT_KEY);
  const n = Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? n : null;
}

function readWeights(): WeightEntry[] {
  try {
    const raw = globalThis.localStorage?.getItem(WEIGHTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WeightEntry[]) : [];
  } catch {
    return [];
  }
}

export const $name = atom<string>(readName());
export const $heightCm = atom<number | null>(readHeight());
export const $weights = atom<WeightEntry[]>(readWeights());

export function setName(name: string): void {
  $name.set(name);
  write(NAME_KEY, name || null);
}

export function setHeight(cm: number | null): void {
  $heightCm.set(cm);
  write(HEIGHT_KEY, cm === null ? null : String(cm));
}

/** Append a weight measurement; the log stays sorted oldest-first by time. */
export function addWeight(kg: number, t: number): void {
  const next = [...$weights.get(), { t, kg }].toSorted((a, b) => a.t - b.t);
  $weights.set(next);
  write(WEIGHTS_KEY, JSON.stringify(next));
}

/** Correct a logged measurement, matched by its timestamp. No-op if kg invalid. */
export function updateWeight(t: number, kg: number): void {
  if (!Number.isFinite(kg) || kg <= 0) return;
  const next = $weights.get().map((w) => (w.t === t ? { t, kg } : w));
  $weights.set(next);
  write(WEIGHTS_KEY, JSON.stringify(next));
}

/** Remove a logged measurement by its timestamp. */
export function removeWeight(t: number): void {
  const next = $weights.get().filter((w) => w.t !== t);
  $weights.set(next);
  write(WEIGHTS_KEY, JSON.stringify(next));
}

/** Most recent measured weight, or null if none logged yet. */
export function latestWeight(): number | null {
  const list = $weights.get();
  return list.length ? list[list.length - 1]!.kg : null;
}
