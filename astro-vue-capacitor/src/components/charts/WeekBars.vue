<script setup lang="ts">
import { computed, ref } from 'vue';
import type { WeekPoint } from '../../lib/trends';

const props = withDefaults(
  defineProps<{
    points: WeekPoint[];
    color?: string;
    /** formats a value for the tooltip */
    format?: (v: number) => string;
    height?: number;
  }>(),
  { color: '#1B4DFF', height: 130 },
);

const W = 320;
const PAD_X = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 20;
const GAP = 3;

const view = computed(() => {
  const pts = props.points;
  if (!pts.length) return null;
  const h = props.height;
  const innerH = h - PAD_TOP - PAD_BOTTOM;
  const innerW = W - PAD_X * 2;
  const maxV = Math.max(...pts.map((p) => p.value), 0.001);
  const bw = innerW / pts.length;

  const bars = pts.map((p, i) => {
    const bh = Math.max(2, (p.value / maxV) * innerH);
    return { x: PAD_X + i * bw + GAP / 2, y: PAD_TOP + (innerH - bh), w: Math.max(1, bw - GAP), h: bh, pt: p };
  });
  return { bars, yBottom: h - PAD_BOTTOM, first: pts[0]!, last: pts[pts.length - 1]!, H: h };
});

const fmt = (v: number): string => (props.format ? props.format(v) : String(Math.round(v)));

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
  return b ? Math.min(W - 44, Math.max(44, b.x + b.w / 2)) : 0;
});
</script>

<template>
  <svg
    v-if="view"
    ref="svgRef"
    :viewBox="`0 0 ${W} ${view.H}`"
    preserveAspectRatio="xMidYMid meet"
    class="weekbars"
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
      rx="2"
      class="bar"
      :class="{ on: i === active }"
      :fill="color"
    />
    <text :x="PAD_X" :y="view.H - 5" class="xl">{{ view.first.label }}</text>
    <text :x="W - PAD_X" :y="view.H - 5" class="xl" text-anchor="end">{{ view.last.label }}</text>

    <g v-if="activeBar">
      <text :x="labelX" :y="10" class="tip" text-anchor="middle">
        {{ activeBar.pt.label }} · {{ fmt(activeBar.pt.value) }}
      </text>
    </g>
  </svg>
  <p v-else class="chart-empty">Sin datos todavía.</p>
</template>

<style scoped>
.weekbars {
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
  opacity: 0.85;
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
  font-size: 12px;
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
