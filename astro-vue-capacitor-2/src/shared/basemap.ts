/**
 * Basemap provider — which tile service draws the street map under routes, for
 * both the activity map (tracking) and the share-card map styles. Switchable in
 * Ajustes → Apariencia and persisted.
 *
 * - "vector": OpenFreeMap vector tiles (free, keyless, no limits). Drawn on the
 *   device by MapLibre, so it's sharp at any zoom and pixel density and has
 *   street names. Default.
 * - "esri": Esri's keyless raster tiles. Lighter (no WebGL), but blurry past
 *   z16 and on high-DPI screens. The fallback when WebGL isn't available.
 *
 * (CARTO, the old provider, now serves "API KEY REQUIRED" tiles without a key.)
 */

import { atom } from "nanostores";

export type BasemapProvider = "vector" | "esri";

/** Light/dark street map, plus a colorful one for the default share style. */
export type BasemapLook = "light" | "dark" | "color";

const KEY = "rastro.basemap";
export const DEFAULT_BASEMAP: BasemapProvider = "vector";

function read(): BasemapProvider {
  try {
    const v = globalThis.localStorage?.getItem(KEY);
    return v === "vector" || v === "esri" ? v : DEFAULT_BASEMAP;
  } catch {
    return DEFAULT_BASEMAP;
  }
}

export const $basemap = atom<BasemapProvider>(read());

export function setBasemap(provider: BasemapProvider): void {
  $basemap.set(provider);
  try {
    globalThis.localStorage?.setItem(KEY, provider);
  } catch {
    // ignore — private mode / SSR
  }
}

/**
 * Why the vector basemap last failed and fell back to raster (null once it
 * loads fine). Shown under the map setting so a blank map can be diagnosed.
 */
export const $basemapError = atom<string | null>(null);

export function reportBasemapError(reason: string | null): void {
  $basemapError.set(reason);
}

const OFM = "https://tiles.openfreemap.org/styles";
/** OpenFreeMap MapLibre style URLs. */
export const VECTOR_STYLE: Record<BasemapLook, string> = {
  light: `${OFM}/positron`,
  dark: `${OFM}/dark`,
  color: `${OFM}/liberty`,
};

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
/** Esri raster tile templates ({z}/{y}/{x} order). */
export const ESRI_TILES: Record<BasemapLook, string> = {
  light: `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
  dark: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
  color: `${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`,
};
/** Esri's native max zoom per look (the gray canvases stop at 16). */
export const ESRI_MAXZOOM: Record<BasemapLook, number> = { light: 16, dark: 16, color: 19 };

export const VECTOR_ATTRIB = "© OpenFreeMap · OpenMapTiles · OpenStreetMap";
export const ESRI_ATTRIB = "© Esri · HERE · Garmin · OpenStreetMap";
