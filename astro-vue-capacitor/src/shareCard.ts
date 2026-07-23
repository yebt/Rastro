/**
 * Share card renderer (F12, SPECS §9.5). Draws a route + stats card onto a
 * canvas, entirely on-device (no tiles / no network). Theme-selectable.
 */

import { fmtDistance, fmtPace, fmtTime, paceSecPerKm, speedKmh } from "./lib/format";
import { TYPE_LABEL } from "./lib/labels";
import type { GpsActivity } from "./lib/types";
// Type-only: erased at build, so MapLibre stays out of the base bundle.
import type { MapStyleId } from "./routeMap";

/** Procedural background texture drawn under the route (no tiles, offline). */
export type Texture = "grid" | "topo" | "streets" | "halftone";

export interface ShareTheme {
  id: string;
  label: string;
  /** solid color, or [top, bottom] for a vertical gradient */
  bg: string | [string, string];
  route: string;
  text: string;
  sub: string;
  /** end-of-route dot */
  accent: string;
  texture?: Texture;
  /** color (usually translucent) for the texture strokes/dots */
  textureColor?: string;
  /** renders the route on a real map (MapLibre); only usable with internet */
  requiresOnline?: boolean;
  /** CARTO basemap to use when requiresOnline (defaults to voyager) */
  mapStyle?: MapStyleId;
}

export const SHARE_THEMES: ShareTheme[] = [
  { id: "noche", label: "Noche", bg: "#15181A", route: "#4d7bff", text: "#ffffff", sub: "#9aa39a", accent: "#ff5a1f" },
  { id: "papel", label: "Papel", bg: "#f5f6f3", route: "#1b4dff", text: "#15181a", sub: "#6e746c", accent: "#ff5a1f" },
  { id: "energia", label: "Energía", bg: ["#ff7a45", "#e5484d"], route: "#ffffff", text: "#ffffff", sub: "#ffe4d6", accent: "#15181a" },
  { id: "bosque", label: "Bosque", bg: ["#0f2a1e", "#13402c"], route: "#2fbf6e", text: "#ffffff", sub: "#9ec9b3", accent: "#f5f6f3" },
  { id: "blueprint", label: "Blueprint", bg: ["#0b1e38", "#0e2a4d"], route: "#8fd3ff", text: "#ffffff", sub: "#8fb2d6", accent: "#ffd166", texture: "grid", textureColor: "rgba(255,255,255,0.10)" },
  { id: "topografico", label: "Topográfico", bg: ["#14231b", "#1d3327"], route: "#e8c07d", text: "#f2ede3", sub: "#a9b3a0", accent: "#e07a5f", texture: "topo", textureColor: "rgba(232,192,125,0.16)" },
  { id: "trama", label: "Trama", bg: "#101418", route: "#ff5a1f", text: "#ffffff", sub: "#9aa39a", accent: "#4d7bff", texture: "streets", textureColor: "rgba(255,255,255,0.09)" },
  { id: "halftone", label: "Halftone", bg: ["#2b1055", "#7b2ff7"], route: "#ffffff", text: "#ffffff", sub: "#d9c9ff", accent: "#00e0c6", texture: "halftone", textureColor: "rgba(255,255,255,0.16)" },
  { id: "mapa", label: "Mapa", bg: "#0b0d10", route: "#1b4dff", text: "#ffffff", sub: "rgba(255,255,255,0.85)", accent: "#ff5a1f", requiresOnline: true, mapStyle: "voyager" },
  { id: "mapa-noche", label: "Mapa noche", bg: "#0b0d10", route: "#4d9bff", text: "#ffffff", sub: "rgba(255,255,255,0.85)", accent: "#ff5a1f", requiresOnline: true, mapStyle: "dark" },
  { id: "mapa-claro", label: "Mapa claro", bg: "#0b0d10", route: "#1b4dff", text: "#ffffff", sub: "rgba(255,255,255,0.85)", accent: "#ff5a1f", requiresOnline: true, mapStyle: "light" },
];

