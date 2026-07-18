<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconTrend from '~icons/lucide/trending-up';
import { computed } from 'vue';
import { fmtDistance, fmtPace, fmtTime } from '../lib/format';
import type { SeriesPoint } from '../lib/reports';
import {
  computeRecords,
  weeklyAvgCadence,
  weeklyAvgPaceSecPerKm,
  weeklyDistanceKm,
  weeklyPullups,
  type WeekPoint,
} from '../lib/trends';
import { $activities } from '../stores/activities';
import LineChart from './charts/LineChart.vue';
import WeekBars from './charts/WeekBars.vue';

defineProps<{ active: boolean }>();

const activities = useStore($activities);

const records = computed(() => computeRecords(activities.value));
const distWeeks = computed(() => weeklyDistanceKm(activities.value));
const paceWeeks = computed(() => weeklyAvgPaceSecPerKm(activities.value));
const cadWeeks = computed(() => weeklyAvgCadence(activities.value));
const pullWeeks = computed(() => weeklyPullups(activities.value));

const hasAny = computed(() => activities.value.length > 0);

/** WeekPoint[] → line series keyed by week start (x formatted as the week label). */
const asSeries = (weeks: WeekPoint[]): SeriesPoint[] =>
  weeks.map((w) => ({ t: w.weekStart, v: w.value }));
const weekAxis = (x: number): string => {
  const w = [...distWeeks.value, ...paceWeeks.value, ...cadWeeks.value].find((p) => p.weekStart === x);
  return w?.label ?? '';
};

const distFmt = (v: number): string => `${v.toFixed(1)} km`;
const cadFmt = (v: number): string => String(Math.round(v));

const longest = computed(() => (records.value.longestRun ? fmtDistance(records.value.longestRun) : null));
</script>

<template>
  <section class="screen" :class="{ active }">
    <div v-if="!hasAny" class="empty">
      <IconTrend />
      <p>Todavía no hay progreso que mostrar.<br />Registrá algunas salidas y volvé.</p>
    </div>

    <template v-else>
      <div class="card">
        <h3>Récords</h3>
        <div class="records">
          <div class="rec">
            <div class="k">1 km más rápido</div>
            <div class="v num">{{ records.fastest1k ? fmtTime(records.fastest1k) : '—' }}</div>
          </div>
          <div class="rec">
            <div class="k">5 km más rápido</div>
            <div class="v num">{{ records.fastest5k ? fmtTime(records.fastest5k) : '—' }}</div>
          </div>
          <div class="rec">
            <div class="k">Salida más larga</div>
            <div class="v num">{{ longest ? longest.value : '—' }}<small v-if="longest"> {{ longest.unit }}</small></div>
          </div>
          <div class="rec">
            <div class="k">Mejor sesión</div>
            <div class="v num">{{ records.bestPullSession ?? '—' }}<small v-if="records.bestPullSession"> reps</small></div>
          </div>
          <div class="rec">
            <div class="k">Mejor serie</div>
            <div class="v num">{{ records.bestPullSet ?? '—' }}</div>
          </div>
        </div>
      </div>

      <div v-if="distWeeks.length" class="card">
        <h3>Distancia por semana</h3>
        <WeekBars :points="distWeeks" color="#1B4DFF" :format="distFmt" />
      </div>

      <div v-if="paceWeeks.length > 1" class="card">
        <h3>Ritmo promedio por semana</h3>
        <p class="sub">Más abajo es mejor: significa que corrés más rápido.</p>
        <LineChart :points="asSeries(paceWeeks)" color="#12A150" :format="fmtPace" :x-format="weekAxis" />
      </div>

      <div v-if="cadWeeks.length > 1" class="card">
        <h3>Cadencia promedio por semana</h3>
        <LineChart :points="asSeries(cadWeeks)" color="#FF5A1F" :format="cadFmt" :x-format="weekAxis" />
      </div>

      <div v-if="pullWeeks.length" class="card">
        <h3>Dominadas por semana</h3>
        <WeekBars :points="pullWeeks" color="#7A5AF8" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.records {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.rec {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
}
.rec .k {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 4px;
}
.rec .v {
  font-size: 22px;
  font-weight: 700;
}
.rec .v small {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}
.sub {
  font-size: 12px;
  color: var(--muted);
  margin: -4px 0 12px;
}
</style>
