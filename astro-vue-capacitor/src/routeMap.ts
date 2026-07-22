/**
 * Offscreen route-on-real-map renderer for the "Mapa" share theme (online only).
 * Renders CARTO/OSM raster tiles + the route with MapLibre GL into a detached
 * container, captures the WebGL canvas, and returns it — or null on any failure
 * (offline, tiles blocked, timeout) so the caller can fall back to a flat theme.
 *
 * MapLibre + its CSS are only pulled in when this module is dynamically imported
 * (i.e. only when the user picks the Mapa theme), keeping the base bundle lean.
 */

import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds, Map as MlMap, type StyleSpecification } from "maplibre-gl";
import type { RouteTuple } from "./lib/types";

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

  // On-screen but behind the (opaque) share overlay and nearly transparent:
  // fully off-screen containers get their WebGL paint throttled in some WebViews,
  // which would capture a blank map.
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

    // Grab whatever the WebGL canvas currently holds (needs a loaded style).
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

    // Fallback: capture (or bail) even if the map never reports "idle".
    const timer = setTimeout(capture, 7000);

    // Per-tile errors are transient — log but don't abort; the timeout decides.
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
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#1b4dff", "line-width": 7 },
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
