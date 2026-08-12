<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";
import { onBeforeUnmount, onMounted, ref } from "vue";
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
}>();
const emit = defineEmits<{ done: [payload: { src: string; camera: MapCamera }]; cancel: [] }>();

const TILE_PATH: Record<MapStyleId, string> = {
  dark: "dark_all",
  light: "light_all",
  voyager: "rastertiles/voyager",
};

const host = ref<HTMLDivElement | null>(null);
const loading = ref(true);
let map: import("maplibre-gl").Map | null = null;

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
  const ml = await import("maplibre-gl");
  const coords = props.points.map((p) => [p.lng, p.lat] as [number, number]);
  // Canonical CARTO host (no {s} subdomains — those are deprecated).
  const tiles = [`https://basemaps.cartocdn.com/${TILE_PATH[props.mapStyle]}/{z}/{x}/{y}.png`];

  map = new ml.Map({
    container: host.value!,
    canvasContextAttributes: { preserveDrawingBuffer: true }, // for toDataURL()
    attributionControl: false,
    dragRotate: true,
    pitchWithRotate: true,
    style: {
      version: 8,
      sources: {
        carto: { type: "raster", tiles, tileSize: 256, attribution: "© OpenStreetMap · CARTO" },
      },
      layers: [{ id: "carto", type: "raster", source: "carto" }],
    },
  });
  const m = map;
  m.touchZoomRotate.enableRotation();
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
    paint: { "line-color": props.routeColor, "line-width": 5 },
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
      "circle-radius": 6,
      "circle-color": ["match", ["get", "r"], "s", props.startColor, props.endColor],
      "circle-stroke-width": 2,
      "circle-stroke-color": props.routeColor,
    },
  });

  if (props.camera) {
    m.jumpTo({
      center: props.camera.center,
      zoom: props.camera.zoom,
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

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  map?.remove();
});

function done(): void {
  if (!map) return;
  const c = map.getCenter();
  const camera: MapCamera = {
    center: [c.lng, c.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
  const src = map.getCanvas().toDataURL("image/png");
  emit("done", { src, camera });
}
</script>

<template>
  <div class="editor">
    <div class="frame">
      <div ref="host" class="map"></div>
      <div v-if="loading" class="loading"><Spinner size="28px" /></div>
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
