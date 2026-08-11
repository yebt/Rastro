<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted, ref } from "vue";
import { AppIcon, AppSubScreen, Card, Label } from "../../shared/ui";
import {
  $segments,
  deleteSegment,
  distanceParts,
  formatActivityDate,
  formatDuration,
  formatPace,
  type MoveActivity,
  type Segment,
  segmentEfforts,
} from "../tracking";
import { useBackHandler } from "../shell/useBackHandler";
import { $activities, loadActivities } from "./history.store";

/**
 * Segments — compare your pace over the same stretch across outings. Pick a
 * saved segment to see every run that covered it, fastest first (PR on top).
 */
defineEmits<{ back: [] }>();

const segments = useStore($segments);
const activities = useStore($activities);
onMounted(() => {
  void loadActivities();
});
const moves = computed(() => activities.value.filter((a): a is MoveActivity => a.kind === "move"));

const selected = ref<Segment | null>(null);
useBackHandler(
  computed(() => selected.value !== null),
  () => (selected.value = null),
);

function count(seg: Segment): number {
  return segmentEfforts(seg, moves.value).length;
}
const efforts = computed(() => (selected.value ? segmentEfforts(selected.value, moves.value) : []));
const selDist = computed(() => (selected.value ? distanceParts(selected.value.distanceM) : null));
</script>

<template>
  <!-- Segment detail: ranked efforts -->
  <AppSubScreen v-if="selected" :title="selected.name" @back="selected = null">
    <Card>
      <div class="headline">
        <span class="hl">{{ selDist?.value }} <small>{{ selDist?.unit }}</small></span>
        <span class="sub">{{ efforts.length }} {{ efforts.length === 1 ? "salida" : "salidas" }} en este tramo</span>
      </div>
    </Card>

    <Card v-if="efforts.length">
      <div v-for="(e, i) in efforts" :key="e.activityId" class="effort">
        <span class="rank" :class="{ pr: i === 0 }">{{ i === 0 ? "PR" : i + 1 }}</span>
        <span class="etxt">
          <b>{{ formatDuration(e.elapsedMs) }}</b>
          <small>{{ formatActivityDate(e.startedAt) }}</small>
        </span>
        <span class="epace">{{ formatPace(e.paceSecPerKm) }} /km</span>
      </div>
    </Card>
    <p v-else class="empty">Ninguna salida coincide con este tramo todavía.</p>
  </AppSubScreen>

  <!-- Segment list -->
  <AppSubScreen v-else title="Tramos" @back="$emit('back')">
    <Label>Guardá un recorrido como tramo desde su detalle para comparar acá.</Label>
    <Card v-if="segments.length">
      <div v-for="seg in segments" :key="seg.id" class="row">
        <button type="button" class="rmain" @click="selected = seg">
          <span class="rtext">
            <b>{{ seg.name }}</b>
            <small>{{ distanceParts(seg.distanceM).value }} {{ distanceParts(seg.distanceM).unit }} · {{ count(seg) }} salidas</small>
          </span>
          <AppIcon name="chevron" size="16px" class="rchev" />
        </button>
        <button type="button" class="rdel" aria-label="Borrar tramo" @click="deleteSegment(seg.id)">
          <AppIcon name="trash" size="16px" />
        </button>
      </div>
    </Card>
    <p v-else class="empty">Todavía no guardaste ningún tramo.</p>
  </AppSubScreen>
</template>

<style scoped>
.headline {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
.hl {
  font-family: var(--font-mono);
  font-size: 34px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.hl small {
  font-size: 15px;
  color: var(--muted);
}
.sub {
  font-size: 13px;
  color: var(--muted);
}
.effort {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) 0;
}
.effort + .effort {
  border-top: 1px solid var(--line);
}
.rank {
  flex: none;
  width: 34px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: var(--r-sm);
  background: var(--surface-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}
.rank.pr {
  background: var(--accent);
  color: var(--accent-ink);
}
.etxt {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.etxt b {
  font-family: var(--font-mono);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
.etxt small {
  font-size: 12px;
  color: var(--muted);
}
.epace {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.row {
  display: flex;
  align-items: center;
}
.row + .row {
  border-top: 1px solid var(--line);
}
.rmain {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) 0;
  text-align: left;
  color: var(--ink);
}
.rtext {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rtext b {
  font-family: var(--font-cond);
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
}
.rtext small {
  font-size: 12px;
  color: var(--muted);
}
.rchev {
  color: var(--muted);
}
.rdel {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: var(--muted);
}
.empty {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
</style>