/** Deterministic PRNG (mulberry32) so a texture looks the same on every render. */
function prng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawTexture(ctx: CanvasRenderingContext2D, size: number, theme: ShareTheme): void {
  const color = theme.textureColor;
  if (!theme.texture || !color) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  if (theme.texture === "grid") {
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= size; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  } else if (theme.texture === "topo") {
    ctx.lineWidth = 2;
    const rows = 15;
    for (let i = 0; i < rows; i++) {
      const baseY = ((i + 0.5) / rows) * size;
      ctx.beginPath();
      for (let x = 0; x <= size; x += 10) {
        const y = baseY + Math.sin(x / 140 + i * 0.7) * 24 + Math.sin(x / 55 + i) * 7;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (theme.texture === "streets") {
    const rnd = prng(9876);
    ctx.lineCap = "round";
    for (let i = 0; i < 10; i++) {
      const y = rnd() * size;
      ctx.lineWidth = rnd() < 0.3 ? 6 : 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + (rnd() - 0.5) * 44);
      ctx.stroke();
    }
    for (let i = 0; i < 10; i++) {
      const x = rnd() * size;
      ctx.lineWidth = rnd() < 0.3 ? 6 : 2.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (rnd() - 0.5) * 44, size);
      ctx.stroke();
    }
  } else {
    // halftone
    const step = 34;
    for (let y = step / 2; y < size; y += step) {
      for (let x = step / 2; x < size; x += step) {
        const r = 2 + ((x + y) / (2 * size)) * 8;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

const SANS = "system-ui, -apple-system, sans-serif";
const DISPLAY = `"Barlow Condensed", ${SANS}`;

function fillBackground(ctx: CanvasRenderingContext2D, size: number, theme: ShareTheme): void {
  if (Array.isArray(theme.bg)) {
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, theme.bg[0]);
    g.addColorStop(1, theme.bg[1]);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = theme.bg;
  }
  ctx.fillRect(0, 0, size, size);
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  route: GpsActivity["route"],
  theme: ShareTheme,
): void {
  if (route.length < 2) return;
  const lats = route.map((p) => p[0]);
  const lngs = route.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);

  // Equirectangular with longitude corrected for latitude; y flipped (north up).
  const pts = route.map((p) => ({ x: (p[1] - minLng) * Math.cos(midLat), y: maxLat - p[0] }));
  const spanX = Math.max(...pts.map((p) => p.x)) || 1e-9;
  const spanY = Math.max(...pts.map((p) => p.y)) || 1e-9;
  const scale = Math.min(box.w / spanX, box.h / spanY) * 0.9;
  const ox = box.x + (box.w - spanX * scale) / 2;
  const oy = box.y + (box.h - spanY * scale) / 2;
  const at = (p: { x: number; y: number }) => ({ x: ox + p.x * scale, y: oy + p.y * scale });

  ctx.beginPath();
  pts.forEach((p, i) => {
    const c = at(p);
    if (i === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
  });
  ctx.strokeStyle = theme.route;
  ctx.lineWidth = 12;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  const dot = (p: { x: number; y: number }, color: string) => {
    const c = at(p);
    ctx.beginPath();
    ctx.arc(c.x, c.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = theme.bg === "#f5f6f3" ? "#ffffff" : "rgba(255,255,255,0.85)";
    ctx.stroke();
  };
  dot(pts[0]!, "#12A150");
  dot(pts[pts.length - 1]!, theme.accent);
}

function stat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  unit: string,
  theme: ShareTheme,
): void {
  ctx.textAlign = "left";
  ctx.fillStyle = theme.sub;
  ctx.font = `600 26px ${SANS}`;
  ctx.fillText(label.toUpperCase(), x, y);
  ctx.fillStyle = theme.text;
  ctx.font = `700 76px ${DISPLAY}`;
  ctx.fillText(value, x, y + 74);
  if (unit) {
    const w = ctx.measureText(value).width;
    ctx.fillStyle = theme.sub;
    ctx.font = `600 30px ${SANS}`;
    ctx.fillText(unit, x + w + 8, y + 74);
  }
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Wordmark, date, type, stats + footer — shared by the flat and map cards. */
function drawCardText(
  ctx: CanvasRenderingContext2D,
  size: number,
  activity: GpsActivity,
  theme: ShareTheme,
): void {
  const P = 74;

  ctx.textAlign = "left";
  ctx.fillStyle = theme.text;
  ctx.font = `700 46px ${DISPLAY}`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "3px";
  ctx.fillText("RASTRO", P, P + 40);
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";

  const d = new Date(activity.date);
  const dateStr = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  ctx.textAlign = "right";
  ctx.fillStyle = theme.sub;
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText(dateStr, size - P, P + 34);

  ctx.textAlign = "left";
  ctx.fillStyle = theme.text;
  ctx.font = `700 96px ${DISPLAY}`;
  ctx.fillText(TYPE_LABEL[activity.type], P, 250);

  const dist = fmtDistance(activity.distance);
  const y = 850;
  const col = (size - 2 * P) / 3;
  stat(ctx, P, y, "Distancia", dist.value, dist.unit, theme);
  stat(ctx, P + col, y, "Tiempo", fmtTime(activity.duration), "", theme);
  stat(ctx, P + col * 2, y, "Ritmo", fmtPace(paceSecPerKm(activity.distance, activity.duration)), "/km", theme);

  ctx.textAlign = "left";
  ctx.fillStyle = theme.sub;
  ctx.font = `500 28px ${SANS}`;
  ctx.fillText(
    `${speedKmh(activity.distance, activity.duration).toFixed(1)} km/h promedio`,
    P,
    size - P + 6,
  );
}

/** Render the whole flat card (bg + texture + route + text) into a square context. */
export function drawShareCard(
  ctx: CanvasRenderingContext2D,
  size: number,
  activity: GpsActivity,
  theme: ShareTheme,
): void {
  const P = 74;
  fillBackground(ctx, size, theme);
  drawTexture(ctx, size, theme);
  drawRoute(ctx, { x: P, y: 300, w: size - 2 * P, h: 440 }, activity.route, theme);
  drawCardText(ctx, size, activity, theme);
}

/** Compose the map card: a full-bleed route map + gradient scrims + white text. */
export function composeMapCard(
  ctx: CanvasRenderingContext2D,
  size: number,
  activity: GpsActivity,
  mapCanvas: CanvasImageSource,
  theme: ShareTheme,
): void {
  ctx.drawImage(mapCanvas, 0, 0, size, size);

  // Fading scrims: darken top (wordmark/type) and bottom (stats) so white text
  // stays legible even over a light basemap. Taller + darker than a thin band.
  const top = ctx.createLinearGradient(0, 0, 0, 430);
  top.addColorStop(0, "rgba(0,0,0,0.7)");
  top.addColorStop(0.55, "rgba(0,0,0,0.28)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, size, 430);

  const bot = ctx.createLinearGradient(0, size - 470, 0, size);
  bot.addColorStop(0, "rgba(0,0,0,0)");
  bot.addColorStop(0.45, "rgba(0,0,0,0.45)");
  bot.addColorStop(1, "rgba(0,0,0,0.86)");
  ctx.fillStyle = bot;
  ctx.fillRect(0, size - 470, size, 470);

  // Soft per-glyph shadow (the "blur desvaneciente"): a halo under every letter
  // so text never blends into the map, regardless of what's behind it.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 1;
  drawCardText(ctx, size, activity, theme);
  ctx.restore();

  // Tile attribution (required by OSM/CARTO).
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `500 20px ${SANS}`;
  ctx.fillText("© OpenStreetMap · CARTO", size - 74, size - 30);
}
