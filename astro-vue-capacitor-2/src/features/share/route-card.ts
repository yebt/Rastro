/**
 * Render a shareable PNG of a route: the track drawn as line-art on a themed
 * background with the headline stats. Pure canvas (no map tiles), so it works
 * offline and needs no snapshot of the live map. The look is fully driven by a
 * ShareTheme (layout × palette) — see themes.ts.
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
import {
  DEFAULT_THEME,
  getLayout,
  getPalette,
  type SharePalette,
  type ShareTheme,
} from "./themes";

const COND = "'Barlow Condensed', sans-serif";
const MONO = "'Roboto Mono', monospace";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Headline numbers, computed once and shared by every layout. */
interface CardStats {
  type: string;
  date: string;
  distValue: string;
  distUnit: string;
  duration: string;
  pace: string;
}

function statsOf(activity: MoveActivity, clean: TrackPoint[]): CardStats {
  const dist = distanceParts(distanceMeters(clean));
  return {
    type: MOVE_LABEL[activity.type].toUpperCase(),
    date: formatActivityDate(activity.startedAt, activity.endedAt ?? undefined),
    distValue: dist.value,
    distUnit: dist.unit,
    duration: formatDuration(activity.movingMs ?? 0),
    pace: formatPace(avgPaceSecPerKm(clean)),
  };
}

/** First fix as "4.09° N, 76.18° W" — a poster-friendly coordinate line. */
function formatCoords(p: TrackPoint | undefined): string {
  if (!p) return "";
  const lat = `${Math.abs(p.lat).toFixed(2)}° ${p.lat >= 0 ? "N" : "S"}`;
  const lng = `${Math.abs(p.lng).toFixed(2)}° ${p.lng >= 0 ? "E" : "W"}`;
  return `${lat}, ${lng}`;
}

