<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { useStore } from '@nanostores/vue';
import L from 'leaflet';
import IconArrow from '~icons/lucide/arrow-left';
import IconShare from '~icons/lucide/share-2';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { relDate } from '../lib/date';
import { fmtDistance, fmtDistanceLabel, fmtPace, fmtTime, paceSecPerKm, speedKmh } from '../lib/format';
import { TYPE_LABEL } from '../lib/labels';
import {
  accelerationStats,
  avgCadence,
  cadenceSeriesSpm,
  hasSamples,
  kmSegment,
  paceSeriesSecPerKm,
  segmentProfile,
  speedSeriesKmh,
  splitsPerKm,
} from '../lib/reports';
import { analyzeStride } from '../lib/stride';
import { isGps } from '../lib/types';
import { $activities } from '../stores/activities';
import { $mapStyle } from '../stores/settings';
import { closeDetail } from '../stores/ui';
import { applyTileLayer } from './mapTiles';
import LineChart from './charts/LineChart.vue';
import SegmentChart from './charts/SegmentChart.vue';
import SplitsChart from './charts/SplitsChart.vue';
import StrideChart from './charts/StrideChart.vue';
import ShareCard from './ShareCard.vue';

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

const dist = computed(() => fmtDistance(gps.value ? gps.value.distance : 0));
const durationText = computed(() => (gps.value ? fmtTime(gps.value.duration) : ''));
const avgPaceText = computed(() =>
  gps.value ? fmtPace(paceSecPerKm(gps.value.distance, gps.value.duration)) : '',
);
const avgSpeedText = computed(() =>
  gps.value ? speedKmh(gps.value.distance, gps.value.duration).toFixed(1) : '',
);
const hasRoute = computed(() => !!gps.value?.route.length);

const splits = computed(() => (gps.value ? splitsPerKm(gps.value) : []));
const selectedKm = ref<number | null>(null);
const selectedSplit = computed(() => splits.value.find((s) => s.km === selectedKm.value) ?? null);
const kmDetail = computed(() =>
  gps.value && selectedKm.value ? kmSegment(gps.value, selectedKm.value) : null,
);
function toggleKm(km: number): void {
  selectedKm.value = selectedKm.value === km ? null : km;
}
const axis = ref<'time' | 'distance'>('time');
const xFormat = computed(() => (axis.value === 'distance' ? fmtDistanceLabel : undefined));
const paceSeries = computed(() => (gps.value ? paceSeriesSecPerKm(gps.value, axis.value) : []));
const speedSeries = computed(() => (gps.value ? speedSeriesKmh(gps.value, axis.value) : []));
const samplesOk = computed(() => (gps.value ? hasSamples(gps.value) : false));
const avgCad = computed(() => (gps.value ? avgCadence(gps.value) : 0));
const stepCount = computed(() => gps.value?.steps ?? 0);
const cadenceSeries = computed(() => (gps.value ? cadenceSeriesSpm(gps.value, axis.value) : []));
const segments = computed(() => (gps.value ? segmentProfile(gps.value) : []));
const accel = computed(() => (gps.value ? accelerationStats(gps.value) : null));
const stride = computed(() => (gps.value ? analyzeStride(gps.value) : null));
const stepsAccel = computed(() => gps.value?.stepsAccel ?? 0);
const stepsHardware = computed(() => gps.value?.stepsHardware ?? 0);
const bothSteps = computed(() => stepsAccel.value > 0 && stepsHardware.value > 0);
const stepsDiffPct = computed(() =>
  stepsAccel.value > 0
    ? Math.round(((stepsHardware.value - stepsAccel.value) / stepsAccel.value) * 100)
    : 0,
);
const defaultSource = computed(() => gps.value?.source?.pedometer ?? null);

const domSets = computed(() => dom.value?.sets ?? []);
const domBest = computed(() => (dom.value ? Math.max(0, ...dom.value.sets) : 0));

const speedFmt = (v: number) => v.toFixed(1);
const cadFmt = (v: number) => String(Math.round(v));

