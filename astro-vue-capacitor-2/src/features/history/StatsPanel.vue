<script setup lang="ts">
import { computed } from "vue";
import { Card, Label } from "../../shared/ui";
import {
  avgPaceSecPerKm,
  avgSpeedMps,
  cadenceAnalysis,
  distanceMeters,
  elevationProfile,
  elevationStats,
  formatDuration,
  formatPace,
  formatSpeed,
  halfSplit,
  type MoveActivity,
  movementSeries,
  pausedMs,
  speedExtremes,
  splitStats,
  splits,
  strideSeries,
  type TrackPoint,
} from "../tracking";
import CadenceChart from "../tracking/ui/CadenceChart.vue";
import SplitBars from "../tracking/ui/SplitBars.vue";
import TrendChart from "../tracking/ui/TrendChart.vue";

/** Deep analytics for one move activity — the "Análisis" tab. */
const props = defineProps<{ points: TrackPoint[]; move: MoveActivity }>();

const splitData = computed(() => splits(props.points));
const series = computed(() => movementSeries(props.points, 60));
const speedKmh = computed(() => series.value.map((p) => p.mps * 3.6));
const paceSeries = computed(() => series.value.map((p) => (p.paceSecPerKm ? p.paceSecPerKm / 60 : 0)));
const altProfile = computed(() => elevationProfile(props.points, 60));
const cadence = computed(() => cadenceAnalysis(props.points));
const strideOverTime = computed(() => strideSeries(props.points, 40));
const strideM = computed(() => strideOverTime.value.map((s) => s.strideM ?? 0));
const cadenceOverTime = computed(() => strideOverTime.value.map((s) => s.cadence ?? 0));

const sStats = computed(() => splitStats(splitData.value));
const spd = computed(() => speedExtremes(series.value));
const half = computed(() => halfSplit(props.points));
const elev = computed(() => elevationStats(props.points));

const avgPace = computed(() => avgPaceSecPerKm(props.points));
const steps = computed(() => props.move.steps ?? null);
const cadence = computed(() =>
  steps.value && props.move.movingMs ? Math.round(steps.value / (props.move.movingMs / 60_000)) : null,
);
const stride = computed(() => (steps.value ? distanceMeters(props.points) / steps.value : null));
const paused = computed(() =>
  formatDuration(pausedMs(props.move.startedAt, props.move.endedAt, props.move.movingMs ?? 0)),
);

const pacingLabel = computed(() => {
  if (half.value.kind === "negative") return "Negativo · aceleraste";
  if (half.value.kind === "positive") return "Positivo · bajaste el ritmo";
  return "Parejo";
});

const dash = (v: string | number | null | undefined): string => (v == null ? "—" : String(v));
</script>

