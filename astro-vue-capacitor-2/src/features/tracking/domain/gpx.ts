/**
 * Export a movement activity as GPX 1.1 — the universal track format, so a route
 * recorded here can be opened in Strava, Garmin, or any mapping tool. Pure and
 * testable: the track is split into segments at pauses (one <trkseg> each), with
 * elevation and timestamps where present.
 */

import type { MoveActivity } from "./activity";
import { routeSegments } from "./segments";

function esc(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c,
  );
}

export function toGpx(act: MoveActivity): string {
  const iso = (t: number): string => new Date(t).toISOString();
  const segs = routeSegments(act.points)
    .map((seg) => {
      const pts = seg
        .map((p) => {
          const ele = p.alt != null ? `<ele>${p.alt.toFixed(1)}</ele>` : "";
          return `<trkpt lat="${p.lat.toFixed(6)}" lon="${p.lng.toFixed(6)}">${ele}<time>${iso(p.t)}</time></trkpt>`;
        })
        .join("");
      return `<trkseg>${pts}</trkseg>`;
    })
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<gpx version="1.1" creator="Rastro" xmlns="http://www.topografix.com/GPX/1/1">` +
    `<trk><name>${esc(act.type)} ${iso(act.startedAt)}</name>${segs}</trk></gpx>`
  );
}
