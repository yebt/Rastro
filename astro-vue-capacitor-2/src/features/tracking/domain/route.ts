/**
 * Project a GPS track into an SVG box — a dependency-free, offline route drawing.
 *
 * Equirectangular projection: longitude is scaled by cos(latitude) so the route
 * keeps its true shape at the scale of a walk/run (degrees of longitude shrink
 * toward the poles). The result is fitted into the box preserving aspect ratio
 * and centered, with the Y axis flipped so north is up.
 */

import type { TrackPoint } from "./track-point";

export interface ProjectedRoute {
  /** SVG path data ("M x y L x y …") fitted into the box. */
  d: string;
  /** Start point in box coordinates (for a marker). */
  start: { x: number; y: number };
  /** End point in box coordinates (for a marker). */
  end: { x: number; y: number };
}

export function projectRoute(
  points: TrackPoint[],
  width: number,
  height: number,
  pad = 10,
): ProjectedRoute | null {
  if (points.length < 2) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
  }
  const k = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));

  let minX = Infinity;
  let maxX = -Infinity;
  const xs: number[] = [];
  for (const p of points) {
    const x = p.lng * k;
    xs.push(x);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }

  const spanX = maxX - minX || 1e-9;
  const spanY = maxLat - minLat || 1e-9;
  const availW = width - 2 * pad;
  const availH = height - 2 * pad;
  const scale = Math.min(availW / spanX, availH / spanY);
  const offX = pad + (availW - spanX * scale) / 2;
  const offY = pad + (availH - spanY * scale) / 2;

  const project = (i: number): { x: number; y: number } => ({
    x: offX + (xs[i]! - minX) * scale,
    y: offY + (maxLat - points[i]!.lat) * scale, // flip: north up
  });

  let d = "";
  for (let i = 0; i < points.length; i++) {
    const { x, y } = project(i);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }

  return { d: d.trim(), start: project(0), end: project(points.length - 1) };
}
