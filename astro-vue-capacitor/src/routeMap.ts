/**
 * Route-on-real-map renderer for the "Mapa" share theme (online only), via
 * MapLibre GL. Renders a CARTO vector basemap + the route into an offscreen map
 * and captures the canvas.
 *
 * The worker is wired the way the MapLibre docs require for Vite (`?worker&url`
 * + setWorkerUrl) — a plain import serves maplibre-gl-worker.mjs with a bad MIME
 * type and the map hangs. astro.config also sets ssr.noExternal:['maplibre-gl'].
 *
 * Lazy-imported (only when the user picks the Mapa theme), so MapLibre stays out
 * of the base bundle. Returns { error } on any failure so the caller can report it.
 */

import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds, Map as MlMap, setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { RouteTuple } from "./lib/types";

setWorkerUrl(workerUrl);

// Raster style: CARTO Voyager tiles already include streets/labels, so there
// are no vector glyphs/sprites/tiles to fail — the map always paints.
const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap · © CARTO",
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};

export type MapResult = HTMLCanvasElement | { error: string };

function webglSupported(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export async function renderRouteMap(route: RouteTuple[], size: number): Promise<MapResult> {
  if (route.length < 2) return { error: "ruta sin puntos" };
  if (!webglSupported()) return { error: "WebGL no disponible en el WebView" };

  // On-screen but behind the (opaque) share overlay: fully off-screen containers
  // get their WebGL paint throttled in some WebViews → blank capture.
  const container = document.createElement("div");
  container.style.cssText = `position:fixed;top:0;left:0;width:${size}px;height:${size}px;z-index:-1;opacity:0.01;pointer-events:none;`;
  document.body.appendChild(container);

  const coords = route.map((p) => [p[1], p[0]] as [number, number]);
  const map = new MlMap({
    container,
    style: STYLE,
    interactive: false,
    attributionControl: false,
    canvasContextAttributes: { preserveDrawingBuffer: true },
    fadeDuration: 0,
    pixelRatio: 1,
  });

  const cleanup = (): void => {
    try {
      map.remove();
    } catch {
      /* ignore */
    }
    container.remove();
  };

  return new Promise<MapResult>((resolve) => {
    let settled = false;
    let lastError = "";
    const finish = (value: MapResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      resolve(value);
    };

    const capture = (): void => {
      if (settled) return;
      if (!map.isStyleLoaded()) {
        return finish({ error: lastError || "estilo no cargó (¿sin conexión / tiles bloqueados?)" });
      }
      try {
        const out = document.createElement("canvas");
        out.width = size;
        out.height = size;
        const ctx = out.getContext("2d");
        if (!ctx) return finish({ error: "canvas 2D" });
        ctx.drawImage(map.getCanvas(), 0, 0, size, size);
        finish(out);
      } catch (e) {
        finish({ error: `captura: ${String(e).slice(0, 60)}` });
      }
    };

    const timer = setTimeout(capture, 8000);

    map.on("error", (e) => {
      lastError = e.error?.message ?? String(e);
      console.warn("[routeMap] map error", lastError);
    });

    map.on("load", () => {
      try {
        map.addSource("route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } },
        });
        map.addLayer({
          id: "route-casing",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#ffffff", "line-width": 11 },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#1b4dff", "line-width": 6 },
        });
        const bounds = new LngLatBounds(coords[0]!, coords[0]!);
        for (const c of coords) bounds.extend(c);
        map.fitBounds(bounds, { padding: Math.round(size * 0.12), duration: 0 });
        map.once("idle", capture);
      } catch (e) {
        finish({ error: `capa ruta: ${String(e).slice(0, 60)}` });
      }
    });
  });
}