/** Draw the track inside a rect, scaled to fit, with start/end dots. */
function drawRoute(
  ctx: CanvasRenderingContext2D,
  points: TrackPoint[],
  rect: Rect,
  pal: SharePalette,
  lineWidth: number,
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
  const scale = Math.min((rect.w - 2 * pad) / spanX, (rect.h - 2 * pad) / spanY);
  const offX = rect.x + pad + (rect.w - 2 * pad - spanX * scale) / 2;
  const offY = rect.y + pad + (rect.h - 2 * pad - spanY * scale) / 2;
  const px = (i: number): number => offX + (xs[i]! - minX) * scale;
  const py = (i: number): number => offY + (maxLat - points[i]!.lat) * scale;

  ctx.strokeStyle = pal.route;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((_, i) => (i === 0 ? ctx.moveTo(px(i), py(i)) : ctx.lineTo(px(i), py(i))));
  ctx.stroke();

  const dot = (i: number, fill: string): void => {
    ctx.beginPath();
    ctx.arc(px(i), py(i), lineWidth * 1.7, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = lineWidth * 0.65;
    ctx.strokeStyle = pal.route;
    ctx.stroke();
  };
  dot(0, pal.startDot);
  dot(points.length - 1, pal.endDot);
}

/** Clásico: route on top, stats block bottom, wordmark. */
function drawClasico(
  ctx: CanvasRenderingContext2D,
  W: number,
  _H: number,
  pts: TrackPoint[],
  s: CardStats,
  pal: SharePalette,
): void {
  drawRoute(ctx, pts, { x: 60, y: 60, w: W - 120, h: 560 }, pal, 9);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = pal.route;
  ctx.font = `600 34px ${COND}`;
  ctx.fillText(s.type, 70, 730);
  ctx.fillStyle = pal.muted;
  ctx.font = `400 30px ${MONO}`;
  ctx.fillText(s.date, 70, 775);

  ctx.fillStyle = pal.ink;
  ctx.font = `600 150px ${MONO}`;
  ctx.fillText(s.distValue, 66, 910);
  const distW = ctx.measureText(s.distValue).width;
  ctx.fillStyle = pal.muted;
  ctx.font = `600 48px ${MONO}`;
  ctx.fillText(s.distUnit, 82 + distW, 910);

  ctx.fillStyle = pal.ink;
  ctx.font = `600 44px ${MONO}`;
  ctx.fillText(s.duration, 70, 990);
  ctx.fillStyle = pal.muted;
  ctx.font = `400 30px ${MONO}`;
  ctx.fillText("tiempo", 70, 1025);
  ctx.fillStyle = pal.ink;
  ctx.font = `600 44px ${MONO}`;
  ctx.fillText(`${s.pace}/km`, 380, 990);
  ctx.fillStyle = pal.muted;
  ctx.font = `400 30px ${MONO}`;
  ctx.fillText("ritmo", 380, 1025);

  wordmark(ctx, W - 70, 1025, pal);
}

/** Póster: route fills the card as art; centered title + coords + stat line. */
function drawPoster(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  pts: TrackPoint[],
  s: CardStats,
  pal: SharePalette,
  first: TrackPoint | undefined,
): void {
  drawRoute(ctx, pts, { x: 80, y: 120, w: W - 160, h: H - 520 }, pal, 7);

  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = pal.ink;
  ctx.font = `600 96px ${COND}`;
  ctx.fillText(s.type, cx, H - 300);

  ctx.fillStyle = pal.muted;
  ctx.font = `400 34px ${MONO}`;
  ctx.fillText(formatCoords(first), cx, H - 250);

  // divider
  ctx.strokeStyle = pal.muted;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(cx - 220, H - 210);
  ctx.lineTo(cx + 220, H - 210);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = pal.ink;
  ctx.font = `600 46px ${MONO}`;
  ctx.fillText(
    `${s.distValue} ${s.distUnit}   ·   ${s.duration}   ·   ${s.pace}/km`,
    cx,
    H - 140,
  );

  ctx.fillStyle = pal.muted;
  ctx.font = `600 30px ${COND}`;
  ctx.fillText(s.date, cx, H - 90);

  wordmarkCentered(ctx, cx, 90, pal);
  ctx.textAlign = "left";
}

/** Minimal: small centered route, huge distance, whisper of context. */
function drawMinimal(
  ctx: CanvasRenderingContext2D,
  W: number,
  _H: number,
  pts: TrackPoint[],
  s: CardStats,
  pal: SharePalette,
): void {
  const cx = W / 2;
  ctx.textAlign = "center";

  ctx.fillStyle = pal.muted;
  ctx.font = `600 30px ${COND}`;
  ctx.fillText(`${s.type}  ·  ${s.date}`, cx, 130);

  drawRoute(ctx, pts, { x: W / 2 - 260, y: 190, w: 520, h: 400 }, pal, 8);

  ctx.fillStyle = pal.ink;
  ctx.font = `600 220px ${MONO}`;
  ctx.fillText(s.distValue, cx, 800);
  ctx.fillStyle = pal.muted;
  ctx.font = `600 60px ${MONO}`;
  ctx.fillText(s.distUnit, cx, 870);

  ctx.fillStyle = pal.muted;
  ctx.font = `400 34px ${MONO}`;
  ctx.fillText(`${s.duration}  ·  ${s.pace}/km`, cx, 960);

  wordmarkCentered(ctx, cx, 1030, pal);
  ctx.textAlign = "left";
}

/** Historia: 9:16 for stories — route mid, stacked stats, wordmark low. */
function drawStory(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  pts: TrackPoint[],
  s: CardStats,
  pal: SharePalette,
): void {
  ctx.textAlign = "left";
  ctx.fillStyle = pal.route;
  ctx.font = `600 44px ${COND}`;
  ctx.fillText(s.type, 90, 360);
  ctx.fillStyle = pal.muted;
  ctx.font = `400 34px ${MONO}`;
  ctx.fillText(s.date, 90, 415);

  drawRoute(ctx, pts, { x: 90, y: 470, w: W - 180, h: 720 }, pal, 9);

  ctx.fillStyle = pal.ink;
  ctx.font = `600 200px ${MONO}`;
  ctx.fillText(s.distValue, 84, 1420);
  const distW = ctx.measureText(s.distValue).width;
  ctx.fillStyle = pal.muted;
  ctx.font = `600 60px ${MONO}`;
  ctx.fillText(s.distUnit, 104 + distW, 1420);

  ctx.fillStyle = pal.ink;
  ctx.font = `600 52px ${MONO}`;
  ctx.fillText(s.duration, 90, 1540);
  ctx.fillStyle = pal.muted;
  ctx.font = `400 32px ${MONO}`;
  ctx.fillText("tiempo", 90, 1580);
  ctx.fillStyle = pal.ink;
  ctx.font = `600 52px ${MONO}`;
  ctx.fillText(`${s.pace}/km`, 560, 1540);
  ctx.fillStyle = pal.muted;
  ctx.font = `400 32px ${MONO}`;
  ctx.fillText("ritmo", 560, 1580);

  wordmark(ctx, W - 90, 1800, pal);
}

function wordmark(ctx: CanvasRenderingContext2D, x: number, y: number, pal: SharePalette): void {
  ctx.fillStyle = pal.muted;
  ctx.font = `600 30px ${COND}`;
  ctx.textAlign = "right";
  ctx.fillText("RASTRO", x, y);
  ctx.textAlign = "left";
}

function wordmarkCentered(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  pal: SharePalette,
): void {
  ctx.fillStyle = pal.muted;
  ctx.font = `600 30px ${COND}`;
  ctx.textAlign = "center";
  ctx.fillText("RASTRO", cx, y);
}

/** Render the card for a theme and return a PNG data URL. */
export function renderRouteCard(
  activity: MoveActivity,
  theme: ShareTheme = DEFAULT_THEME,
): string {
  const layout = getLayout(theme.layoutId);
  const pal = getPalette(theme.paletteId);
  const { w: W, h: H } = layout;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);

  const clean = cleanTrack(activity.points);
  const s = statsOf(activity, clean);

  switch (layout.id) {
    case "poster":
      drawPoster(ctx, W, H, clean, s, pal, clean[0]);
      break;
    case "minimal":
      drawMinimal(ctx, W, H, clean, s, pal);
      break;
    case "story":
      drawStory(ctx, W, H, clean, s, pal);
      break;
    default:
      drawClasico(ctx, W, H, clean, s, pal);
  }

  return canvas.toDataURL("image/png");
}
