<script setup lang="ts">
import { computed } from "vue";
import { AppButton, AppSubScreen, Card } from "../../shared/ui";
import {
  avgPaceSecPerKm,
  avgSpeedMps,
  cleanTrack,
  distanceMeters,
  distanceParts,
  formatActivityDate,
  formatDuration,
  formatPace,
  formatSpeed,
  type MoveActivity,
  MOVE_LABEL,
  pausedMs,
} from "../tracking";
import RouteMap from "../tracking/ui/RouteMap.vue";
import { deleteActivity } from "./history.store";

const props = defineProps<{ activity: MoveActivity }>();
const emit = defineEmits<{ back: [] }>();

const points = computed(() => props.activity.points);
const clean = computed(() => cleanTrack(points.value));
const dist = computed(() => distanceParts(distanceMeters(clean.value)));
const duration = computed(() => formatDuration(props.activity.movingMs ?? 0));
const paused = computed(() =>
  formatDuration(pausedMs(props.activity.startedAt, props.activity.endedAt, props.activity.movingMs ?? 0)),
);
const pace = computed(() => formatPace(avgPaceSecPerKm(clean.value)));
const speed = computed(() => formatSpeed(avgSpeedMps(clean.value)));

async function onDelete(): Promise<void> {
  await deleteActivity(props.activity.id);
  emit("back");
}
</script>

<template>
  <AppSubScreen :title="MOVE_LABEL[activity.type]" @back="emit('back')">
    <RouteMap :points="clean" />

    <Card>
      <div class="headline">
        <span class="hl-dist">{{ dist.value }} <small>{{ dist.unit }}</small></span>
        <span class="hl-date">{{ formatActivityDate(activity.startedAt) }}</span>
      </div>
    </Card>

    <Card>
      <dl class="stats">
        <div class="row">
          <dt>Tiempo</dt>
          <dd>{{ duration }}</dd>
        </div>
        <div class="row">
          <dt>En pausa</dt>
          <dd>{{ paused }} · {{ activity.pauses ?? 0 }}×</dd>
        </div>
        <div class="row">
          <dt>Ritmo medio</dt>
          <dd>{{ pace }} /km</dd>
        </div>
        <div class="row">
          <dt>Velocidad media</dt>
          <dd>{{ speed }} km/h</dd>
        </div>
        <div class="row">
          <dt>Pasos</dt>
          <dd>{{ activity.steps ?? "—" }}</dd>
        </div>
        <div class="row">
          <dt>Puntos GPS</dt>
          <dd>{{ points.length }}</dd>
        </div>
      </dl>
    </Card>

    <AppButton block variant="danger" @press="onDelete">Borrar actividad</AppButton>
  </AppSubScreen>
</template>

<style scoped>
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
