<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSONSource, Map as MlMap } from "maplibre-gl";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { type BasemapLook, VECTOR_STYLE } from "../../../shared/basemap";
import { loadMaplibre } from "../../../shared/maplibre";
import { routeSegments } from "../domain/segments";
import type { TrackPoint } from "../domain/track-point";

/**
 * Route on the OpenFreeMap vector basemap, drawn by MapLibre alone. (The first
 * version layered MapLibre inside Leaflet; on Android that pair ran the WebView
 * out of memory and the map went blank — the emulator showed the OS killing the
 * app.) Same contract as RouteMapLeaflet: props, `tap`, `recenter()`. Emits
 * `failed` if the map can't load so the wrapper can fall back to raster.
 */
const props = defineProps<{ points: TrackPoint[]; fill?: boolean }>();
const emit = defineEmits<{ tap: []; failed: [reason: string] }>();

function isDark(): boolean {
  const attr = globalThis.document?.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}
const dark = isDark();
const look: BasemapLook = dark ? "dark" : "light";
const casingColor = dark ? "#0a0c0d" : "#ffffff";

/** How long the map gets to load its style before we give up on it. */
const LOAD_TIMEOUT_MS = 12_000;

const host = ref<HTMLElement | null>(null);
const hasRoute = ref(false);

let map: MlMap | null = null;
let loaded = false;
let fitted = false;
let disposed = false;
let resizeObs: ResizeObserver | null = null;

function accent(): string {
  const v = host.value && getComputedStyle(host.value).getPropertyValue("--accent").trim();
  return v || "#12A150";
}

/** Route as a MultiLineString — one line per continuous segment, so a pause
 *  never bridges as a straight line — plus the start/end points. */
function routeData(): { line: GeoJSON.Feature; ends: GeoJSON.FeatureCollection } {
  const segs = routeSegments(props.points).map((seg) => seg.map((p) => [p.lng, p.lat]));
  const first = props.points[0];
  const last = props.points.at(-1);
  return {
    line: { type: "Feature", properties: {}, geometry: { type: "MultiLineString", coordinates: segs } },
    ends: {
      type: "FeatureCollection",
      features: [
        ...(first ? [{ type: "Feature" as const, properties: { r: "s" }, geometry: { type: "Point" as const, coordinates: [first.lng, first.lat] } }] : []),
        ...(last ? [{ type: "Feature" as const, properties: { r: "e" }, geometry: { type: "Point" as const, coordinates: [last.lng, last.lat] } }] : []),
      ],
    },
  };
}

function addRouteLayers(m: MlMap): void {
  const { line, ends } = routeData();
  const color = accent();
  m.addSource("route", { type: "geojson", data: line });
  m.addSource("ends", { type: "geojson", data: ends });
  m.addLayer({
    id: "route-casing",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": casingColor, "line-width": 8, "line-opacity": 0.9 },
  });
  m.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": color, "line-width": 4 },
  });
  // Start = solid dot, end = hollow ring, so they stay distinct on a loop.
  m.addLayer({
    id: "ends",
    type: "circle",
    source: "ends",
    paint: {
      "circle-radius": ["match", ["get", "r"], "s", 6, 10],
      "circle-color": color,
      "circle-opacity": ["match", ["get", "r"], "s", 1, 0],
      "circle-stroke-width": ["match", ["get", "r"], "s", 2, 3],
      "circle-stroke-color": ["match", ["get", "r"], "s", casingColor, color],
    },
  });
}

function render(): void {
  hasRoute.value = props.points.length > 0;
  if (!map || !loaded || props.points.length === 0) return;
  const { line, ends } = routeData();
  (map.getSource("route") as GeoJSONSource | undefined)?.setData(line);
  (map.getSource("ends") as GeoJSONSource | undefined)?.setData(ends);
  // Frame the route ONCE, then leave the camera to the user — otherwise every
  // live fix would fight their pan/zoom.
  if (!fitted) {
    const pts = props.points;
    if (pts.length === 1) {
      map.jumpTo({ center: [pts[0]!.lng, pts[0]!.lat], zoom: 16 });
    } else {
      let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
      for (const p of pts) {
        w = Math.min(w, p.lng);
        e = Math.max(e, p.lng);
        s = Math.min(s, p.lat);
        n = Math.max(n, p.lat);
      }
      map.fitBounds([[w, s], [e, n]], { padding: 24, maxZoom: 17, duration: 0 });
    }
    fitted = true;
  }
}

onMounted(async () => {
  hasRoute.value = props.points.length > 0;
  let ml: typeof import("maplibre-gl");
  try {
    ml = await loadMaplibre();
  } catch (e) {
    emit("failed", `init: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  if (disposed || !host.value) return;
  let lastError = "";
  try {
    map = new ml.Map({
      container: host.value,
      style: VECTOR_STYLE[look],
      attributionControl: false,
      // Memory: cap the canvas at 2× (3× screens triple the GPU buffers), keep a
      // small tile cache, and skip world copies / 3D gestures we don't use.
      pixelRatio: Math.min(globalThis.devicePixelRatio || 1, 2),
      maxTileCacheSize: 60,
      renderWorldCopies: false,
      fadeDuration: 0,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      center: [0, 0],
      zoom: 1,
    });
  } catch (e) {
    emit("failed", `init: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  const m = map;
  m.touchZoomRotate.disableRotation();
  m.on("error", (e) => {
    lastError = e.error?.message ?? "error";
  });
  m.on("click", () => emit("tap"));
  const timer = setTimeout(() => {
    if (!loaded && !disposed) emit("failed", lastError || "el mapa vectorial no cargó a tiempo");
  }, LOAD_TIMEOUT_MS);
  m.once("load", () => {
    clearTimeout(timer);
    if (disposed) return;
    loaded = true;
    addRouteLayers(m);
    render();
  });
  m.on("webglcontextlost", () => emit("failed", "se perdió el contexto WebGL"));
  resizeObs = new ResizeObserver(() => map?.resize());
  resizeObs.observe(host.value);
});

/** Jump back to the current position (last fix), keeping a usable zoom. */
function recenter(): void {
  const last = props.points.at(-1);
  if (!map || !last) return;
  map.easeTo({ center: [last.lng, last.lat], zoom: Math.max(map.getZoom(), 16), duration: 300 });
}
defineExpose({ recenter });

watch(() => props.points, render, { deep: false });

onUnmounted(() => {
  disposed = true;
  resizeObs?.disconnect();
  resizeObs = null;
  map?.remove();
  map = null;
});
</script>

<template>
  <div class="map" :class="{ fill }">
    <div ref="host" class="canvas" />
    <div v-if="!hasRoute" class="empty">Esperando señal GPS…</div>
  </div>
</template>

<style scoped>
.map {
  position: relative;
  isolation: isolate;
  aspect-ratio: 3 / 2;
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.map.fill {
  aspect-ratio: auto;
  height: 100%;
  border: none;
  border-radius: 0;
}
.canvas {
  position: absolute;
  inset: 0;
  background: var(--surface);
}
.empty {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--muted);
  background: var(--surface);
}
</style>
