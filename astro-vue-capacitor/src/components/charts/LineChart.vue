<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SeriesPoint } from '../../lib/reports';
import { fmtTime } from '../../lib/format';

const props = withDefaults(
  defineProps<{
    points: SeriesPoint[];
    color?: string;
    /** formats a y value for the axis labels + tooltip */
    format?: (v: number) => string;
    /** formats an x value (defaults to time mm:ss); pass a distance formatter for the distance axis */
    xFormat?: (x: number) => string;
    height?: number;
  }>(),
  { color: '#1B4DFF', height: 120 },
);

const xFmt = (x: number): string => (props.xFormat ? props.xFormat(x) : fmtTime(x));

const W = 320;
const PAD_X = 10;
const PAD_TOP = 16;
const PAD_BOTTOM = 18;

const view = computed(() => {
  const pts = props.points;
  if (pts.length < 2) return null;

  const H = props.height;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const innerW = W - PAD_X * 2;

  const ts = pts.map((p) => p.t);
  const vs = pts.map((p) => p.v);
  const tMin = Math.min(...ts);
  const tMax = Math.max(...ts);
  let vMin = Math.min(...vs);
  let vMax = Math.max(...vs);
  const pad = (vMax - vMin) * 0.08 || 1;
  vMin -= pad;
  vMax += pad;

  const x = (t: number) => PAD_X + (tMax === tMin ? 0.5 : (t - tMin) / (tMax - tMin)) * innerW;
  const y = (v: number) => PAD_TOP + (1 - (vMax === vMin ? 0.5 : (v - vMin) / (vMax - vMin))) * innerH;

  const scaled = pts.map((p) => ({ x: x(p.t), y: y(p.v), t: p.t, v: p.v }));
  const line = scaled.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${x(tMax).toFixed(1)},${(H - PAD_BOTTOM).toFixed(1)} L${x(tMin).toFixed(1)},${(H - PAD_BOTTOM).toFixed(1)} Z`;
  const avg = vs.reduce((a, b) => a + b, 0) / vs.length;

  return {
    H,
    scaled,
    line,
    area,
    yTop: PAD_TOP,
    yBottom: H - PAD_BOTTOM,
    avgY: y(avg),
    vTopLabel: Math.max(...vs),
    vBottomLabel: Math.min(...vs),
    tMin,
    tMax,
  };
});

const fmt = (v: number) => (props.format ? props.format(v) : v.toFixed(1));

const svgRef = ref<SVGSVGElement | null>(null);
const active = ref<number | null>(null);

function onMove(e: PointerEvent): void {
  const v = view.value;
  if (!v || !svgRef.value) return;
  const rect = svgRef.value.getBoundingClientRect();
  const svgX = ((e.clientX - rect.left) / rect.width) * W;
  let best = 0;
  let bestD = Infinity;
  v.scaled.forEach((p, i) => {
    const d = Math.abs(p.x - svgX);
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

const activePoint = computed(() =>
  active.value !== null && view.value ? view.value.scaled[active.value] : null,
);
const labelX = computed(() => {
  const p = activePoint.value;
  return p ? Math.min(W - 36, Math.max(36, p.x)) : 0;
});
</script>

<template>
  <svg
    v-if="view"
    ref="svgRef"
    :viewBox="`0 0 ${W} ${view.H}`"
    preserveAspectRatio="xMidYMid meet"
    class="linechart"
    role="img"
    @pointermove="onMove"
    @pointerdown="onMove"
    @pointerup="onLeave"
    @pointerleave="onLeave"
    @pointercancel="onLeave"
  >
    <line :x1="10" :x2="W - 10" :y1="view.yTop" :y2="view.yTop" class="grid" />
    <line :x1="10" :x2="W - 10" :y1="view.yBottom" :y2="view.yBottom" class="grid" />
    <line :x1="10" :x2="W - 10" :y1="view.avgY" :y2="view.avgY" class="avg" />
    <path :d="view.area" :fill="color" class="area" />
    <path :d="view.line" :stroke="color" fill="none" class="line" vector-effect="non-scaling-stroke" />

    <text :x="12" :y="view.yTop + 10" class="yl">{{ fmt(view.vTopLabel) }}</text>
    <text :x="12" :y="view.yBottom - 4" class="yl">{{ fmt(view.vBottomLabel) }}</text>
    <text :x="W - 12" :y="view.H - 4" class="xl" text-anchor="end">{{ xFmt(view.tMax) }}</text>
    <text :x="12" :y="view.H - 4" class="xl">{{ xFmt(view.tMin) }}</text>

    <g v-if="activePoint">
      <line :x1="activePoint.x" :x2="activePoint.x" :y1="view.yTop" :y2="view.yBottom" class="crosshair" />
      <circle :cx="activePoint.x" :cy="activePoint.y" r="4" :fill="color" class="cursor-dot" />
      <text :x="labelX" :y="11" class="tip" text-anchor="middle">
        {{ fmt(activePoint.v) }} · {{ xFmt(activePoint.t) }}
      </text>
    </g>
  </svg>
  <p v-else class="chart-empty">Sin datos suficientes.</p>
</template>

<style scoped>
.linechart {
  width: 100%;
  height: auto;
  display: block;
  touch-action: pan-y;
}
.area {
  opacity: 0.12;
}
.line {
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.grid {
  stroke: var(--line);
  stroke-width: 1;
}
.avg {
  stroke: var(--muted);
  stroke-width: 1;
  stroke-dasharray: 3 3;
  opacity: 0.5;
}
.yl {
  font-family: var(--cond);
  font-size: 11px;
  fill: var(--muted);
}
.xl {
  font-family: var(--sans);
  font-size: 9px;
  fill: var(--muted);
}
.crosshair {
  stroke: var(--muted);
  stroke-width: 1;
  stroke-dasharray: 2 2;
  opacity: 0.7;
}
.cursor-dot {
  stroke: #fff;
  stroke-width: 2;
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
