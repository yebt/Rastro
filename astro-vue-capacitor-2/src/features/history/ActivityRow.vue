<script setup lang="ts">
import { computed } from "vue";
import { AppIcon } from "../../shared/ui";
import {
  type Activity,
  cleanTrack,
  distanceMeters,
  distanceParts,
  exerciseLabel,
  formatActivityDate,
  formatDuration,
  MOVE_LABEL,
  routineEntriesReps,
  totalReps,
} from "../tracking";

const props = defineProps<{ activity: Activity; record?: boolean }>();
defineEmits<{ open: [] }>();

const date = computed(() => formatActivityDate(props.activity.startedAt));

const title = computed(() => {
  const a = props.activity;
  if (a.kind === "move") return MOVE_LABEL[a.type];
  if (a.kind === "routine") return a.name || "Rutina";
  return exerciseLabel(a.exercise);
});

const primary = computed(() => {
  const a = props.activity;
  if (a.kind === "move") {
    const d = distanceParts(distanceMeters(cleanTrack(a.points)));
    return `${d.value} ${d.unit}`;
  }
  if (a.kind === "routine") return `${routineEntriesReps(a.entries)} reps`;
  return `${totalReps(a.sets)} reps`;
});

const secondary = computed(() => {
  const a = props.activity;
  if (a.kind === "move") return formatDuration(a.movingMs ?? 0);
  if (a.kind === "routine") return `${a.rounds} ${a.rounds === 1 ? "vuelta" : "vueltas"}`;
  return `${a.sets.length} ${a.sets.length === 1 ? "serie" : "series"}`;
});
</script>

<template>
  <button type="button" class="row" @click="$emit('open')">
    <span class="main">
      <b class="type">
        {{ title }}
        <AppIcon v-if="record" name="award" size="14px" class="rec" />
      </b>
      <small class="date">{{ date }}</small>
    </span>
    <span class="stats">
      <b class="dist">{{ primary }}</b>
      <small class="dur">{{ secondary }}</small>
    </span>
    <AppIcon name="chevron" size="16px" class="chev" />
  </button>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: var(--sp-3) 0;
  text-align: left;
}
.row + .row {
  border-top: 1px solid var(--line);
}
.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.type {
  font-family: var(--font-cond);
  font-size: 17px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
.rec {
  color: var(--accent);
  vertical-align: -2px;
  margin-left: 2px;
}
.date {
  font-size: 12px;
  color: var(--muted);
}
.stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.dist {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.dur {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.chev {
  flex: none;
  color: var(--muted);
}
</style>