const showShare = ref(false);

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
  map = L.map(mapEl.value, { zoomControl: false });
  map.attributionControl.setPrefix(false);
  applyTileLayer(map, null, $mapStyle.get());
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
      <button
        v-if="gps && hasRoute"
        class="back share-btn"
        type="button"
        aria-label="Compartir ruta"
        @click="showShare = true"
      ><IconShare /></button>
    </div>

    <div v-if="!act" class="empty"><p>Actividad no encontrada.</p></div>

    <template v-else-if="gps">
      <div v-if="hasRoute" id="detail-map" ref="mapEl"></div>

      <div class="readout">
        <div class="lbl">Distancia</div>
        <div class="big"><span class="val num">{{ dist.value }}</span><span class="unit num">{{ dist.unit }}</span></div>
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
        <div v-if="accel" class="cadence-line">
          Aceleración máx <b class="num">+{{ accel.peakAccel.toFixed(1) }}</b> ·
          frenado <b class="num">{{ accel.peakDecel.toFixed(1) }}</b> m/s²
          <small class="approx">aprox.</small>
        </div>
      </div>

      <div v-if="bothSteps" class="card">
        <h3>Podómetros comparados</h3>
        <div class="ped-cmp">
          <div class="ped-col" :class="{ def: defaultSource === 'accelerometer' }">
            <div class="k">Acelerómetro<small v-if="defaultSource === 'accelerometer'"> · por defecto</small></div>
            <div class="v num">{{ stepsAccel }}<small> pasos</small></div>
          </div>
          <div class="ped-col" :class="{ def: defaultSource === 'hardware' }">
            <div class="k">Hardware<small v-if="defaultSource === 'hardware'"> · por defecto</small></div>
            <div class="v num">{{ stepsHardware }}<small> pasos</small></div>
          </div>
        </div>
        <p class="insight muted">
          El hardware midió {{ stepsDiffPct === 0 ? 'lo mismo' : `${stepsDiffPct > 0 ? '+' : ''}${stepsDiffPct}%` }}
          respecto al acelerómetro. Cambiá la fuente por defecto en la pestaña Registrar.
        </p>
      </div>

      <template v-if="samplesOk">
        <div v-if="segments.length > 1" class="card">
          <h3>Rendimiento por tramo</h3>
          <p class="sub">Velocidad media de cada tramo a lo largo del recorrido (sin el ruido del GPS). El más rápido, en verde.</p>
          <SegmentChart :segments="segments" />
        </div>
        <div class="axis-toggle">
          <button type="button" :class="{ on: axis === 'time' }" @click="axis = 'time'">Por tiempo</button>
          <button type="button" :class="{ on: axis === 'distance' }" @click="axis = 'distance'">Por distancia</button>
        </div>
        <div v-if="splits.length" class="card">
          <h3>Splits por km</h3>
          <p class="sub">Tocá un kilómetro para ver su detalle.</p>
          <SplitsChart :splits="splits" :selected="selectedKm" @select="toggleKm" />
          <div v-if="kmDetail" class="km-panel">
            <div class="km-head">
              Kilómetro {{ kmDetail.km }}
              <span v-if="selectedSplit?.partial" class="km-tag">parcial · {{ kmDetail.meters }} m</span>
            </div>
            <div class="grid3">
              <div class="stat"><div class="k">Ritmo</div><div class="v num">{{ selectedSplit ? fmtPace(selectedSplit.paceSecPerKm) : '—' }}</div></div>
              <div class="stat"><div class="k">Velocidad</div><div class="v num">{{ kmDetail.avgSpeedKmh.toFixed(1) }}<small>km/h</small></div></div>
              <div class="stat"><div class="k">Cadencia</div><div class="v num">{{ kmDetail.avgCad || '—' }}<small v-if="kmDetail.avgCad">ppm</small></div></div>
            </div>
            <LineChart :points="kmDetail.speedSeries" color="#FF5A1F" :format="speedFmt" :height="90" />
            <LineChart
              v-if="kmDetail.cadSeries.length"
              :points="kmDetail.cadSeries"
              color="#12A150"
              :format="cadFmt"
              :height="90"
            />
          </div>
        </div>
        <div class="card">
          <h3>Ritmo {{ axis === 'distance' ? 'por distancia' : 'en el tiempo' }}</h3>
          <LineChart :points="paceSeries" color="#1B4DFF" :format="fmtPace" :x-format="xFormat" />
        </div>
        <div class="card">
          <h3>Velocidad {{ axis === 'distance' ? 'por distancia' : 'en el tiempo' }}</h3>
          <LineChart :points="speedSeries" color="#FF5A1F" :format="speedFmt" :x-format="xFormat" />
        </div>
        <div v-if="cadenceSeries.length" class="card">
          <h3>Cadencia {{ axis === 'distance' ? 'por distancia' : 'en el tiempo' }}</h3>
          <LineChart :points="cadenceSeries" color="#12A150" :format="cadFmt" :x-format="xFormat" />
        </div>
        <div v-if="stride" class="card">
          <h3>Zancada vs cadencia</h3>
          <StrideChart
            :points="stride.points"
            :bins="stride.bins"
            :optimal-cadence="stride.optimalCadence"
            :diminishing-cadence="stride.diminishingCadence"
          />
          <p class="insight">
            Tu zancada más eficiente fue a <b class="num">{{ stride.optimalCadence }}</b> pasos/min
            (≈ <b class="num">{{ stride.optimalStride.toFixed(2) }}</b> m por paso).
          </p>
          <p v-if="stride.diminishingCadence" class="insight muted">
            Por encima de ~{{ stride.diminishingCadence }} pasos/min dejaste de ganar velocidad:
            estabas acortando el paso.
          </p>
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

    <ShareCard v-if="showShare && gps" :activity="gps" @close="showShare = false" />
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
.share-btn {
  margin-left: auto;
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
  background: var(--map-bg);
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
.cadence-line .approx {
  font-size: 11px;
  font-style: italic;
  opacity: 0.7;
}
.insight {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink);
}
.insight b {
  color: #12a150;
}
.insight.muted {
  margin-top: 4px;
  color: var(--muted);
}
.insight.muted b {
  color: var(--muted);
}
.sub {
  font-size: 12px;
  color: var(--muted);
  margin: -4px 0 12px;
}
.km-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}
.km-head {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.km-tag {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
}
.km-panel .grid3 {
  margin-bottom: 10px;
}
.ped-cmp {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.ped-col {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
}
.ped-col.def {
  border-color: var(--green);
}
.ped-col .k {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 4px;
}
.ped-col .k small {
  color: var(--green);
}
.ped-col .v {
  font-size: 22px;
  font-weight: 700;
}
.ped-col .v small {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}
.axis-toggle {
  display: flex;
  gap: 6px;
  margin-top: 16px;
  padding: 4px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
}
.axis-toggle button {
  flex: 1;
  padding: 8px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}
.axis-toggle button.on {
  background: var(--paper);
  color: var(--ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
