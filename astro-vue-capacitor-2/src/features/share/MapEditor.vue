<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { AppButton, Spinner } from "../../shared/ui";
import type { TrackPoint } from "../tracking";
import type { MapCamera, MapStyleId } from "./themes";

/**
 * Interactive map framing for a share card. A real, on-screen MapLibre map (so
 * WebGL renders reliably) sized to the card's aspect: the user drags to move,
 * pinches to zoom, and uses two fingers to rotate and tilt. "Listo" captures the
 * framed view (route baked in) plus the camera, so the card is exactly what was
 * seen and the editor can reopen on the same framing.
 */
const props = defineProps<{
  points: TrackPoint[];
  mapStyle: MapStyleId;
  aspectW: number;
  aspectH: number;
  routeColor: string;
  startColor: string;
  endColor: string;
  camera?: MapCamera | null;
  /** Bumps each time the parent (re)opens the kept-alive editor. */
  openId?: number;
}>();
const emit = defineEmits<{ done: [payload: { view: MapCamera }]; cancel: [] }>();

const TILE_URL: Record<MapStyleId, string> = {
  dark: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  light: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  voyager: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
  // Real cartographic map with contour lines (free, no key; max zoom 17).
  topo: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
};

const host = ref<HTMLDivElement | null>(null);
const loading = ref(true);
let ml: typeof import("maplibre-gl") | null = null;
let map: import("maplibre-gl").Map | null = null;
let coords: [number, number][] = [];

function buildStyle(styleId: MapStyleId): import("maplibre-gl").StyleSpecification {
  const isTopo = styleId === "topo";
  return {
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
  };
}

/** (Re)add the route + markers on top of the current basemap. setStyle wipes
 *  layers, so this runs on first load and after every style swap. */
function addRouteLayers(m: import("maplibre-gl").Map): void {
  if (m.getSource("route")) return;
  m.addSource("route", {
    type: "geojson",
    data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } },
  });
  m.addLayer({
    id: "route-halo",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#000000", "line-width": 13, "line-opacity": 0.45, "line-blur": 3 },
  });
  m.addLayer({
    id: "route-casing",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.9 },
  });
  m.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": props.routeColor, "line-width": 5.5 },
  });
  m.addSource("ends", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { r: "s" }, geometry: { type: "Point", coordinates: coords[0]! } },
        { type: "Feature", properties: { r: "e" }, geometry: { type: "Point", coordinates: coords[coords.length - 1]! } },
      ],
    },
  });
  m.addLayer({
    id: "ends",
    type: "circle",
    source: "ends",
    paint: {
      "circle-radius": ["match", ["get", "r"], "s", 6, 9],
      "circle-color": props.startColor,
      "circle-opacity": ["match", ["get", "r"], "s", 1, 0],
      "circle-stroke-width": ["match", ["get", "r"], "s", 2, 3],
      "circle-stroke-color": ["match", ["get", "r"], "s", "#ffffff", props.routeColor],
    },
  });
}

/** Jump to the stored framing (converted from card zoom), or fit the route. */
function applyFraming(): void {
  if (!map || !ml) return;
  if (props.camera) {
    map.jumpTo({
      center: props.camera.center,
      zoom: props.camera.zoom - zoomOffset(),
      bearing: props.camera.bearing,
      pitch: props.camera.pitch,
    });
  } else if (coords.length >= 2) {
    const b = new ml.LngLatBounds(coords[0]!, coords[0]!);
    for (const c of coords) b.extend(c);
    map.fitBounds(b, { padding: 36, duration: 0 });
  }
}

function sizeBox(): void {
  const el = host.value;
  if (!el) return;
  const availW = window.innerWidth * 0.92;
  const availH = window.innerHeight * 0.6;
  const ar = props.aspectW / props.aspectH;
  let w = availW;
  let h = w / ar;
  if (h > availH) {
    h = availH;
    w = h * ar;
  }
  el.style.width = `${Math.round(w)}px`;
  el.style.height = `${Math.round(h)}px`;
}

function onResize(): void {
  sizeBox();
  map?.resize();
}

