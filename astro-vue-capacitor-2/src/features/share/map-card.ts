/**
 * Render a CARTO street map with the route baked in, as a PNG data URL, to use
 * as a share-card background. MapLibre is dynamically imported so it never
 * inflates the base bundle — the map mode is opt-in. Tiles are remote (this is
 * the one share mode that needs network); when offline the route line still
 * renders over the basemap's flat background color, so it degrades gracefully.
 */

import type { TrackPoint } from "../tracking";
import type { MapStyleId } from "./themes";

const TILES: Record<MapStyleId, string> = {
  dark: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  light: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  voyager: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
};

export interface MapRenderOptions {
  style: MapStyleId;
  pitch: number;
  bearing: number;
  routeColor: string;
  startColor: string;
  endColor: string;
  bgColor: string;
}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Returns a PNG data URL of the map+route sized WxH, or null if it can't render
 * (no WebGL / hard failure) so the caller can fall back to a solid background.
 */
export async function renderMapBackground(
  points: TrackPoint[],
  W: number,
  H: number,
  opts: MapRenderOptions,
): Promise<string | null> {
  if (points.length < 2 || typeof document === "undefined") return null;

  let map: import("maplibre-gl").Map | null = null;
  let container: HTMLDivElement | null = null;
  try {
    const ml = await import("maplibre-gl");

    container = document.createElement("div");
    container.style.cssText = `position:fixed;left:-99999px;top:0;width:${W / 2}px;height:${H / 2}px;`;
    document.body.appendChild(container);

    const coords = points.map((p) => [p.lng, p.lat] as [number, number]);
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    map = new ml.Map({
      container,
      pixelRatio: 2,
      interactive: false,
      attributionControl: false,
      // required for toDataURL() — moved under canvasContextAttributes in v5+
      canvasContextAttributes: { preserveDrawingBuffer: true },
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: [TILES[opts.style]],
            tileSize: 256,
            attribution: "© OpenStreetMap · CARTO",
          },
        },
        layers: [
          { id: "bg", type: "background", paint: { "background-color": opts.bgColor } },
          { id: "carto", type: "raster", source: "carto" },
        ],
      },
    });

    const m = map;
    await new Promise<void>((res) => m.on("load", () => res()));

    m.addSource("route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } },
    });
    m.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": opts.routeColor, "line-width": 6 },
    });
    m.addSource("ends", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          { type: "Feature", properties: { role: "start" }, geometry: { type: "Point", coordinates: coords[0]! } },
          { type: "Feature", properties: { role: "end" }, geometry: { type: "Point", coordinates: coords[coords.length - 1]! } },
        ],
      },
    });
    m.addLayer({
      id: "ends-dots",
      type: "circle",
      source: "ends",
      paint: {
        "circle-radius": 7,
        "circle-color": ["match", ["get", "role"], "start", opts.startColor, opts.endColor],
        "circle-stroke-width": 3,
        "circle-stroke-color": opts.routeColor,
      },
    });

    m.setPitch(opts.pitch);
    m.setBearing(opts.bearing);
    m.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 90, duration: 0 });

    // Wait for tiles to settle, but never hang offline.
    await Promise.race([new Promise<void>((res) => m.once("idle", () => res())), delay(9000)]);

    return m.getCanvas().toDataURL("image/png");
  } catch {
    return null;
  } finally {
    map?.remove();
    container?.remove();
  }
}
