/**
 * Human-language insights about a single route — where you pushed, where you
 * faded, your fastest/slowest km, your peak. Built from the same pure analytics
 * as the charts, so it degrades cleanly when there isn't enough data.
 */

import { elevationStats, halfSplit, movementSeries, splits } from "./analytics";
import type { TrackPoint } from "./track-point";

function fmtPace(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}'${String(s).padStart(2, "0")}"`;
}

export function routeInsights(points: TrackPoint[]): string[] {
  const out: string[] = [];

  const sp = splits(points).filter((s) => s.paceSecPerKm != null && s.distanceM >= 900);
  if (sp.length >= 2) {
    const fast = sp.reduce((m, s) => (s.paceSecPerKm! < m.paceSecPerKm! ? s : m));
    const slow = sp.reduce((m, s) => (s.paceSecPerKm! > m.paceSecPerKm! ? s : m));
    out.push(`Tu km más rápido fue el K${fast.index}, a ${fmtPace(fast.paceSecPerKm)}/km.`);
    if (slow.index !== fast.index) {
      out.push(`El más lento, el K${slow.index}, a ${fmtPace(slow.paceSecPerKm)}/km.`);
    }
    let bestDrop = 0;
    let dropIdx = -1;
    for (let i = 1; i < sp.length; i++) {
      const d = sp[i - 1]!.paceSecPerKm! - sp[i]!.paceSecPerKm!;
      if (d > bestDrop) {
        bestDrop = d;
        dropIdx = i;
      }
    }
    if (dropIdx > 0 && bestDrop >= 10) {
      out.push(`Apretaste en el K${sp[dropIdx]!.index}: bajaste ${Math.round(bestDrop)} s respecto al anterior.`);
    }
  }

  const half = halfSplit(points);
  if (half.kind === "negative") out.push("Cerraste más fuerte de lo que arrancaste — ritmo negativo.");
  else if (half.kind === "positive") out.push("Aflojaste en la segunda mitad.");

  const moving = movementSeries(points, 30).filter((s) => s.mps > 0);
  if (moving.length) {
    const peak = moving.reduce((m, s) => (s.mps > m.mps ? s : m));
    out.push(`Tu pico de velocidad (${(peak.mps * 3.6).toFixed(1)} km/h) fue cerca del minuto ${Math.round(peak.tMs / 60_000)}.`);
  }

  const el = elevationStats(points);
  if (el.gainM >= 20) out.push(`Acumulaste +${Math.round(el.gainM)} m de subida.`);

  return out;
}
