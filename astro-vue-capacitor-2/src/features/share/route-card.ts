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
  type ShareBackground,
  type ShareEffect,
  type SharePalette,
  type ShareTheme,
} from "./themes";

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

/** Mean relative luminance (0..1) of an image, sampled at 16×16. */
function avgLuminance(img: HTMLImageElement): number {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const x = c.getContext("2d");
  if (!x) return 0.5;
  x.drawImage(img, 0, 0, 16, 16);
  const d = x.getImageData(0, 0, 16, 16).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    sum += (0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!) / 255;
  }
  return sum / (d.length / 4);
}

/** Derive legible ink/muted for a photo of the given mean luminance. */
function adjustForPhoto(pal: SharePalette, lum: number): SharePalette {
  const dark = lum < 0.5;
  return {
    ...pal,
    ink: dark ? "#f6f6f4" : "#14181a",
    muted: dark ? "#cbd0cb" : "#454b47",
    // route stays the palette accent (bright); a scrim guarantees contrast.
  };
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

  ctx.save();
  if (st.glow > 0) {
    ctx.shadowBlur = st.glow;
    ctx.shadowColor = st.pal.route;
  }
  ctx.strokeStyle = st.pal.route;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((_, i) => (i === 0 ? ctx.moveTo(px(i), py(i)) : ctx.lineTo(px(i), py(i))));
  ctx.stroke();
  ctx.restore();

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
  dot(points.length - 1, st.pal.endDot);
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

async function paintBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  bg: ShareBackground,
  pal: SharePalette,
): Promise<SharePalette> {
  if (bg.kind === "gradient") {
    const rad = (bg.angle * Math.PI) / 180;
    const grad = ctx.createLinearGradient(0, 0, Math.cos(rad) * W, Math.sin(rad) * H);
    grad.addColorStop(0, bg.from);
    grad.addColorStop(1, bg.to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    return pal;
  }
  if (bg.kind === "photo") {
    try {
      const img = await loadImage(bg.src);
      drawCover(ctx, img, W, H);
      return bg.adjust === "auto" ? adjustForPhoto(pal, avgLuminance(img)) : pal;
    } catch {
      // Fall back to a solid fill if the image can't be decoded.
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);
      return pal;
    }
  }
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
  return pal;
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

  // 1. Background (may adjust the palette for photos).
  const pal = await paintBackground(ctx, W, H, background, pal0);

  // 2. Background effects (scrim, grain) before the route.
  for (const e of effects) {
    if (e.kind === "scrim") applyScrim(ctx, W, H, e);
    else if (e.kind === "grain") applyGrain(ctx, W, H, e.opacity);
  }

  const glow = effects.find((e) => e.kind === "routeGlow");
  const st: Style = {
    pal,
    headline: typo.headline,
    title: typo.title,
    meta: typo.meta,
    glow: glow?.kind === "routeGlow" ? glow.blur : 0,
  };

  // 3. Route + text per layout.
  const clean = cleanTrack(activity.points);
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
    default:
      drawClasico(ctx, W, H, clean, s, st);
  }

  return canvas.toDataURL("image/png");
}
