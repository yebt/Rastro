<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { useStore } from '@nanostores/vue';
import L from 'leaflet';
import IconArrow from '~icons/lucide/arrow-left';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { relDate } from '../lib/date';
import { fmtPace, fmtTime, paceSecPerKm, speedKmh } from '../lib/format';
import { TYPE_LABEL } from '../lib/labels';
import {
  avgCadence,
  cadenceSeriesSpm,
  hasSamples,
  paceSeriesSecPerKm,
  speedSeriesKmh,
  splitsPerKm,
} from '../lib/reports';
import { isGps } from '../lib/types';
import { $activities } from '../stores/activities';
import { closeDetail } from '../stores/ui';
import LineChart from './charts/LineChart.vue';
import SplitsChart from './charts/SplitsChart.vue';

const props = defineProps<{ id: string }>();
const activities = useStore($activities);

const act = computed(() => activities.value.find((a) => a.id === props.id));
const gps = computed(() => {
  const a = act.value;
  return a && isGps(a) ? a : null;
});
const dom = computed(() => {
  const a = act.value;
  return a && a.kind === 'dominadas' ? a : null;
});

const title = computed(() => (act.value ? TYPE_LABEL[act.value.type] : ''));
const dateText = computed(() => (act.value ? relDate(act.value.date) : ''));

const distanceKm = computed(() => (gps.value ? gps.value.distance / 1000 : 0));
const durationText = computed(() => (gps.value ? fmtTime(gps.value.duration) : ''));
const avgPaceText = computed(() =>
  gps.value ? fmtPace(paceSecPerKm(gps.value.distance, gps.value.duration)) : '',
);
const avgSpeedText = computed(() =>
  gps.value ? speedKmh(gps.value.distance, gps.value.duration).toFixed(1) : '',
);
const hasRoute = computed(() => !!gps.value?.route.length);

const splits = computed(() => (gps.value ? splitsPerKm(gps.value) : []));
const paceSeries = computed(() => (gps.value ? paceSeriesSecPerKm(gps.value) : []));
const speedSeries = computed(() => (gps.value ? speedSeriesKmh(gps.value) : []));
const samplesOk = computed(() => (gps.value ? hasSamples(gps.value) : false));
const avgCad = computed(() => (gps.value ? avgCadence(gps.value) : 0));
const stepCount = computed(() => gps.value?.steps ?? 0);
const cadenceSeries = computed(() => (gps.value ? cadenceSeriesSpm(gps.value) : []));

const domSets = computed(() => dom.value?.sets ?? []);
const domBest = computed(() => (dom.value ? Math.max(0, ...dom.value.sets) : 0));

const speedFmt = (v: number) => v.toFixed(1);
const cadFmt = (v: number) => String(Math.round(v));

const mapEl = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;

function endpointIcon(kind: 'start' | 'end'): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="endpoint ${kind}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

onMounted(() => {
  const a = gps.value;
  if (!a || !a.route.length || !mapEl.value) return;
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  L.control
    .attribution({ prefix: false, position: 'bottomright' })
    .addAttribution('© OpenStreetMap')
    .addTo(map);
  const latlngs = a.route.map((p) => [p[0], p[1]] as L.LatLngTuple);
  const routeLine = L.polyline(latlngs, { color: '#1B4DFF', weight: 5, opacity: 0.9 }).addTo(map);
  map.fitBounds(routeLine.getBounds(), { padding: [24, 24] });

  const start = latlngs[0];
  const end = latlngs[latlngs.length - 1];
  if (start) L.marker(start, { icon: endpointIcon('start') }).addTo(map);
  if (end && latlngs.length > 1) L.marker(end, { icon: endpointIcon('end') }).addTo(map);
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});
</script>

<template>
  <div class="detail">
    <div class="detail-top">
      <button class="back" type="button" aria-label="Volver" @click="closeDetail"><IconArrow /></button>
      <div v-if="act">
        <div class="detail-ttl">{{ title }}</div>
        <div class="detail-date">{{ dateText }}</div>
      </div>
    </div>

    <div v-if="!act" class="empty"><p>Actividad no encontrada.</p></div>

    <template v-else-if="gps">
      <div v-if="hasRoute" id="detail-map" ref="mapEl"></div>

      <div class="readout">
        <div class="lbl">Distancia</div>
        <div class="big"><span class="val num">{{ distanceKm.toFixed(2) }}</span><span class="unit num">km</span></div>
        <div class="grid3">
          <div class="stat"><div class="k">Tiempo</div><div class="v num">{{ durationText }}</div></div>
          <div class="stat"><div class="k">Ritmo /km</div><div class="v num">{{ avgPaceText }}</div></div>
          <div class="stat"><div class="k">Velocidad</div><div class="v num">{{ avgSpeedText }}<small>km/h</small></div></div>
        </div>
        <div v-if="avgCad || stepCount" class="cadence-line">
          <span v-if="avgCad">Cadencia <b class="num">{{ avgCad }}</b> pasos/min</span>
          <span v-if="avgCad && stepCount"> · </span>
          <span v-if="stepCount"><b class="num">{{ stepCount }}</b> pasos</span>
        </div>
      </div>

      <template v-if="samplesOk">
        <div v-if="splits.length" class="card">
          <h3>Splits por km</h3>
          <SplitsChart :splits="splits" />
        </div>
        <div class="card">
          <h3>Ritmo en el tiempo</h3>
          <LineChart :points="paceSeries" color="#1B4DFF" :format="fmtPace" />
        </div>
        <div class="card">
          <h3>Velocidad en el tiempo</h3>
          <LineChart :points="speedSeries" color="#FF5A1F" :format="speedFmt" />
        </div>
        <div v-if="cadenceSeries.length" class="card">
          <h3>Cadencia en el tiempo</h3>
          <LineChart :points="cadenceSeries" color="#12A150" :format="cadFmt" />
        </div>
      </template>
      <p v-else class="hint" style="margin-top: 16px">
        Esta salida no tiene datos de muestreo, así que no hay gráficas de ritmo. Las próximas sí las van a tener.
      </p>
    </template>

    <template v-else-if="dom">
      <div class="totcard" style="margin-top: 14px">
        <div class="k">Total de la sesión</div>
        <div class="v num">{{ dom.total }}<span class="u">reps</span></div>
        <div class="row">
          <div><div class="k">Series</div><div class="m num">{{ domSets.length }}</div></div>
          <div><div class="k">Mejor serie</div><div class="m num">{{ domBest }}</div></div>
        </div>
      </div>
      <div class="card">
        <h3>Series</h3>
        <div class="sets">
          <div v-for="(r, i) in domSets" :key="i" class="chip">
            <span class="s">S{{ i + 1 }}</span><span class="n num">{{ r }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: var(--paper);
  max-width: 520px;
  margin: 0 auto;
  overflow-y: auto;
  padding: 0 16px calc(24px + var(--safe-b));
}
.detail-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(14px + var(--safe-t)) 2px 10px;
  position: sticky;
  top: 0;
  background: var(--paper);
  z-index: 5;
}
.back {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  color: var(--ink);
  flex: none;
}
.back svg {
  width: 22px;
  height: 22px;
}
.detail-ttl {
  font-weight: 600;
  font-size: 18px;
}
.detail-date {
  font-size: 12px;
  color: var(--muted);
  margin-top: 1px;
}
#detail-map {
  height: 240px;
  border-radius: 18px;
  overflow: hidden;
  background: #dfe3dd;
  border: 1px solid var(--line);
  margin-top: 6px;
}
.card :deep(h3) {
  margin-bottom: 10px;
}
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
