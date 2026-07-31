<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { onMounted, onUnmounted, ref, watch } from "vue";
import type { TrackPoint } from "../domain/track-point";

/**
 * Route on a street basemap. The track (local data) always renders; the CARTO
 * tiles are an online layer that falls back to the dark background offline. No
 * default marker images — vector circle markers avoid the bundler asset problem.
 */
const props = defineProps<{ points: TrackPoint[]; fill?: boolean }>();

const TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const host = ref<HTMLElement | null>(null);
const hasRoute = ref(false);

let map: L.Map | null = null;
let line: L.Polyline | null = null;
let startDot: L.CircleMarker | null = null;
let endDot: L.CircleMarker | null = null;
let fitted = false;

function accent(): string {
  const v = host.value && getComputedStyle(host.value).getPropertyValue("--accent").trim();
  return v || "#12A150";
}

function latlngs(): [number, number][] {
  return props.points.map((p) => [p.lat, p.lng]);
}

function render(): void {
  if (!map) return;
  const pts = latlngs();
  hasRoute.value = pts.length > 0;
  if (pts.length === 0) return;

  const color = accent();
  if (!line) {
    line = L.polyline(pts, { color, weight: 4, lineJoin: "round", lineCap: "round" }).addTo(map);
  } else {
    line.setLatLngs(pts);
    line.setStyle({ color });
  }

  const start = pts[0]!;
  const end = pts[pts.length - 1]!;
  if (!startDot) {
    startDot = L.circleMarker(start, { radius: 6, color, fillColor: color, fillOpacity: 1, weight: 0 }).addTo(map);
    endDot = L.circleMarker(end, { radius: 6, color, weight: 3, fillColor: "#111", fillOpacity: 1 }).addTo(map);
  } else {
    startDot.setLatLng(start).setStyle({ color, fillColor: color });
    endDot!.setLatLng(end).setStyle({ color });
  }

  // Frame the route ONCE, then never touch the view again — otherwise every live
  // fix would fight the user's zoom/pan. The polyline scales with the map on its
  // own, so growth stays in sync; the user pans/zooms freely.
  if (!fitted) {
    if (pts.length === 1) map.setView(start, 16);
    else map.fitBounds(line.getBounds(), { padding: [24, 24], maxZoom: 17 });
    fitted = true;
  }
}

let resizeObs: ResizeObserver | null = null;

onMounted(() => {
  map = L.map(host.value!, {
    zoomControl: false,
    attributionControl: false,
    dragging: true,
    // Inside the fixed immersive overlay, Leaflet's animated transforms glitch
    // (the layer jumps on zoom); instant zoom keeps everything aligned.
    zoomAnimation: false,
    fadeAnimation: false,
  }).setView([0, 0], 2);
  L.tileLayer(TILES, { subdomains: "abcd", maxZoom: 20, detectRetina: true }).addTo(map);

  // Fit only after the container has its real size, or the projection is stale
  // and every later update lands off until a zoom recomputes it.
  requestAnimationFrame(() => {
    map?.invalidateSize();
    render();
  });
  resizeObs = new ResizeObserver(() => map?.invalidateSize());
  resizeObs.observe(host.value!);
});

watch(() => props.points, render, { deep: false });

onUnmounted(() => {
  resizeObs?.disconnect();
  resizeObs = null;
  map?.remove();
  map = null;
  line = startDot = endDot = null;
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
  /* Contain Leaflet's internal pane z-indexes so they can't paint over sibling
     overlays (e.g. the live controls). */
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
.canvas :deep(.leaflet-container) {
  background: var(--surface);
  font: inherit;
}
.empty {
  position: absolute;
  inset: 0;
  z-index: 500;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--muted);
  /* Opaque so the initial world map doesn't show before the first fix. */
  background: var(--surface);
}
</style>
