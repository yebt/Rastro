<script setup lang="ts">
import { computed, ref } from 'vue';
import { fmtDistanceLabel, fmtPace } from '../../lib/format';
import type { Segment } from '../../lib/reports';

const props = defineProps<{ segments: Segment[]; height?: number }>();

const W = 320;
const H = computed(() => props.height ?? 150);
const PAD_X = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 20;

const GAP = 2;

const view = computed(() => {
  const segs = props.segments;
  if (!segs.length) return null;
  const h = H.value;
  const innerH = h - PAD_TOP - PAD_BOTTOM;
  const innerW = W - PAD_X * 2;
  const maxSpeed = Math.max(...segs.map((s) => s.speedKmh), 0.001);

  let fastest = 0;
  segs.forEach((s, i) => {
    if (!s.partial && s.speedKmh > segs[fastest]!.speedKmh) fastest = i;
  });

  const bw = innerW / segs.length;
  const bars = segs.map((s, i) => {
    const bh = Math.max(2, (s.speedKmh / maxSpeed) * innerH);
    return {
      x: PAD_X + i * bw + GAP / 2,
      y: PAD_TOP + (innerH - bh),
      w: Math.max(1, bw - GAP),
      h: bh,
      best: i === fastest,
      seg: s,
    };
  });

  return { bars, yBottom: h - PAD_BOTTOM, totalM: segs[segs.length - 1]!.endM, maxSpeed };
});

const svgRef = ref<SVGSVGElement | null>(null);
const active = ref<number | null>(null);

function onMove(e: PointerEvent): void {
  const v = view.value;
  if (!v || !svgRef.value) return;
  const rect = svgRef.value.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * W;
  let best = 0;
  let bestD = Infinity;
  v.bars.forEach((b, i) => {
    const d = Math.abs(b.x + b.w / 2 - px);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  active.value = best;
}

function onLeave(): void {
  active.value = null;
}

const activeBar = computed(() =>
  active.value !== null && view.value ? view.value.bars[active.value] : null,
);
const labelX = computed(() => {
  const b = activeBar.value;
  return b ? Math.min(W - 60, Math.max(60, b.x + b.w / 2)) : 0;
});
</script>

<template>
  <svg
    v-if="view"
    ref="svgRef"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="xMidYMid meet"
    class="segchart"
    role="img"
    @pointermove="onMove"
    @pointerdown="onMove"
    @pointerup="onLeave"
    @pointerleave="onLeave"
    @pointercancel="onLeave"
  >
    <line :x1="PAD_X" :x2="W - PAD_X" :y1="view.yBottom" :y2="view.yBottom" class="axis" />

    <rect
      v-for="(b, i) in view.bars"
      :key="i"
      :x="b.x"
      :y="b.y"
      :width="b.w"
      :height="b.h"
      rx="1.5"
      class="bar"
      :class="{ best: b.best, on: i === active }"
    />

    <text :x="PAD_X" :y="H - 5" class="xl">0</text>
    <text :x="W - PAD_X" :y="H - 5" class="xl" text-anchor="end">{{ fmtDistanceLabel(view.totalM) }}</text>

    <g v-if="activeBar">
      <text :x="labelX" :y="10" class="tip" text-anchor="middle">
        {{ fmtDistanceLabel(activeBar.seg.startM) }}–{{ fmtDistanceLabel(activeBar.seg.endM) }} ·
        {{ activeBar.seg.speedKmh.toFixed(1) }} km/h · {{ fmtPace(activeBar.seg.paceSecPerKm) }}/km
      </text>
    </g>
  </svg>
  <p v-else class="chart-empty">Sin datos de recorrido.</p>
</template>

<style scoped>
.segchart {
  width: 100%;
  height: auto;
  display: block;
  touch-action: pan-y;
}
.axis {
  stroke: var(--line);
  stroke-width: 1;
}
.bar {
  fill: var(--blue);
  opacity: 0.85;
}
.bar.best {
  fill: var(--green);
}
.bar.on {
  opacity: 1;
}
.xl {
  font-family: var(--sans);
  font-size: 9px;
  fill: var(--muted);
}
.tip {
  font-family: var(--cond);
  font-size: 11px;
  font-weight: 600;
  fill: var(--ink);
}
.chart-empty {
  color: var(--muted);
  font-size: 13px;
  text-align: center;
  padding: 20px;
}
</style>
