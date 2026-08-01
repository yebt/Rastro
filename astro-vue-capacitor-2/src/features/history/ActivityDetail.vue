<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed } from "vue";
import { AppButton, AppSubScreen, Card, Label, SegmentedControl } from "../../shared/ui";
import {
  type Activity,
  applyFilter,
  avgPaceSecPerKm,
  avgSpeedMps,
  distanceMeters,
  distanceParts,
  elevationGainM,
  exerciseLabel,
  formatActivityDate,
  formatDuration,
  formatPace,
  formatSpeed,
  hasElevation,
  MOVE_LABEL,
  pausedMs,
  setTrackFilter,
  $trackFilter,
  totalReps,
  TRACK_FILTERS,
} from "../tracking";
import RouteMap from "../tracking/ui/RouteMap.vue";
import { deleteActivity } from "./history.store";

const props = defineProps<{ activity: Activity }>();
const emit = defineEmits<{ back: [] }>();

const move = computed(() => (props.activity.kind === "move" ? props.activity : null));
const ex = computed(() => (props.activity.kind === "exercise" ? props.activity : null));

const title = computed(() =>
  props.activity.kind === "move"
    ? MOVE_LABEL[props.activity.type]
    : exerciseLabel(props.activity.exercise),
);

// Movement stats (empty/zero for exercises).
const trackFilter = useStore($trackFilter);
const filterOptions = TRACK_FILTERS.map((f) => ({ value: f.id, label: f.label }));
const points = computed(() => move.value?.points ?? []);
const clean = computed(() => applyFilter(trackFilter.value, points.value));
const dist = computed(() => distanceParts(distanceMeters(clean.value)));
const duration = computed(() => formatDuration(move.value?.movingMs ?? 0));
const paused = computed(() =>
  move.value
    ? formatDuration(pausedMs(move.value.startedAt, move.value.endedAt, move.value.movingMs ?? 0))
    : "0:00",
);
const pace = computed(() => formatPace(avgPaceSecPerKm(clean.value)));
const speed = computed(() => formatSpeed(avgSpeedMps(clean.value)));
const elevation = computed(() =>
  hasElevation(points.value) ? `+${Math.round(elevationGainM(points.value))} m` : "—",
);

const exReps = computed(() => (ex.value ? totalReps(ex.value.sets) : 0));

async function onDelete(): Promise<void> {
  await deleteActivity(props.activity.id);
  emit("back");
}
</script>

<template>
  <AppSubScreen :title="title" @back="emit('back')">
    <template v-if="move">
      <RouteMap :points="clean" />

      <div class="filter">
        <Label>Filtro de traza (test)</Label>
        <SegmentedControl
          :options="filterOptions"
          :model-value="trackFilter"
          @update:model-value="setTrackFilter"
        />
      </div>

      <Card>
        <div class="headline">
          <span class="hl-dist">{{ dist.value }} <small>{{ dist.unit }}</small></span>
          <span class="hl-date">{{ formatActivityDate(move.startedAt) }}</span>
        </div>
      </Card>

      <Card>
        <dl class="stats">
          <div class="row"><dt>Tiempo</dt><dd>{{ duration }}</dd></div>
          <div class="row"><dt>En pausa</dt><dd>{{ paused }} · {{ move.pauses ?? 0 }}×</dd></div>
          <div class="row"><dt>Ritmo medio</dt><dd>{{ pace }} /km</dd></div>
          <div class="row"><dt>Velocidad media</dt><dd>{{ speed }} km/h</dd></div>
          <div class="row"><dt>Desnivel +</dt><dd>{{ elevation }}</dd></div>
          <div class="row"><dt>Pasos</dt><dd>{{ move.steps ?? "—" }}</dd></div>
          <div class="row"><dt>Puntos GPS</dt><dd>{{ points.length }}</dd></div>
        </dl>
      </Card>
    </template>

    <template v-else-if="ex">
      <Card>
        <div class="headline">
          <span class="hl-dist">{{ exReps }} <small>reps</small></span>
          <span class="hl-date">{{ formatActivityDate(ex.startedAt) }}</span>
        </div>
      </Card>

      <Card>
        <dl class="stats">
          <div v-for="(s, i) in ex.sets" :key="i" class="row">
            <dt>Serie {{ i + 1 }}</dt>
            <dd>{{ s.reps }}</dd>
          </div>
          <div class="row"><dt>Series</dt><dd>{{ ex.sets.length }}</dd></div>
        </dl>
      </Card>
    </template>

    <AppButton block variant="danger" @press="onDelete">Borrar actividad</AppButton>
  </AppSubScreen>
</template>

<style scoped>
.filter {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.headline {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
.hl-dist {
  font-family: var(--font-mono);
  font-size: 40px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.hl-dist small {
  font-size: 16px;
  color: var(--muted);
}
.hl-date {
  font-size: 13px;
  color: var(--muted);
}
.stats {
  margin: 0;
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-2) 0;
}
.row + .row {
  border-top: 1px solid var(--line);
}
.stats dt {
  font-size: 13px;
  color: var(--muted);
}
.stats dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