<template>
  <Card>
    <div class="hgrid">
      <div class="h"><b>{{ formatPace(sStats.best) }}</b><small>mejor km</small></div>
      <div class="h"><b>{{ formatPace(avgPace) }}</b><small>ritmo medio</small></div>
      <div class="h"><b>{{ formatSpeed(spd.maxMps) }}</b><small>vel. máx km/h</small></div>
      <div class="h"><b>{{ half.kind === "even" ? "=" : half.kind === "negative" ? "▲" : "▼" }}</b><small>pacing</small></div>
    </div>
  </Card>

  <Card>
    <dl class="rows">
      <div class="r"><dt>Ritmo medio</dt><dd>{{ formatPace(avgPace) }} /km</dd></div>
      <div class="r"><dt>Mejor km</dt><dd>{{ formatPace(sStats.best) }} /km</dd></div>
      <div class="r"><dt>Peor km</dt><dd>{{ formatPace(sStats.worst) }} /km</dd></div>
      <div class="r"><dt>Variación de ritmo</dt><dd>{{ sStats.spread != null ? `${Math.round(sStats.spread)} s` : "—" }}</dd></div>
      <div class="r"><dt>Velocidad media</dt><dd>{{ formatSpeed(avgSpeedMps(props.points)) }} km/h</dd></div>
      <div class="r"><dt>Velocidad máx</dt><dd>{{ formatSpeed(spd.maxMps) }} km/h</dd></div>
      <div class="r"><dt>Velocidad mín (mov.)</dt><dd>{{ spd.minMovingMps != null ? `${formatSpeed(spd.minMovingMps)} km/h` : "—" }}</dd></div>
      <div class="r"><dt>1ª mitad</dt><dd>{{ formatPace(half.firstPace) }} /km</dd></div>
      <div class="r"><dt>2ª mitad</dt><dd>{{ formatPace(half.secondPace) }} /km</dd></div>
      <div class="r"><dt>Pacing</dt><dd>{{ pacingLabel }}</dd></div>
      <div class="r"><dt>Cadencia media</dt><dd>{{ cadence != null ? `${cadence} p/min` : "—" }}</dd></div>
      <div class="r"><dt>Zancada media</dt><dd>{{ stride != null ? `${stride.toFixed(2)} m` : "—" }}</dd></div>
      <div class="r"><dt>Desnivel +</dt><dd>+{{ Math.round(elev.gainM) }} m</dd></div>
      <div class="r"><dt>Desnivel −</dt><dd>−{{ Math.round(elev.lossM) }} m</dd></div>
      <div class="r"><dt>Altitud máx</dt><dd>{{ elev.maxAlt != null ? `${Math.round(elev.maxAlt)} m` : "—" }}</dd></div>
      <div class="r"><dt>Altitud mín</dt><dd>{{ elev.minAlt != null ? `${Math.round(elev.minAlt)} m` : "—" }}</dd></div>
      <div class="r"><dt>Pasos</dt><dd>{{ dash(steps) }}</dd></div>
      <div class="r"><dt>En pausa</dt><dd>{{ paused }} · {{ move.pauses ?? 0 }}×</dd></div>
      <div class="r"><dt>Puntos GPS</dt><dd>{{ props.points.length }}</dd></div>
    </dl>
  </Card>

  <Card v-if="splitData.length">
    <Label>Ritmo por km</Label>
    <SplitBars :splits="splitData" />
  </Card>

  <Card v-if="series.length">
    <Label>Velocidad en el tiempo</Label>
    <TrendChart :values="speedKmh" :format="(v) => `${v.toFixed(1)} km/h`" />
  </Card>

  <Card v-if="series.length">
    <Label>Ritmo en el tiempo</Label>
    <TrendChart :values="paceSeries" :format="(v) => `${v.toFixed(1)} min/km`" />
  </Card>

  <Card v-if="altProfile.length">
    <Label>Altitud</Label>
    <TrendChart :values="altProfile" baseline="min" :format="(v) => `${Math.round(v)} m`" />
  </Card>

  <Card v-if="cadence.bestStride">
    <Label>Cadencia óptima</Label>
    <CadenceChart :bins="cadence.bins" :best="cadence.bestStride" />
    <p class="insight">
      Tu zancada más eficiente fue a ~<b>{{ cadence.bestStride.cadence }}</b> pasos/min
      (≈ {{ cadence.bestStride.strideM.toFixed(2) }} m por paso).
      <template v-if="cadence.peakSpeed && cadence.peakSpeed.cadence > cadence.bestStride.cadence">
        Por encima de ahí subiste la cadencia pero acortaste el paso.
      </template>
    </p>
  </Card>

  <Card v-if="strideOverTime.length">
    <Label>Zancada en el tiempo</Label>
    <TrendChart :values="strideM" :format="(v) => `${v.toFixed(2)} m`" />
  </Card>

  <Card v-if="strideOverTime.length">
    <Label>Cadencia en el tiempo</Label>
    <TrendChart :values="cadenceOverTime" :format="(v) => `${Math.round(v)} p/min`" />
  </Card>
</template>

<style scoped>
.hgrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-2);
}
.h {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
  min-width: 0;
}
.h b {
  font-family: var(--font-mono);
  font-size: clamp(14px, 4.6vw, 20px);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.h small {
  font-size: 10px;
  color: var(--muted);
  line-height: 1.2;
}
.rows {
  margin: 0;
  display: flex;
  flex-direction: column;
}
.insight {
  margin: var(--sp-3) 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
}
.insight b {
  color: var(--ink);
  font-family: var(--font-mono);
}
.r {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-2) 0;
}
.r + .r {
  border-top: 1px solid var(--line);
}
.r dt {
  font-size: 13px;
  color: var(--muted);
}
.r dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