onMounted(async () => {
  sizeBox();
  ml = await import("maplibre-gl");
  coords = props.points.map((p) => [p.lng, p.lat] as [number, number]);

  map = new ml.Map({
    container: host.value!,
    canvasContextAttributes: { preserveDrawingBuffer: true },
    attributionControl: false,
    dragRotate: true,
    pitchWithRotate: true,
    style: buildStyle(props.mapStyle),
  });
  const m = map;
  m.touchZoomRotate.enableRotation();
  await new Promise<void>((res) => m.on("load", () => res()));

  m.addSource("route", {
    type: "geojson",
    data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } },
  });
  // Three stacked strokes so the route reads over ANY basemap (dark, light,
  // voyager, topo): a soft dark halo, a white casing, then the colored line.
  m.addLayer({
    id: "route-halo",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#000000", "line-width": 13, "line-opacity": 0.45, "line-blur": 3 },
  });
  m.addLayer({
    id: "route-casing",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.9 },
  });
  m.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": props.routeColor, "line-width": 5.5 },
  });
  m.addSource("ends", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { r: "s" }, geometry: { type: "Point", coordinates: coords[0]! } },
        { type: "Feature", properties: { r: "e" }, geometry: { type: "Point", coordinates: coords[coords.length - 1]! } },
      ],
    },
  });
  m.addLayer({
    id: "ends",
    type: "circle",
    source: "ends",
    paint: {
      // Start = solid dot, end = hollow ring, so they stay distinct on a loop.
      "circle-radius": ["match", ["get", "r"], "s", 6, 9],
      "circle-color": props.startColor,
      "circle-opacity": ["match", ["get", "r"], "s", 1, 0],
      "circle-stroke-width": ["match", ["get", "r"], "s", 2, 3],
      "circle-stroke-color": ["match", ["get", "r"], "s", "#ffffff", props.routeColor],
    },
  });

  if (props.camera) {
    // The stored zoom is for the CARD viewport; the editor viewport is smaller,
    // so subtract the size ratio (log2) to show the same framing here.
    m.jumpTo({
      center: props.camera.center,
      zoom: props.camera.zoom - zoomOffset(),
      bearing: props.camera.bearing,
      pitch: props.camera.pitch,
    });
  } else if (coords.length >= 2) {
    const b = new ml.LngLatBounds(coords[0]!, coords[0]!);
    for (const c of coords) b.extend(c);
    m.fitBounds(b, { padding: 36, duration: 0 });
  }
  // Clear the spinner on idle OR after a timeout, so a slow/blocked tile server
  // never leaves the editor stuck loading — you can still frame the route.
  const settle = (): void => {
    loading.value = false;
  };
  m.once("idle", settle);
  setTimeout(settle, 5000);
  window.addEventListener("resize", onResize);
});

// Keep-alive: the parent keeps this mounted (v-show) so MapLibre isn't recreated
// on every open. Re-measure + re-frame when it reopens; swap the basemap on a
// style change without rebuilding the whole map.
watch(
  () => props.openId,
  () => {
    if (!map) return;
    loading.value = false;
    map.resize();
    applyFraming();
  },
);
watch(
  () => props.mapStyle,
  (style) => {
    if (!map) return;
    loading.value = true;
    map.setStyle(buildStyle(style));
    const onStyle = (): void => {
      if (!map || !map.isStyleLoaded()) return;
      map.off("styledata", onStyle);
      addRouteLayers(map);
      applyFraming();
      const clearLoading = (): void => {
        loading.value = false;
      };
      map.once("idle", clearLoading);
      setTimeout(clearLoading, 5000);
    };
    map.on("styledata", onStyle);
  },
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  map?.remove();
});

function toggleTilt(): void {
  map?.easeTo({ pitch: (map.getPitch() ?? 0) > 5 ? 0 : 55, duration: 300 });
}
function resetView(): void {
  map?.easeTo({ pitch: 0, bearing: 0, duration: 300 });
}

function centerRoute(): void {
  if (!map || coords.length < 2) return;
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
  map.easeTo({ bearing: 0, pitch: 0, duration: 250 });
  map.fitBounds(
    [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    { padding: 36, duration: 300 },
  );
}

/** log2 of card-width / editor-width. MapLibre zoom is viewport-pixel-relative,
 *  so the small editor and the large card show different areas at the same zoom;
 *  this offset converts between the two so what you frame is what you get. */
function zoomOffset(): number {
  const hostW = host.value?.clientWidth ?? props.aspectW;
  if (!hostW) return 0;
  return Math.log2(props.aspectW / hostW);
}

function done(): void {
  if (!map) return;
  const c = map.getCenter();
  // Store the zoom for the CARD viewport (editor zoom + the size offset), so the
  // rendered card matches exactly what was framed here.
  const view: MapCamera = {
    center: [c.lng, c.lat],
    zoom: map.getZoom() + zoomOffset(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
  emit("done", { view });
}
</script>

<template>
  <div class="editor">
    <div class="frame">
      <div ref="host" class="map"></div>
      <div v-if="loading" class="loading"><Spinner size="28px" /></div>
    </div>
    <div class="mapctl">
      <button type="button" class="mc" @click="centerRoute">Centrar ruta</button>
      <button type="button" class="mc" @click="toggleTilt">Inclinar 3D</button>
      <button type="button" class="mc" @click="resetView">Aplanar</button>
    </div>
    <p class="hint">Arrastrá para mover · pellizcá para zoom · dos dedos para rotar e inclinar</p>
    <div class="actions">
      <AppButton size="lg" variant="ghost" @press="emit('cancel')">Cancelar</AppButton>
      <AppButton size="lg" icon="check" :disabled="loading" @press="done">Listo</AppButton>
    </div>
  </div>
</template>

<style scoped>
.editor {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-4);
  padding: calc(var(--safe-t) + var(--sp-4)) var(--sp-4) calc(var(--safe-b) + var(--sp-4));
  background: color-mix(in srgb, black 88%, transparent);
  backdrop-filter: blur(4px);
}
.frame {
  position: relative;
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line-2);
  box-shadow: var(--shadow-2);
}
.map {
  width: 300px;
  height: 300px;
}
.map :deep(.maplibregl-canvas) {
  outline: none;
}
.loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: var(--bg);
}
.mapctl {
  display: flex;
  gap: var(--sp-2);
}
.mc {
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--r-pill);
  border: 1px solid color-mix(in srgb, white 30%, transparent);
  background: color-mix(in srgb, white 8%, transparent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}
.mc:active {
  background: color-mix(in srgb, white 16%, transparent);
}
.hint {
  margin: 0;
  max-width: 340px;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: color-mix(in srgb, white 74%, transparent);
}
.actions {
  display: flex;
  gap: var(--sp-3);
}
</style>
