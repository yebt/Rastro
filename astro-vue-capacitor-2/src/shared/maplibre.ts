/**
 * Single entry point for loading MapLibre. Its worker script isn't part of the
 * Vite bundle (see `maplibreWorker` in astro.config.mjs), so point MapLibre at
 * the copy served from /maplibre/ before any map is created — without this the
 * worker 404s in the built app and vector basemaps render blank.
 */

export type MapLibre = typeof import("maplibre-gl");

let loading: Promise<MapLibre> | null = null;

export function loadMaplibre(): Promise<MapLibre> {
  loading ??= import("maplibre-gl").then((ml) => {
    const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
    ml.setWorkerUrl(new URL(`${base}maplibre/maplibre-gl-worker.mjs`, globalThis.location.href).href);
    return ml;
  });
  return loading;
}
