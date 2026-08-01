/**
 * Render a shareable PNG of a route: the track drawn on the app's dark theme with
 * the headline stats. Pure canvas (no map tiles), so it works offline and needs
 * no snapshot of the live map.
 */

import {
  avgPaceSecPerKm,
  cleanTrack,
  distanceMeters,
  distanceParts,
  formatActivityDate,
  formatDuration,
  formatPace,
  type MoveActivity,
  MOVE_LABEL,
  type TrackPoint,
} from "../tracking";

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  points: TrackPoint[],
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  bg: string,
): void {
  if (points.length < 2) return;

  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
  }
  const k = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  let minX = Infinity;
  let maxX = -Infinity;
  const xs = points.map((p) => {
    const px = p.lng * k;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    return px;
  });

  const pad = 40;
  const spanX = maxX - minX || 1e-9;
  const spanY = maxLat - minLat || 1e-9;
  const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY);
  const offX = x + pad + (w - 2 * pad - spanX * scale) / 2;
  const offY = y + pad + (h - 2 * pad - spanY * scale) / 2;
  const px = (i: number): number => offX + (xs[i]! - minX) * scale;
  const py = (i: number): number => offY + (maxLat - points[i]!.lat) * scale;

  ctx.strokeStyle = color;
  ctx.lineWidth = 9;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((_, i) => (i === 0 ? ctx.moveTo(px(i), py(i)) : ctx.lineTo(px(i), py(i))));
  ctx.stroke();

  const dot = (i: number, fill: string): void => {
    ctx.beginPath();
    ctx.arc(px(i), py(i), 15, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  dot(0, color);
  dot(points.length - 1, bg);
}

/** Render the card and return a PNG data URL. */
export function renderRouteCard(activity: MoveActivity): string {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bg = cssVar("--bg", "#0b0d0c");
  const accent = cssVar("--accent", "#12a150");
  const ink = cssVar("--ink", "#f2f2f2");
  const muted = cssVar("--muted", "#8a8a8a");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const clean = cleanTrack(activity.points);
  drawRoute(ctx, clean, 60, 60, W - 120, 560, accent, bg);

  const dist = distanceParts(distanceMeters(clean));
  const pace = formatPace(avgPaceSecPerKm(clean));
  const duration = formatDuration(activity.movingMs ?? 0);

  const cond = "'Barlow Condensed', sans-serif";
  const mono = "'Roboto Mono', monospace";

  // type + date
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = accent;
  ctx.font = `600 34px ${cond}`;
  ctx.fillText(MOVE_LABEL[activity.type].toUpperCase(), 70, 730);
  ctx.fillStyle = muted;
  ctx.font = `400 30px ${mono}`;
  ctx.fillText(formatActivityDate(activity.startedAt, activity.endedAt ?? undefined), 70, 775);

  // headline distance
  ctx.fillStyle = ink;
  ctx.font = `600 150px ${mono}`;
  ctx.fillText(dist.value, 66, 910);
  const distW = ctx.measureText(dist.value).width;
  ctx.fillStyle = muted;
  ctx.font = `600 48px ${mono}`;
  ctx.fillText(dist.unit, 82 + distW, 910);

  // time · pace
  ctx.fillStyle = ink;
  ctx.font = `600 44px ${mono}`;
  ctx.fillText(`${duration}`, 70, 990);
  ctx.fillStyle = muted;
  ctx.font = `400 30px ${mono}`;
  ctx.fillText("tiempo", 70, 1025);
  ctx.fillStyle = ink;
  ctx.font = `600 44px ${mono}`;
  ctx.fillText(`${pace}/km`, 380, 990);
  ctx.fillStyle = muted;
  ctx.font = `400 30px ${mono}`;
  ctx.fillText("ritmo", 380, 1025);

  // wordmark
  ctx.fillStyle = muted;
  ctx.font = `600 30px ${cond}`;
  ctx.textAlign = "right";
  ctx.fillText("RASTRO", W - 70, 1025);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}
