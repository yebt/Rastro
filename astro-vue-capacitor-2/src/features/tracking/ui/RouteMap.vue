<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { routeSegments } from "../domain/segments";
import type { TrackPoint } from "../domain/track-point";

/**
 * Route on a street basemap. The track (local data) always renders; the CARTO
 * tiles are an online layer that falls back to the dark background offline. No
 * default marker images — vector circle markers avoid the bundler asset problem.
 */
const props = defineProps<{ points: TrackPoint[]; fill?: boolean }>();
const emit = defineEmits<{ tap: [] }>();

/** Effective dark/light, resolving the "auto" theme via the OS preference. */
function isDark(): boolean {
  const attr = globalThis.document?.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}
const dark = isDark();
// Basemap follows the app theme; canonical CARTO host (no {s} subdomains).
const TILES = `https://basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}{r}.png`;
// A casing under the route so it reads clearly over any basemap.
const casingColor = dark ? "#0a0c0d" : "#ffffff";

const host = ref<HTMLElement | null>(null);
const hasRoute = ref(false);

let map: L.Map | null = null;
let casing: L.Polyline | null = null;
let line: L.Polyline | null = null;
let startDot: L.CircleMarker | null = null;
let endDot: L.CircleMarker | null = null;
let fitted = false;
// Touching the layers mid-pinch breaks Leaflet's zoom transform (the route jumps),
// so hold updates while zooming and flush them once it settles.
let zooming = false;
let pendingRender = false;

function accent(): string {
  const v = host.value && getComputedStyle(host.value).getPropertyValue("--accent").trim();
  return v || "#12A150";
}

function segLatLngs(): [number, number][][] {
  // One polyline per continuous segment so a pause never bridges as a straight line.
  return routeSegments(props.points).map((seg) => seg.map((p) => [p.lat, p.lng]));
}

function render(): void {
  if (!map) return;
  if (zooming) {
    pendingRender = true; // don't mutate layers mid-pinch
    return;
  }
  const raw = props.points;
  hasRoute.value = raw.length > 0;
  if (raw.length === 0) return;
  const segs = segLatLngs();

  const color = accent();
  if (!line) {
    // Casing first (under), then the colored line, then the markers — all in the
    // overlay pane, above the tiles.
    casing = L.polyline(segs, { color: casingColor, weight: 8, opacity: 0.9, lineJoin: "round", lineCap: "round" }).addTo(map);
    line = L.polyline(segs, { color, weight: 4, lineJoin: "round", lineCap: "round" }).addTo(map);
  } else {
    casing!.setLatLngs(segs);
    line.setLatLngs(segs);
    line.setStyle({ color });
  }

  const start: [number, number] = [raw[0]!.lat, raw[0]!.lng];
  const end: [number, number] = [raw[raw.length - 1]!.lat, raw[raw.length - 1]!.lng];
  if (!startDot) {
    // Start: solid dot. End: a hollow ring — so they stay distinct even when a
    // closed loop ends where it began.
    startDot = L.circleMarker(start, { radius: 6, color: casingColor, fillColor: color, fillOpacity: 1, weight: 2 }).addTo(map);
    endDot = L.circleMarker(end, { radius: 10, color, weight: 3, fillOpacity: 0 }).addTo(map);
  } else {
    startDot.setLatLng(start).setStyle({ fillColor: color });
    endDot!.setLatLng(end).setStyle({ color });
  }

  // Frame the route ONCE, then never touch the view again — otherwise every live
  // fix would fight the user's zoom/pan. The polyline scales with the map on its
  // own, so growth stays in sync; the user pans/zooms freely.
  if (!fitted) {
    if (raw.length === 1) map.setView(start, 16);
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
  L.tileLayer(TILES, { maxZoom: 20, detectRetina: true }).addTo(map);

  // A tap on the map (not a drag/pinch) is a toggle signal for the caller.
  map.on("click", () => emit("tap"));

  map.on("zoomstart", () => {
    zooming = true;
  });
  map.on("zoomend", () => {
    zooming = false;
    if (pendingRender) {
      pendingRender = false;
      render();
    }
  });

  // Fit only after the container has its real size, or the projection is stale
  // and every later update lands off until a zoom recomputes it.
  requestAnimationFrame(() => {
    map?.invalidateSize();
    render();
  });
  resizeObs = new ResizeObserver(() => map?.invalidateSize());
  resizeObs.observe(host.value!);
});

/** Jump back to the current position (last fix), keeping a usable zoom. */
function recenter(): void {
  const pts = latlngs();
  if (!map || pts.length === 0) return;
  map.setView(pts[pts.length - 1]!, Math.max(map.getZoom(), 16));
}
defineExpose({ recenter });

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
