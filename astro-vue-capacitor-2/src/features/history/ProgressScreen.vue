<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted, ref } from "vue";
import { AppSubScreen, Card, Label, SegmentedControl } from "../../shared/ui";
import { distanceParts, formatPace, type MoveType } from "../tracking";
import TrendChart from "../tracking/ui/TrendChart.vue";
import { $activities, loadActivities } from "./history.store";
import { records, sessionSeries } from "./progress";

/** Progress: distance and speed trends across sessions of a movement type. */
defineEmits<{ back: [] }>();

const activities = useStore($activities);
onMounted(() => {
  void loadActivities();
});

const type = ref<MoveType>("run");
const TYPES: { value: MoveType; label: string }[] = [
  { value: "run", label: "Correr" },
  { value: "jog", label: "Trotar" },
  { value: "walk", label: "Caminar" },
];

const series = computed(() => sessionSeries(activities.value, type.value));
const rec = computed(() => records(series.value));
const longest = computed(() => distanceParts(rec.value.longestM));
const distancesKm = computed(() => series.value.map((s) => s.distanceM / 1000));
const speedsKmh = computed(() => series.value.map((s) => s.mps * 3.6));
</script>

<template>
  <AppSubScreen title="Progreso" @back="$emit('back')">
    <SegmentedControl :options="TYPES" :model-value="type" @update:model-value="(v) => (type = v)" />

    <template v-if="series.length">
      <Card>
        <div class="records">
          <div class="rec"><b>{{ rec.count }}</b><small>salidas</small></div>
          <div class="rec"><b>{{ longest.value }}</b><small>km más largo</small></div>
          <div class="rec"><b>{{ formatPace(rec.bestPaceSecPerKm) }}</b><small>mejor ritmo</small></div>
        </div>
      </Card>

      <Card>
        <Label>Distancia por salida</Label>
        <TrendChart :values="distancesKm" :format="(v) => `${v.toFixed(1)} km`" />
      </Card>

      <Card>
        <Label>Velocidad por salida</Label>
        <TrendChart :values="speedsKmh" :format="(v) => `${v.toFixed(1)} km/h`" />
      </Card>
    </template>

    <p v-else class="empty">Todavía no hay salidas de este tipo para comparar.</p>
  </AppSubScreen>
</template>

<style scoped>
.records {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-2);
}
.rec {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}
.rec b {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.rec small {
  font-size: 10px;
  color: var(--muted);
  line-height: 1.2;
}
.empty {
  margin: var(--sp-3) 0 0;
  font-size: 13px;
  color: var(--muted);
}
</style>
