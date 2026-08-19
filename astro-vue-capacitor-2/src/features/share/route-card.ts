/**
 * Render a shareable PNG of a route: the track drawn as line-art over a themed
 * background (solid / gradient / photo) with the headline stats. Pure canvas —
 * no remote tiles — so it works offline; a photo background is a local data URL,
 * which keeps that promise. The look is fully data-driven by a ShareTheme
 * (layout × palette × typography × background × effects) — see themes.ts.
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
  getTypography,
  type MarkerStyle,
  type ShareBackground,
  type ShareEffect,
  type SharePalette,
  type ShareTheme,
} from "./themes";
import { renderRouteMap } from "./route-map";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Resolved drawing style: palette (maybe photo-adjusted) + fonts. */
interface Style {
  pal: SharePalette;
  headline: string;
  title: string;
  meta: string;
  glow: number; // routeGlow blur, 0 = none
  textShadow: { blur: number; color: string } | null;
  /** When the background already contains the route (map mode), skip drawing it. */
  skipRoute: boolean;
  marker: MarkerStyle;
}

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

function formatCoords(p: TrackPoint | undefined): string {
  if (!p) return "";
  const lat = `${Math.abs(p.lat).toFixed(2)}° ${p.lat >= 0 ? "N" : "S"}`;
  const lng = `${Math.abs(p.lng).toFixed(2)}° ${p.lng >= 0 ? "E" : "W"}`;
  return `${lat}, ${lng}`;
}

// ---- Photo helpers (offline: src is a local data/blob URL) --------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

/** Draw an image to fully cover a WxH canvas, centered. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number): void {
  const r = Math.max(W / img.width, H / img.height);
  const w = img.width * r;
  const h = img.height * r;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

type RGB = [number, number, number];

function relLum([r, g, b]: RGB): number {
  const f = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio (1..21) between two colors. */
function contrast(a: RGB, b: RGB): number {
  const la = relLum(a);
  const lb = relLum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function saturation([r, g, b]: RGB): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

/** Sample an image to a small pixel array plus its mean luminance (0..1). */
function samplePhoto(img: HTMLImageElement, n = 24): { pixels: RGB[]; lum: number } {
  const c = document.createElement("canvas");
  c.width = n;
  c.height = n;
  const x = c.getContext("2d");
  if (!x) return { pixels: [], lum: 0.5 };
  x.drawImage(img, 0, 0, n, n);
  const d = x.getImageData(0, 0, n, n).data;
  const pixels: RGB[] = [];
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    const px: RGB = [d[i]!, d[i + 1]!, d[i + 2]!];
    pixels.push(px);
    sum += (0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]) / 255;
  }
  return { pixels, lum: sum / (pixels.length || 1) };
}

