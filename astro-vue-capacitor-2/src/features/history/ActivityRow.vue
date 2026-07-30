<script setup lang="ts">
import { computed } from "vue";
import { AppIcon } from "../../shared/ui";
import {
  cleanTrack,
  distanceMeters,
  distanceParts,
  formatActivityDate,
  formatDuration,
  type MoveActivity,
  MOVE_LABEL,
} from "../tracking";

const props = defineProps<{ activity: MoveActivity }>();
defineEmits<{ open: [] }>();

const dist = computed(() => distanceParts(distanceMeters(cleanTrack(props.activity.points))));
const dur = computed(() => formatDuration(props.activity.movingMs ?? 0));
const date = computed(() => formatActivityDate(props.activity.startedAt));
</script>

<template>
  <button type="button" class="row" @click="$emit('open')">
    <span class="main">
      <b class="type">{{ MOVE_LABEL[activity.type] }}</b>
      <small class="date">{{ date }}</small>
    </span>
    <span class="stats">
      <b class="dist">{{ dist.value }} {{ dist.unit }}</b>
      <small class="dur">{{ dur }}</small>
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
