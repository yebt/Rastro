/**
 * Route-on-real-map renderer for the "Mapa" share backgrounds. Renders a CARTO /
 * OpenTopoMap raster basemap + the route into an OFF-SCREEN, non-interactive map
 * and captures the canvas. The route is ALWAYS auto-fit (centered) unless an
 * explicit camera `view` is given, so switching styles just re-renders fast with
 * the track still centered — the interactive editor only tweaks the framing.
 *
 * MapLibre is dynamically imported (same working setup as MapEditor.vue), so it
 * stays out of the base bundle and the worker is wired correctly for Vite.
 */

import type { TrackPoint } from "../tracking";
import type { MapCamera, MapStyleId } from "./themes";

const TILE_URL: Record<MapStyleId, string> = {
  dark: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  light: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  voyager: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
  topo: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
};

// Cache rendered map canvases so re-rendering the card for a non-map change
// (text color, effect, layout) reuses the map instead of re-fetching tiles.
const mapCache = new Map<string, HTMLCanvasElement>();
const CACHE_MAX = 4;

function cacheKey(w: number, h: number, style: MapStyleId, color: string, view?: MapCamera | null): string {
  const v = view ? `${view.zoom.toFixed(2)},${view.bearing.toFixed(0)},${view.pitch.toFixed(0)},${view.center[0].toFixed(4)},${view.center[1].toFixed(4)}` : "fit";
  return `${w}x${h}|${style}|${color}|${v}`;
}

/** Break the track into segments at pauses (big time gaps) so the line doesn't
 *  draw a straight bridge across a pause. */
function segments(points: TrackPoint[]): [number, number][][] {
  const segs: [number, number][][] = [];
  let cur: [number, number][] = [];
  points.forEach((p, i) => {
    if (i > 0 && p.t - points[i - 1]!.t > 10_000) {
      if (cur.length > 1) segs.push(cur);
      cur = [];
    }
    cur.push([p.lng, p.lat]);
  });
  if (cur.length > 1) segs.push(cur);
  return segs;
}

/**
 * Render the route on a real map to a canvas of `w`×`h`. Returns null on any
 * failure (offline, WebGL blocked, tiles blocked) so the caller can fall back.
 */
export async function renderRouteMap(
  points: TrackPoint[],
  w: number,
  h: number,
  styleId: MapStyleId,
  routeColor: string,
  startColor: string,
  view?: MapCamera | null,
): Promise<HTMLCanvasElement | null> {
  if (points.length < 2) return null;
  if (typeof document === "undefined") return null;

  const ckey = cacheKey(w, h, styleId, routeColor, view);
  const cached = mapCache.get(ckey);
  if (cached) return cached;

  const ml = await import("maplibre-gl");
  const isTopo = styleId === "topo";
  const segs = segments(points);
  const all = points.map((p) => [p.lng, p.lat] as [number, number]);

  // On-screen but hidden (fully off-screen WebGL gets throttled to a blank
  // capture in some WebViews), behind everything, non-interactive.
  const container = document.createElement("div");
  container.style.cssText = `position:fixed;top:0;left:0;width:${w}px;height:${h}px;z-index:-1;opacity:0.01;pointer-events:none;`;
  document.body.appendChild(container);

  const map = new ml.Map({
    container,
    interactive: false,
    attributionControl: false,
    canvasContextAttributes: { preserveDrawingBuffer: true },
    fadeDuration: 0,
    style: {
      version: 8,
      sources: {
        carto: {
          type: "raster",
          tiles: [TILE_URL[styleId]],
          tileSize: 256,
          maxzoom: isTopo ? 17 : 20,
          attribution: isTopo ? "© OpenTopoMap (CC-BY-SA)" : "© OpenStreetMap · CARTO",
        },
      },
      layers: [{ id: "carto", type: "raster", source: "carto" }],
    },
  });

  const cleanup = (): void => {
    try {
      map.remove();
    } catch {
      /* ignore */
    }
    container.remove();
  };

  return new Promise<HTMLCanvasElement | null>((resolve) => {
    let settled = false;
    const finish = (value: HTMLCanvasElement | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      resolve(value);
    };

    const capture = (): void => {
      if (settled) return;
      try {
        map.redraw?.();
        const out = document.createElement("canvas");
        out.width = w;
        out.height = h;
        const ctx = out.getContext("2d");
        if (!ctx) return finish(null);
        // Tiles from the WebGL buffer, scaled to the card size.
        ctx.drawImage(map.getCanvas(), 0, 0, w, h);
        // The route is drawn in 2D via the map's own projection — WebGL line
        // layers do NOT survive the canvas readback in the WebView, so we never
        // rely on them; this is what guarantees the track always shows.
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        const lw = Math.max(4, w * 0.0085);
        const trace = (color: string, width: number, alpha: number): void => {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          for (const seg of segs) {
            ctx.beginPath();
            seg.forEach((c, i) => {
              const p = map.project(c);
              if (i === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
          }
          ctx.restore();
        };
        trace("#000000", lw * 2.3, 0.45); // dark halo (reads on light basemaps)
        trace("#ffffff", lw * 1.6, 0.9); // white casing (reads on dark basemaps)
        trace(routeColor, lw, 1); // the route
        const s = map.project(all[0]!);
        ctx.beginPath();
        ctx.arc(s.x, s.y, lw * 1.35, 0, Math.PI * 2);
        ctx.fillStyle = startColor;
        ctx.fill();
        ctx.lineWidth = lw * 0.5;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        const e = map.project(all[all.length - 1]!);
        ctx.beginPath();
        ctx.arc(e.x, e.y, lw * 1.55, 0, Math.PI * 2);
        ctx.lineWidth = lw * 0.6;
        ctx.strokeStyle = routeColor;
        ctx.stroke();
        if (mapCache.size >= CACHE_MAX) {
          const oldest = mapCache.keys().next().value;
          if (oldest) mapCache.delete(oldest);
        }
        mapCache.set(ckey, out);
        finish(out);
      } catch {
        finish(null);
      }
    };

    // Never hang: capture whatever painted after 8s even if idle never fires.
    const timer = setTimeout(capture, 8000);

    map.on("load", () => {
      try {
        // Only frame the basemap here; the route is drawn in 2D at capture time.
        if (view) {
          map.jumpTo({ center: view.center, zoom: view.zoom, bearing: view.bearing, pitch: view.pitch });
        } else {
          const b = new ml.LngLatBounds(all[0]!, all[0]!);
          for (const c of all) b.extend(c);
          map.fitBounds(b, { padding: Math.round(Math.min(w, h) * 0.12), duration: 0 });
        }
        map.once("idle", capture);
      } catch {
        finish(null);
      }
    });

    map.on("error", () => {
      /* keep waiting for idle/timeout; capture handles the fallback */
    });
  });
}
