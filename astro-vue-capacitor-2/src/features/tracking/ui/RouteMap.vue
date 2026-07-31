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

  // Fit once, then only re-fit when the growing track leaves the view — keeps
  // the map from jittering on every live fix.
  if (pts.length === 1) {
    if (!fitted) {
      map.setView(start, 16);
      fitted = true;
    } else {
      map.panTo(end);
    }
  } else {
    const bounds = line.getBounds();
    if (!fitted || !map.getBounds().contains(bounds)) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 });
      fitted = true;
    }
  }
}

onMounted(() => {
  map = L.map(host.value!, {
    zoomControl: false,
    attributionControl: false,
    dragging: true,
  }).setView([0, 0], 2);
  L.tileLayer(TILES, { subdomains: "abcd", maxZoom: 20, detectRetina: true }).addTo(map);
  // The container may have been sized after Leaflet measured it.
  requestAnimationFrame(() => map?.invalidateSize());
  render();
});

watch(() => props.points, render, { deep: false });

onUnmounted(() => {
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
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--muted);
  pointer-events: none;
}
</style>
