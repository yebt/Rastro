/**
 * Configurable live-recording metrics. The live panel has six slots; each one
 * shows a metric from this catalog, chosen by tapping it. The layout is global
 * and persisted, so it sticks across sessions.
 */

import { atom } from "nanostores";
import { avgPaceSecPerKm, avgSpeedMps, distanceMeters, elevationGainM, hasElevation } from "./domain/metrics";
import type { TrackPoint } from "./domain/track-point";
import { distanceParts, formatPace, formatSpeed } from "./ui/format";

export const METERS_PER_MILE = 1609.344;
/** Window for the "current pace" — long enough to smooth GPS jitter. */
const CURRENT_WINDOW_MS = 60_000;

export interface LiveContext {
  /** Filtered track points (what the map draws). */
  points: TrackPoint[];
  /** Raw fix count, before filtering. */
  rawCount: number;
  steps: number;
  /** Steps per minute. */
  cadence: number;
}

export interface MetricValue {
  value: string;
  unit: string;
}

export type LiveMetricId =
  | "distance"
  | "distanceMi"
  | "pace"
  | "paceMi"
  | "paceNow"
  | "speed"
  | "speedMph"
  | "steps"
  | "cadence"
  | "stride"
  | "elevation"
  | "points";

interface LiveMetric {
  id: LiveMetricId;
  /** Name in the picker. */
  label: string;
  compute: (ctx: LiveContext) => MetricValue;
}

/** Points within the last `ms` of the track (for "current" metrics). */
function tail(points: TrackPoint[], ms: number): TrackPoint[] {
  const last = points.at(-1);
  if (!last) return [];
  return points.filter((p) => p.t >= last.t - ms);
}

export const LIVE_METRICS: LiveMetric[] = [
  { id: "distance", label: "Distancia (km)", compute: (c) => distanceParts(distanceMeters(c.points)) },
  {
    id: "distanceMi",
    label: "Distancia (mi)",
    compute: (c) => ({ value: (distanceMeters(c.points) / METERS_PER_MILE).toFixed(2), unit: "mi" }),
  },
  { id: "pace", label: "Ritmo medio /km", compute: (c) => ({ value: formatPace(avgPaceSecPerKm(c.points)), unit: "/km" }) },
  {
    id: "paceMi",
    label: "Ritmo medio /mi",
    compute: (c) => {
      const perKm = avgPaceSecPerKm(c.points);
      return { value: formatPace(perKm === null ? null : perKm * (METERS_PER_MILE / 1000)), unit: "/mi" };
    },
  },
  {
    id: "paceNow",
    label: "Ritmo actual /km",
    compute: (c) => ({ value: formatPace(avgPaceSecPerKm(tail(c.points, CURRENT_WINDOW_MS))), unit: "/km ahora" }),
  },
  { id: "speed", label: "Velocidad (km/h)", compute: (c) => ({ value: formatSpeed(avgSpeedMps(c.points)), unit: "km/h" }) },
  {
    id: "speedMph",
    label: "Velocidad (mph)",
    compute: (c) => ({ value: ((avgSpeedMps(c.points) * 3600) / METERS_PER_MILE).toFixed(1), unit: "mph" }),
  },
  { id: "steps", label: "Pasos", compute: (c) => ({ value: String(c.steps), unit: "pasos" }) },
  { id: "cadence", label: "Cadencia", compute: (c) => ({ value: String(c.cadence), unit: "p/min" }) },
  {
    id: "stride",
    label: "Zancada",
    compute: (c) => {
      const m = distanceMeters(c.points);
      return { value: c.steps > 0 && m > 0 ? (m / c.steps).toFixed(2) : "—", unit: "m/paso" };
    },
  },
  {
    id: "elevation",
    label: "Desnivel +",
    compute: (c) => ({
      value: hasElevation(c.points) ? `+${Math.round(elevationGainM(c.points))}` : "—",
      unit: "m",
    }),
  },
  { id: "points", label: "Puntos GPS", compute: (c) => ({ value: String(c.rawCount), unit: "puntos" }) },
];

const BY_ID = new Map(LIVE_METRICS.map((m) => [m.id, m]));

export function computeMetric(id: LiveMetricId, ctx: LiveContext): MetricValue {
  return (BY_ID.get(id) ?? BY_ID.get("distance")!).compute(ctx);
}

export const DEFAULT_LIVE_METRICS: LiveMetricId[] = ["distance", "pace", "speed", "steps", "cadence", "points"];

const KEY = "rastro.liveMetrics";

function read(): LiveMetricId[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : null;
    if (
      Array.isArray(ids) &&
      ids.length === DEFAULT_LIVE_METRICS.length &&
      ids.every((id) => BY_ID.has(id as LiveMetricId))
    ) {
      return ids as LiveMetricId[];
    }
  } catch {
    // fall through to the default
  }
  return [...DEFAULT_LIVE_METRICS];
}

export const $liveMetrics = atom<LiveMetricId[]>(read());

/** Put metric `id` in slot `slot` and persist the layout. */
export function setLiveMetric(slot: number, id: LiveMetricId): void {
  const next = [...$liveMetrics.get()];
  if (slot < 0 || slot >= next.length || !BY_ID.has(id)) return;
  next[slot] = id;
  $liveMetrics.set(next);
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore — private mode / SSR
  }
}

export function resetLiveMetrics(): void {
  $liveMetrics.set([...DEFAULT_LIVE_METRICS]);
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    // ignore
  }
}
