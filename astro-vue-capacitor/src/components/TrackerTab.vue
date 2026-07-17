<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { useStore } from '@nanostores/vue';
import L from 'leaflet';
import IconLocate from '~icons/lucide/locate-fixed';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { geo } from '../geolocation';
import { fmtPace, fmtTime, paceSecPerKm } from '../lib/format';
import type { GpsType } from '../lib/types';
import { $cadence, $steps } from '../motion/pedometer';
import { $activeTab } from '../stores/ui';
import {
  $curType,
  $distance,
  $elapsed,
  $lastPoint,
  $rawPos,
  $sessionStart,
  $speed,
  $trackState,
  $wakeLockActive,
  pause,
  resume,
  setType,
  start,
  stop,
} from '../stores/tracker';

defineProps<{ active: boolean }>();

const TYPES: { key: GpsType; label: string }[] = [
  { key: 'Caminata', label: 'Caminar' },
  { key: 'Trote', label: 'Trotar' },
  { key: 'Carrera', label: 'Correr' },
];

const state = useStore($trackState);
const curType = useStore($curType);
const distance = useStore($distance);
const elapsed = useStore($elapsed);
const speed = useStore($speed);
const rawPos = useStore($rawPos);
const lastPoint = useStore($lastPoint);
const sessionStart = useStore($sessionStart);
const activeTab = useStore($activeTab);
const wakeLockActive = useStore($wakeLockActive);
const cadence = useStore($cadence);
const steps = useStore($steps);

const km = computed(() => distance.value / 1000);
const distText = computed(() => km.value.toFixed(2));
const timeText = computed(() => fmtTime(elapsed.value));
const paceText = computed(() =>
  km.value > 0.02 ? fmtPace(paceSecPerKm(distance.value, elapsed.value)) : '—',
);
const speedText = computed(() => (speed.value > 0 ? speed.value.toFixed(1) : '0'));

const hint = computed(() => {
  if (state.value === 'running') return 'Registrando… mantené la pantalla encendida.';
  return 'Activá el GPS y tocá Iniciar. Dejá esta pantalla abierta mientras te movés.';
});

const mapEl = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let meMarker: L.Marker | null = null;
let routeLine: L.Polyline | null = null;

function meIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: '<div class="me-dot"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

async function locateOnce(): Promise<void> {
  try {
    const fix = await geo.getCurrent({ enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 });
    if (!map) return;
    const ll: L.LatLngTuple = [fix.lat, fix.lng];
    if (!meMarker) meMarker = L.marker(ll, { icon: meIcon() }).addTo(map);
    else meMarker.setLatLng(ll);
    if ($trackState.get() !== 'running') map.setView(ll, 16);
  } catch {
    // no fix available — leave the default view
  }
}

/** Recenter the map on the user's current position (locate-me button). */
async function recenter(): Promise<void> {
  if (!map) return;
  try {
    const fix = await geo.getCurrent({ enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 });
    const ll: L.LatLngTuple = [fix.lat, fix.lng];
    if (!meMarker) meMarker = L.marker(ll, { icon: meIcon() }).addTo(map);
    else meMarker.setLatLng(ll);
    map.setView(ll, 16);
  } catch {
    // ignore — no fix available
  }
}

onMounted(() => {
  if (!mapEl.value) return;
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: false }).setView(
    [4.6533, -74.0836],
    14,
  );
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  L.control.attribution({ prefix: false, position: 'bottomright' }).addAttribution('© OpenStreetMap').addTo(map);
  routeLine = L.polyline([], { color: '#1B4DFF', weight: 5, opacity: 0.9, lineJoin: 'round' }).addTo(map);
  void locateOnce();
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});

// Marker follows every fix (even weak GPS).
watch(rawPos, (pos) => {
  if (!map || !pos) return;
  const ll: L.LatLngTuple = [pos.lat, pos.lng];
  if (!meMarker) meMarker = L.marker(ll, { icon: meIcon() }).addTo(map);
  else meMarker.setLatLng(ll);
  map.setView(ll);
});

// Draw only accepted points on the route line.
watch(lastPoint, (pt) => {
  if (pt && routeLine) routeLine.addLatLng([pt.lat, pt.lng]);
});

// Clear the route when a new session starts.
watch(sessionStart, () => {
  routeLine?.setLatLngs([]);
});

// Leaflet needs a size refresh when the map becomes visible again.
watch(activeTab, (tab) => {
  if (tab === 'track' && map) nextTick(() => setTimeout(() => map?.invalidateSize(), 80));
});
</script>

<template>
  <section class="screen" :class="{ active }">
    <div class="map-wrap">
      <div id="map" ref="mapEl"></div>
      <button
        class="locate-btn"
        type="button"
        aria-label="Centrar en mi ubicación"
        @click="recenter"
      >
        <IconLocate />
      </button>
    </div>

    <div class="seg" :style="{ opacity: state === 'idle' ? 1 : 0.5 }">
      <button
        v-for="t in TYPES"
        :key="t.key"
        :class="{ on: curType === t.key }"
        @click="setType(t.key)"
      >
        {{ t.label }}
      </button>
    </div>

    <div class="readout">
      <div class="lbl">Distancia</div>
      <div class="big">
        <span class="val num">{{ distText }}</span><span class="unit num">km</span>
      </div>
      <div class="grid3">
        <div class="stat"><div class="k">Tiempo</div><div class="v num">{{ timeText }}</div></div>
        <div class="stat"><div class="k">Ritmo /km</div><div class="v num">{{ paceText }}</div></div>
        <div class="stat"><div class="k">Velocidad</div><div class="v num">{{ speedText }}<small>km/h</small></div></div>
      </div>
      <div v-if="state !== 'idle'" class="cadence-line">
        Cadencia <b class="num">{{ cadence }}</b> pasos/min · <b class="num">{{ steps }}</b> pasos
      </div>
    </div>

    <div class="controls">
      <template v-if="state === 'idle'">
        <button class="btn btn-go wide" @click="start">Iniciar</button>
      </template>
      <template v-else-if="state === 'running'">
        <button class="btn btn-pause" @click="pause">Pausar</button>
        <button class="btn btn-stop pulse" @click="stop">Finalizar</button>
      </template>
      <template v-else>
        <button class="btn btn-go" @click="resume">Reanudar</button>
        <button class="btn btn-stop" @click="stop">Finalizar</button>
      </template>
    </div>

    <div class="hint">
      {{ hint }}
      <span v-if="wakeLockActive" class="wl-on"> · pantalla activa</span>
    </div>
  </section>
</template>

<style scoped>
.cadence-line {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}
.cadence-line b {
  color: var(--ink);
  font-size: 16px;
}
</style>