/** Dominant colors via coarse RGB bucketing (a light median-cut stand-in). */
function dominantColors(pixels: RGB[]): { color: RGB; weight: number }[] {
  const buckets = new Map<number, { sum: RGB; n: number }>();
  for (const [r, g, b] of pixels) {
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5); // 8×8×8 cube
    const e = buckets.get(key) ?? { sum: [0, 0, 0] as RGB, n: 0 };
    e.sum[0] += r;
    e.sum[1] += g;
    e.sum[2] += b;
    e.n += 1;
    buckets.set(key, e);
  }
  return [...buckets.values()]
    .map((e) => ({ color: [e.sum[0] / e.n, e.sum[1] / e.n, e.sum[2] / e.n] as RGB, weight: e.n }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Derive legible text + a contrast-safe route accent from a photo. Text is
 * light/dark by mean luminance; the accent is the most saturated dominant color
 * that clears a contrast threshold against the image, falling back to the
 * palette accent, then to a neon orange, then to plain ink.
 */
function adjustForPhoto(pal: SharePalette, sample: { pixels: RGB[]; lum: number }): SharePalette {
  const dark = sample.lum < 0.5;
  const ink: RGB = dark ? [246, 246, 244] : [20, 24, 26];
  const bgAvg: RGB = [
    sample.lum * 255 * 0.9 + 12,
    sample.lum * 255 * 0.9 + 12,
    sample.lum * 255 * 0.9 + 12,
  ];

  const doms = dominantColors(sample.pixels);
  const candidates: RGB[] = [
    ...doms
      .filter((d) => saturation(d.color) > 0.35)
      .sort((a, b) => saturation(b.color) - saturation(a.color))
      .map((d) => d.color),
    hexToRgb(pal.route),
    [255, 90, 31],
  ];
  const accent = candidates.find((c) => contrast(c, bgAvg) >= 2.2) ?? ink;

  return {
    ...pal,
    ink: toHex(ink),
    muted: dark ? "#cbd0cb" : "#454b47",
    route: toHex(accent),
    startDot: toHex(accent),
    endDot: toHex(ink),
  };
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/(.)/g, "$1$1") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ---- Effects ------------------------------------------------------------------

function applyScrim(ctx: CanvasRenderingContext2D, W: number, H: number, e: Extract<ShareEffect, { kind: "scrim" }>): void {
  let grad: CanvasGradient;
  if (e.direction === "top") grad = ctx.createLinearGradient(0, 0, 0, H);
  else if (e.direction === "bottom") grad = ctx.createLinearGradient(0, H, 0, 0);
  else grad = ctx.createLinearGradient(0, 0, 0, H);
  const c = e.color;
  grad.addColorStop(0, rgba(c, e.from));
  grad.addColorStop(1, rgba(c, e.direction === "full" ? e.from : e.to));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function applyGrain(ctx: CanvasRenderingContext2D, W: number, H: number, opacity: number): void {
  const tile = 4;
  ctx.save();
  ctx.globalAlpha = opacity;
  for (let y = 0; y < H; y += tile) {
    for (let x = 0; x < W; x += tile) {
      // Deterministic dither from position — no Math.random (stable re-renders).
      const v = ((x * 73 + y * 149) % 255) > 127 ? 255 : 0;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.restore();
}

/** "#rrggbb" + alpha → "rgba(...)". */
function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ---- Route --------------------------------------------------------------------

function drawRoute(
  ctx: CanvasRenderingContext2D,
  points: TrackPoint[],
  rect: Rect,
  st: Style,
  lineWidth: number,
): void {
  if (st.skipRoute || points.length < 2) return;

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

  // Route + markers drawn under their own shadow scope (glow, or none) so a
  // global text shadow never bleeds onto the line or dots.
  ctx.save();
  ctx.shadowBlur = st.glow;
  ctx.shadowColor = st.glow > 0 ? st.pal.route : "transparent";
  ctx.strokeStyle = st.pal.route;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((p, i) => {
    // Break the line at a pause (big time gap) so it doesn't draw a straight
    // bridge between the pause and resume points.
    const paused = i > 0 && p.t - points[i - 1]!.t > 10_000;
    if (i === 0 || paused) ctx.moveTo(px(i), py(i));
    else ctx.lineTo(px(i), py(i));
  });
  ctx.stroke();

  const dot = (i: number, fill: string): void => {
    ctx.beginPath();
    ctx.arc(px(i), py(i), lineWidth * 1.7, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = lineWidth * 0.65;
    ctx.strokeStyle = st.pal.route;
    ctx.stroke();
  };
  dot(0, st.pal.startDot);
  drawEndMarker(ctx, px(points.length - 1), py(points.length - 1), st, lineWidth);
  ctx.restore();
}

/** The finish marker, in the theme's style. */
function drawEndMarker(ctx: CanvasRenderingContext2D, x: number, y: number, st: Style, lw: number): void {
  const route = st.pal.route;
  const r = lw * 1.9;
  if (st.marker === "ring") {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.lineWidth = lw * 0.9;
    ctx.strokeStyle = route;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, lw * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = route;
    ctx.fill();
    return;
  }
  if (st.marker === "pin") {
    const cy = y - r * 2.2; // circle sits above the point; tip touches (x,y)
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - r * 0.75, cy + r * 0.55);
    ctx.lineTo(x + r * 0.75, cy + r * 0.55);
    ctx.closePath();
    ctx.fillStyle = route;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = route;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = st.pal.bg;
    ctx.fill();
    return;
  }
  if (st.marker === "flag") {
    const h = r * 4;
    ctx.lineWidth = lw * 0.6;
    ctx.strokeStyle = route;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + r * 2.2, y - h + r * 0.9);
    ctx.lineTo(x, y - h + r * 1.8);
    ctx.closePath();
    ctx.fillStyle = route;
    ctx.fill();
    return;
  }
  // dot
  ctx.beginPath();
  ctx.arc(x, y, lw * 1.7, 0, Math.PI * 2);
  ctx.fillStyle = st.pal.endDot;
  ctx.fill();
  ctx.lineWidth = lw * 0.65;
  ctx.strokeStyle = route;
  ctx.stroke();
}

// ---- Layouts ------------------------------------------------------------------

function drawClasico(ctx: CanvasRenderingContext2D, W: number, _H: number, pts: TrackPoint[], s: CardStats, st: Style): void {
  drawRoute(ctx, pts, { x: 60, y: 60, w: W - 120, h: 560 }, st, 9);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = st.pal.route;
  ctx.font = `600 34px ${st.title}`;
  ctx.fillText(s.type, 70, 730);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 30px ${st.meta}`;
  ctx.fillText(s.date, 70, 775);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 150px ${st.headline}`;
  ctx.fillText(s.distValue, 66, 910);
  const distW = ctx.measureText(s.distValue).width;
  ctx.fillStyle = st.pal.muted;
  ctx.font = `600 48px ${st.headline}`;
  ctx.fillText(s.distUnit, 82 + distW, 910);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 44px ${st.meta}`;
  ctx.fillText(s.duration, 70, 990);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 30px ${st.meta}`;
  ctx.fillText("tiempo", 70, 1025);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 44px ${st.meta}`;
  ctx.fillText(`${s.pace}/km`, 380, 990);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 30px ${st.meta}`;
  ctx.fillText("ritmo", 380, 1025);
  wordmark(ctx, W - 70, 1025, st);
}

function drawPoster(ctx: CanvasRenderingContext2D, W: number, H: number, pts: TrackPoint[], s: CardStats, st: Style, first: TrackPoint | undefined): void {
  drawRoute(ctx, pts, { x: 80, y: 120, w: W - 160, h: H - 520 }, st, 7);
  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 96px ${st.title}`;
  ctx.fillText(s.type, cx, H - 300);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 34px ${st.meta}`;
  ctx.fillText(formatCoords(first), cx, H - 250);
  ctx.strokeStyle = st.pal.muted;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(cx - 220, H - 210);
  ctx.lineTo(cx + 220, H - 210);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 46px ${st.meta}`;
  ctx.fillText(`${s.distValue} ${s.distUnit}   ·   ${s.duration}   ·   ${s.pace}/km`, cx, H - 140);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `600 30px ${st.title}`;
  ctx.fillText(s.date, cx, H - 90);
  wordmarkCentered(ctx, cx, 90, st);
  ctx.textAlign = "left";
}

function drawMinimal(ctx: CanvasRenderingContext2D, W: number, _H: number, pts: TrackPoint[], s: CardStats, st: Style): void {
  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = st.pal.muted;
  ctx.font = `600 30px ${st.title}`;
  ctx.fillText(`${s.type}  ·  ${s.date}`, cx, 130);
  drawRoute(ctx, pts, { x: W / 2 - 260, y: 190, w: 520, h: 400 }, st, 8);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 220px ${st.headline}`;
  ctx.fillText(s.distValue, cx, 800);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `600 60px ${st.headline}`;
  ctx.fillText(s.distUnit, cx, 870);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 34px ${st.meta}`;
  ctx.fillText(`${s.duration}  ·  ${s.pace}/km`, cx, 960);
  wordmarkCentered(ctx, cx, 1030, st);
  ctx.textAlign = "left";
}

function drawStory(ctx: CanvasRenderingContext2D, W: number, _H: number, pts: TrackPoint[], s: CardStats, st: Style): void {
  ctx.textAlign = "left";
  ctx.fillStyle = st.pal.route;
  ctx.font = `600 44px ${st.title}`;
  ctx.fillText(s.type, 90, 360);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 34px ${st.meta}`;
  ctx.fillText(s.date, 90, 415);
  drawRoute(ctx, pts, { x: 90, y: 470, w: W - 180, h: 720 }, st, 9);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 200px ${st.headline}`;
  ctx.fillText(s.distValue, 84, 1420);
  const distW = ctx.measureText(s.distValue).width;
  ctx.fillStyle = st.pal.muted;
  ctx.font = `600 60px ${st.headline}`;
  ctx.fillText(s.distUnit, 104 + distW, 1420);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 52px ${st.meta}`;
  ctx.fillText(s.duration, 90, 1540);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 32px ${st.meta}`;
  ctx.fillText("tiempo", 90, 1580);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 52px ${st.meta}`;
  ctx.fillText(`${s.pace}/km`, 560, 1540);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 32px ${st.meta}`;
  ctx.fillText("ritmo", 560, 1580);
  wordmark(ctx, W - 90, 1800, st);
}

/** Overlay: route top, stats stacked and centered low — reads well over a photo. */
function drawOverlay(ctx: CanvasRenderingContext2D, W: number, H: number, pts: TrackPoint[], s: CardStats, st: Style): void {
  const cx = W / 2;
  drawRoute(ctx, pts, { x: 120, y: 90, w: W - 240, h: 560 }, st, 8);
  ctx.textAlign = "center";
  ctx.fillStyle = st.pal.muted;
  ctx.font = `600 30px ${st.title}`;
  ctx.fillText(`${s.type}  ·  ${s.date}`, cx, H - 430);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 170px ${st.headline}`;
  ctx.fillText(s.distValue, cx, H - 250);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `600 52px ${st.headline}`;
  ctx.fillText(s.distUnit, cx, H - 190);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 46px ${st.meta}`;
  ctx.fillText(`${s.duration}   ·   ${s.pace}/km`, cx, H - 120);
  wordmarkCentered(ctx, cx, H - 60, st);
  ctx.textAlign = "left";
}

/** Editorial: big split title + DMS-ish coords, route as art, minimal stat line. */
function drawEditorial(ctx: CanvasRenderingContext2D, W: number, H: number, pts: TrackPoint[], s: CardStats, st: Style, first: TrackPoint | undefined): void {
  ctx.textAlign = "left";
  ctx.fillStyle = st.pal.ink;
  ctx.font = `700 92px ${st.title}`;
  ctx.fillText(s.type, 70, 160);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 30px ${st.meta}`;
  ctx.fillText(formatCoords(first), 74, 212);
  drawRoute(ctx, pts, { x: 60, y: 250, w: W - 120, h: H - 560 }, st, 8);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 44px ${st.headline}`;
  ctx.fillText(`${s.distValue} ${s.distUnit}`, 70, H - 130);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 30px ${st.meta}`;
  ctx.fillText(`${s.duration}  ·  ${s.pace}/km  ·  ${s.date}`, 70, H - 88);
  wordmark(ctx, W - 70, H - 88, st);
}

/** DataGrid: title/date top, route silhouette, a DISTANCIA·TIEMPO·RITMO row (v1 map-card feel). */
function drawDataGrid(ctx: CanvasRenderingContext2D, W: number, H: number, pts: TrackPoint[], s: CardStats, st: Style): void {
  ctx.textAlign = "left";
  ctx.fillStyle = st.pal.route;
  ctx.font = `600 40px ${st.title}`;
  ctx.fillText(s.type, 70, 120);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 28px ${st.meta}`;
  ctx.fillText(s.date, 72, 162);
  drawRoute(ctx, pts, { x: 120, y: 210, w: W - 240, h: 620 }, st, 8);
  const cols: [string, string, string][] = [
    ["DISTANCIA", s.distValue, s.distUnit],
    ["TIEMPO", s.duration, ""],
    ["RITMO", s.pace, "/km"],
  ];
  const y = H - 170;
  const colW = (W - 140) / 3;
  cols.forEach((c, i) => {
    const x = 70 + i * colW;
    ctx.fillStyle = st.pal.muted;
    ctx.font = `600 24px ${st.meta}`;
    ctx.fillText(c[0], x, y);
    ctx.fillStyle = st.pal.ink;
    ctx.font = `600 62px ${st.headline}`;
    ctx.fillText(c[1], x, y + 70);
    if (c[2]) {
      const w = ctx.measureText(c[1]).width;
      ctx.fillStyle = st.pal.muted;
      ctx.font = `600 26px ${st.headline}`;
      ctx.fillText(c[2], x + w + 10, y + 70);
    }
  });
  wordmark(ctx, W - 70, H - 50, st);
}

/** Blueprint: technical "plan" — coords row, titled route box, mono stat line. */
function drawBlueprint(ctx: CanvasRenderingContext2D, W: number, H: number, pts: TrackPoint[], s: CardStats, st: Style, first: TrackPoint | undefined): void {
  ctx.textAlign = "left";
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 26px ${st.meta}`;
  ctx.fillText(formatCoords(first), 70, 100);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `700 84px ${st.title}`;
  ctx.fillText(s.type, 66, 205);
  ctx.strokeStyle = st.pal.muted;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 260, W - 140, H - 560);
  ctx.globalAlpha = 1;
  drawRoute(ctx, pts, { x: 70, y: 260, w: W - 140, h: H - 560 }, st, 7);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `600 42px ${st.meta}`;
  ctx.fillText(`${s.distValue} ${s.distUnit}`, 70, H - 160);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 28px ${st.meta}`;
  ctx.fillText(`${s.duration}  ·  ${s.pace}/km  ·  ${s.date}`, 70, H - 112);
  wordmark(ctx, W - 70, H - 112, st);
}

/** TechCard: specimen sheet — headline + line-art route + key→value mini table. */
function drawTechCard(ctx: CanvasRenderingContext2D, W: number, H: number, pts: TrackPoint[], s: CardStats, st: Style): void {
  ctx.textAlign = "left";
  ctx.fillStyle = st.pal.route;
  ctx.font = `600 28px ${st.meta}`;
  ctx.fillText("REGISTRO", 70, 100);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `700 72px ${st.title}`;
  ctx.fillText(s.type, 66, 180);
  drawRoute(ctx, pts, { x: 70, y: 210, w: W - 140, h: 470 }, st, 6);
  const rows: [string, string][] = [
    ["DISTANCIA", `${s.distValue} ${s.distUnit}`],
    ["TIEMPO", s.duration],
    ["RITMO", `${s.pace}/km`],
    ["FECHA", s.date],
  ];
  let y = H - 300;
  for (const [k, v] of rows) {
    ctx.fillStyle = st.pal.muted;
    ctx.font = `600 24px ${st.meta}`;
    ctx.textAlign = "left";
    ctx.fillText(k, 70, y);
    ctx.fillStyle = st.pal.ink;
    ctx.font = `600 30px ${st.meta}`;
    ctx.textAlign = "right";
    ctx.fillText(v, W - 70, y);
    ctx.textAlign = "left";
    ctx.strokeStyle = st.pal.muted;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, y + 16);
    ctx.lineTo(W - 70, y + 16);
    ctx.stroke();
    ctx.globalAlpha = 1;
    y += 58;
  }
  wordmark(ctx, W - 70, H - 44, st);
}

/** Cover: route as art to the bleed, big title + stats bottom-left. */
function drawCoverLayout(ctx: CanvasRenderingContext2D, W: number, H: number, pts: TrackPoint[], s: CardStats, st: Style): void {
  drawRoute(ctx, pts, { x: 60, y: 60, w: W - 120, h: H - 360 }, st, 8);
  ctx.textAlign = "left";
  ctx.fillStyle = st.pal.route;
  ctx.font = `600 30px ${st.meta}`;
  ctx.fillText(s.date.toUpperCase(), 70, H - 250);
  ctx.fillStyle = st.pal.ink;
  ctx.font = `700 128px ${st.title}`;
  ctx.fillText(s.type, 60, H - 130);
  ctx.font = `600 52px ${st.headline}`;
  ctx.fillText(s.distValue, 66, H - 60);
  const dw = ctx.measureText(s.distValue).width;
  ctx.fillStyle = st.pal.muted;
  ctx.font = `600 32px ${st.headline}`;
  ctx.fillText(` ${s.distUnit}   ${s.duration}   ${s.pace}/km`, 78 + dw, H - 60);
  wordmark(ctx, W - 70, H - 60, st);
}

/** Vinilo: the route inside a record disc, title beneath. */
function drawVinilo(ctx: CanvasRenderingContext2D, W: number, H: number, pts: TrackPoint[], s: CardStats, st: Style): void {
  const cx = W / 2;
  const cy = H / 2 - 40;
  const R = Math.min(W, H) * 0.36;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = st.pal.muted;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 6, 0, Math.PI * 2);
  ctx.clip();
  drawRoute(ctx, pts, { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R }, st, 7);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fillStyle = st.pal.bg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = st.pal.route;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = st.pal.ink;
  ctx.font = `700 56px ${st.title}`;
  ctx.fillText(s.type, cx, H - 120);
  ctx.fillStyle = st.pal.muted;
  ctx.font = `400 30px ${st.meta}`;
  ctx.fillText(`${s.distValue} ${s.distUnit}  ·  ${s.duration}  ·  ${s.pace}/km`, cx, H - 72);
  ctx.textAlign = "left";
}

function wordmark(ctx: CanvasRenderingContext2D, x: number, y: number, st: Style): void {
  ctx.fillStyle = st.pal.muted;
  ctx.font = `600 30px ${st.title}`;
  ctx.textAlign = "right";
  ctx.fillText("RASTRO", x, y);
  ctx.textAlign = "left";
}

function wordmarkCentered(ctx: CanvasRenderingContext2D, cx: number, y: number, st: Style): void {
  ctx.fillStyle = st.pal.muted;
  ctx.font = `600 30px ${st.title}`;
  ctx.textAlign = "center";
  ctx.fillText("RASTRO", cx, y);
}

// ---- Composition --------------------------------------------------------------

interface Painted {
  pal: SharePalette;
  /** Map mode bakes the route into the snapshot, so the flat route is skipped. */
  skipRoute: boolean;
}

async function paintBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  bg: ShareBackground,
  pal: SharePalette,
  blurRadius: number,
  points: TrackPoint[],
): Promise<Painted> {
  if (bg.kind === "gradient") {
    const rad = (bg.angle * Math.PI) / 180;
    const grad = ctx.createLinearGradient(0, 0, Math.cos(rad) * W, Math.sin(rad) * H);
    grad.addColorStop(0, bg.from);
    grad.addColorStop(1, bg.to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    return { pal, skipRoute: false };
  }
  if (bg.kind === "photo") {
    try {
      const img = await loadImage(bg.src);
      if (blurRadius > 0) ctx.filter = `blur(${blurRadius}px)`;
      const over = blurRadius * 2;
      drawCover(ctx, img, W + over * 2, H + over * 2);
      ctx.filter = "none";
      return { pal: bg.adjust === "auto" ? adjustForPhoto(pal, samplePhoto(img)) : pal, skipRoute: false };
    } catch {
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);
      return { pal, skipRoute: false };
    }
  }
  if (bg.kind === "map") {
    // Render the route on a real map on demand: AUTO-FIT (centered) unless a
    // custom `view` was set in the editor. The route is drawn by the map, so the
    // flat vector route is skipped.
    const canvas = await renderRouteMap(points, W, H, bg.style, pal.route, pal.startDot, bg.view);
    if (canvas) {
      ctx.drawImage(canvas, 0, 0, W, H);
      const dark = bg.style === "dark" || bg.style === "satellite";
      const ink = dark ? "#f6f6f4" : "#14181a";
      const muted = dark ? "#cbd0cb" : "#454b47";
      return { pal: { ...pal, ink, muted }, skipRoute: true };
    }
    // Offline / WebGL blocked → fall back to the flat route on a solid ground.
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    return { pal, skipRoute: false };
  }
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
  return { pal, skipRoute: false };
}

function applyExposure(ctx: CanvasRenderingContext2D, W: number, H: number, amount: number): void {
  ctx.save();
  ctx.fillStyle = amount < 0 ? rgba("#000000", -amount) : rgba("#ffffff", amount);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function applyVignette(ctx: CanvasRenderingContext2D, W: number, H: number, strength: number): void {
  const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.72);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, rgba("#000000", strength));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function applyDuotone(ctx: CanvasRenderingContext2D, W: number, H: number, shadow: string, highlight: string): void {
  const s = hexToRgb(shadow);
  const h = hexToRgb(highlight);
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const t = (0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!) / 255;
    d[i] = s[0] + (h[0] - s[0]) * t;
    d[i + 1] = s[1] + (h[1] - s[1]) * t;
    d[i + 2] = s[2] + (h[2] - s[2]) * t;
  }
  ctx.putImageData(img, 0, 0);
}

function applyTint(ctx: CanvasRenderingContext2D, W: number, H: number, color: string, alpha: number): void {
  ctx.save();
  ctx.fillStyle = rgba(color, alpha);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function applyFrame(ctx: CanvasRenderingContext2D, W: number, H: number, e: Extract<ShareEffect, { kind: "frame" }>): void {
  ctx.save();
  ctx.strokeStyle = e.color;
  ctx.lineWidth = e.width;
  ctx.strokeRect(e.inset, e.inset, W - e.inset * 2, H - e.inset * 2);
  ctx.restore();
}

function applyHalftone(ctx: CanvasRenderingContext2D, W: number, H: number, e: Extract<ShareEffect, { kind: "halftone" }>): void {
  ctx.save();
  ctx.fillStyle = rgba(e.color, e.alpha);
  for (let y = e.gap / 2; y < H; y += e.gap) {
    for (let x = e.gap / 2; x < W; x += e.gap) {
      ctx.beginPath();
      ctx.arc(x, y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Ensure a photo card always has some scrim for legibility. */
function withDefaultScrim(effects: ShareEffect[], bg: ShareBackground, layoutId: string): ShareEffect[] {
  if (bg.kind !== "photo") return effects;
  if (effects.some((e) => e.kind === "scrim")) return effects;
  const direction = layoutId === "story" || layoutId === "overlay" ? "bottom" : "full";
  return [{ kind: "scrim", direction, color: "#000000", from: 0.55, to: 0.05 }, ...effects];
}

/** Render the card for a theme and return a PNG data URL. */
export async function renderRouteCard(
  activity: MoveActivity,
  theme: ShareTheme = DEFAULT_THEME,
): Promise<string> {
  // Ensure custom faces are loaded so canvas text doesn't fall back on first render.
  await document.fonts?.ready;

  const layout = getLayout(theme.layoutId);
  const pal0 = getPalette(theme.paletteId);
  const typo = getTypography(theme.typographyId);
  const background: ShareBackground = theme.background ?? { kind: "solid" };
  const effects = withDefaultScrim(theme.effects ?? [], background, layout.id);
  const { w: W, h: H } = layout;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const clean = cleanTrack(activity.points);

  // 1. Background (blur is a photo-time filter; map bakes in the route).
  const blurFx = effects.find((e) => e.kind === "blur");
  const blurRadius = blurFx?.kind === "blur" ? blurFx.radius : 0;
  const painted = await paintBackground(ctx, W, H, background, pal0, blurRadius, clean);
  const ovr = theme.override;
  const pal =
    ovr?.route || ovr?.ink
      ? {
          ...painted.pal,
          route: ovr.route ?? painted.pal.route,
          startDot: ovr.route ?? painted.pal.startDot,
          ink: ovr.ink ?? painted.pal.ink,
        }
      : painted.pal;

  // 2. Background passes, in array order (route-level & text-level handled later).
  for (const e of effects) {
    if (e.kind === "duotone") applyDuotone(ctx, W, H, e.shadow, e.highlight);
    else if (e.kind === "exposure") applyExposure(ctx, W, H, e.amount);
    else if (e.kind === "halftone") applyHalftone(ctx, W, H, e);
    else if (e.kind === "scrim") applyScrim(ctx, W, H, e);
    else if (e.kind === "grain") applyGrain(ctx, W, H, e.opacity);
    else if (e.kind === "vignette") applyVignette(ctx, W, H, e.strength);
    else if (e.kind === "tint") applyTint(ctx, W, H, e.color, e.alpha);
  }

  const glow = effects.find((e) => e.kind === "routeGlow");
  const shadow = effects.find((e) => e.kind === "textShadow");
  const st: Style = {
    pal,
    headline: typo.headline,
    title: typo.title,
    meta: typo.meta,
    glow: glow?.kind === "routeGlow" ? glow.blur : 0,
    textShadow: shadow?.kind === "textShadow" ? { blur: shadow.blur, color: shadow.color } : null,
    skipRoute: painted.skipRoute,
    marker: theme.marker ?? "dot",
  };

  // 3. Text shadow is a global canvas state; drawRoute scopes its own shadow so
  //    the line/dots stay crisp.
  if (st.textShadow) {
    ctx.shadowColor = st.textShadow.color;
    ctx.shadowBlur = st.textShadow.blur;
  }

  const s = statsOf(activity, clean);
  switch (layout.id) {
    case "poster":
      drawPoster(ctx, W, H, clean, s, st, clean[0]);
      break;
    case "minimal":
      drawMinimal(ctx, W, H, clean, s, st);
      break;
    case "story":
      drawStory(ctx, W, H, clean, s, st);
      break;
    case "overlay":
      drawOverlay(ctx, W, H, clean, s, st);
      break;
    case "editorial":
      drawEditorial(ctx, W, H, clean, s, st, clean[0]);
      break;
    case "dataGrid":
      drawDataGrid(ctx, W, H, clean, s, st);
      break;
    case "blueprint":
      drawBlueprint(ctx, W, H, clean, s, st, clean[0]);
      break;
    case "techCard":
      drawTechCard(ctx, W, H, clean, s, st);
      break;
    case "cover":
      drawCoverLayout(ctx, W, H, clean, s, st);
      break;
    case "vinilo":
      drawVinilo(ctx, W, H, clean, s, st);
      break;
    default:
      drawClasico(ctx, W, H, clean, s, st);
  }

  // Frame sits on top of everything.
  const frame = effects.find((e) => e.kind === "frame");
  if (frame?.kind === "frame") applyFrame(ctx, W, H, frame);

  return canvas.toDataURL("image/png");
}
