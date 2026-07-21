/**
 * Share card renderer (F12, SPECS §9.5). Draws a route + stats card onto a
 * canvas, entirely on-device (no tiles / no network). Theme-selectable.
 */

import { fmtDistance, fmtPace, fmtTime, paceSecPerKm, speedKmh } from "./lib/format";
import { TYPE_LABEL } from "./lib/labels";
import type { GpsActivity } from "./lib/types";

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
}

export const SHARE_THEMES: ShareTheme[] = [
  { id: "noche", label: "Noche", bg: "#15181A", route: "#4d7bff", text: "#ffffff", sub: "#9aa39a", accent: "#ff5a1f" },
  { id: "papel", label: "Papel", bg: "#f5f6f3", route: "#1b4dff", text: "#15181a", sub: "#6e746c", accent: "#ff5a1f" },
  { id: "energia", label: "Energía", bg: ["#ff7a45", "#e5484d"], route: "#ffffff", text: "#ffffff", sub: "#ffe4d6", accent: "#15181a" },
  { id: "bosque", label: "Bosque", bg: ["#0f2a1e", "#13402c"], route: "#2fbf6e", text: "#ffffff", sub: "#9ec9b3", accent: "#f5f6f3" },
];

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

/** Render the whole card into a square `size`×`size` context. */
export function drawShareCard(
  ctx: CanvasRenderingContext2D,
  size: number,
  activity: GpsActivity,
  theme: ShareTheme,
): void {
  const P = 74;
  fillBackground(ctx, size, theme);

  // Header: wordmark + date
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

  // Activity type
  ctx.textAlign = "left";
  ctx.fillStyle = theme.text;
  ctx.font = `700 96px ${DISPLAY}`;
  ctx.fillText(TYPE_LABEL[activity.type], P, 250);

  // Route
  drawRoute(ctx, { x: P, y: 300, w: size - 2 * P, h: 440 }, activity.route, theme);

  // Stats row
  const dist = fmtDistance(activity.distance);
  const y = 850;
  const col = (size - 2 * P) / 3;
  stat(ctx, P, y, "Distancia", dist.value, dist.unit, theme);
  stat(ctx, P + col, y, "Tiempo", fmtTime(activity.duration), "", theme);
  stat(ctx, P + col * 2, y, "Ritmo", fmtPace(paceSecPerKm(activity.distance, activity.duration)), "/km", theme);

  // Footer line
  ctx.textAlign = "left";
  ctx.fillStyle = theme.sub;
  ctx.font = `500 28px ${SANS}`;
  ctx.fillText(
    `${speedKmh(activity.distance, activity.duration).toFixed(1)} km/h promedio`,
    P,
    size - P + 6,
  );
}
