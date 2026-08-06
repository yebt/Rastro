/**
 * Render a CARTO street map with the route drawn on top, as a PNG data URL, to
 * use as a share-card background.
 *
 * A STATIC TILE MOSAIC, not a live GL map: we pick a zoom that frames the route,
 * fetch the handful of covering tiles (cache-first via the tile service worker),
 * composite them, then draw the route in the SAME Web-Mercator projection so it
 * lines up with the streets at any route length. No WebGL, no idle waiting — so
 * it's fast and reliable, and the route is always visible.
 */

import type { TrackPoint } from "../tracking";
import type { MapStyleId } from "./themes";

const TILE_PATH: Record<MapStyleId, string> = {
  dark: "dark_all",
  light: "light_all",
  voyager: "rastertiles/voyager",
};
const SUBDOMAINS = ["a", "b", "c", "d"];
const TILE = 256;

export interface MapRenderOptions {
  style: MapStyleId;
  /** Zoom offset from the auto-fit level. */
  zoom: number;
  /** Framing pan in card pixels. */
  offsetX: number;
  offsetY: number;
  routeColor: string;
  startColor: string;
  endColor: string;
  bgColor: string;
}

/** Web-Mercator world pixel for a lng/lat at zoom z. */
function project(lng: number, lat: number, z: number): { x: number; y: number } {
  const n = TILE * 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return { x, y };
}

function tileUrl(style: MapStyleId, z: number, x: number, y: number): string {
  const sd = SUBDOMAINS[(x + y) % SUBDOMAINS.length];
  return `https://${sd}.basemaps.cartocdn.com/${TILE_PATH[style]}/${z}/${x}/${y}.png`;
}

function loadTile(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // keep the canvas untainted for toDataURL()
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // a missing tile just leaves the bg color
    img.src = url;
  });
}

/** Largest zoom at which the route's bbox fits within (W-pad)×(H-pad). */
function fitZoom(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
  W: number,
  H: number,
  pad: number,
): number {
  for (let z = 18; z >= 1; z--) {
    const a = project(minLng, maxLat, z);
    const b = project(maxLng, minLat, z);
    if (Math.abs(b.x - a.x) <= W - pad && Math.abs(b.y - a.y) <= H - pad) return z;
  }
  return 1;
}

/**
 * Returns a PNG data URL (WxH) of the map + route, or null on hard failure
 * (e.g. tiles blocked) so the caller can fall back to a solid background.
 */
export async function renderMapBackground(
  points: TrackPoint[],
  W: number,
  H: number,
  opts: MapRenderOptions,
): Promise<string | null> {
  if (points.length < 2 || typeof document === "undefined") return null;

  try {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const p of points) {
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
    }

    const z = Math.max(1, Math.min(18, fitZoom(minLng, minLat, maxLng, maxLat, W, H, 120) + opts.zoom));

    // Framing: center on the route bbox, plus the user's pan.
    const c = project((minLng + maxLng) / 2, (minLat + maxLat) / 2, z);
    const originX = c.x - W / 2 - opts.offsetX;
    const originY = c.y - H / 2 - opts.offsetY;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = opts.bgColor;
    ctx.fillRect(0, 0, W, H);

    // Tiles covering the viewport.
    const world = TILE * 2 ** z;
    const maxTile = 2 ** z;
    const txMin = Math.floor(originX / TILE);
    const txMax = Math.floor((originX + W) / TILE);
    const tyMin = Math.max(0, Math.floor(originY / TILE));
    const tyMax = Math.min(maxTile - 1, Math.floor((originY + H) / TILE));

    const jobs: Promise<void>[] = [];
    for (let tx = txMin; tx <= txMax; tx++) {
      const wx = ((tx % maxTile) + maxTile) % maxTile; // wrap longitude
      for (let ty = tyMin; ty <= tyMax; ty++) {
        const dx = tx * TILE - originX;
        const dy = ty * TILE - originY;
        jobs.push(
          loadTile(tileUrl(opts.style, z, wx, ty)).then((img) => {
            if (img) ctx.drawImage(img, dx, dy, TILE, TILE);
          }),
        );
      }
    }
    await Promise.all(jobs);

    // Route, projected the same way so it aligns with the streets.
    const px = (p: TrackPoint): [number, number] => {
      const w = project(p.lng, p.lat, z);
      // choose the longitude copy nearest the origin (dateline safety)
      let x = w.x - originX;
      if (x < -world / 2) x += world;
      if (x > world / 2) x -= world;
      return [x, w.y - originY];
    };

    ctx.strokeStyle = opts.routeColor;
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    points.forEach((p, i) => {
      const [x, y] = px(p);
      // Break at a pause (big time gap) so it doesn't bridge as a straight line.
      const paused = i > 0 && p.t - points[i - 1]!.t > 10_000;
      if (i === 0 || paused) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const dot = (p: TrackPoint, fill: string): void => {
      const [x, y] = px(p);
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = opts.routeColor;
      ctx.stroke();
    };
    dot(points[0]!, opts.startColor);
    dot(points[points.length - 1]!, opts.endColor);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
