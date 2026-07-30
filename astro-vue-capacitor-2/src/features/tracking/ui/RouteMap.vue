<script setup lang="ts">
import { computed } from "vue";
import { projectRoute } from "../domain/route";
import type { TrackPoint } from "../domain/track-point";

/**
 * Offline route drawing: the GPS track as an SVG polyline, no basemap and no
 * dependency. A street basemap can later sit behind this same path.
 */
const props = defineProps<{ points: TrackPoint[] }>();

const W = 300;
const H = 180;
const route = computed(() => projectRoute(props.points, W, H));
</script>

<template>
  <div class="map">
    <svg
      v-if="route"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="xMidYMid meet"
      class="svg"
    >
      <path :d="route.d" class="track" vector-effect="non-scaling-stroke" />
      <circle :cx="route.start.x" :cy="route.start.y" r="5" class="start" />
      <circle
        :cx="route.end.x"
        :cy="route.end.y"
        r="5"
        class="end"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <div v-else class="empty">Esperando señal GPS…</div>
  </div>
</template>

<style scoped>
.map {
  aspect-ratio: 3 / 2;
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.svg {
  display: block;
  width: 100%;
  height: 100%;
}
.track {
  fill: none;
  stroke: var(--accent);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.start {
  fill: var(--accent);
}
.end {
  fill: var(--bg);
  stroke: var(--accent);
  stroke-width: 3;
}
.empty {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--muted);
}
</style>
