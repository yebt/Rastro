<script setup lang="ts">
import { computed } from 'vue';
import type { SeriesPoint } from '../../lib/reports';
import { fmtTime } from '../../lib/format';

const props = withDefaults(
  defineProps<{
    points: SeriesPoint[];
    color?: string;
    /** formats a y value for the axis labels */
    format?: (v: number) => string;
    height?: number;
  }>(),
  { color: '#1B4DFF', height: 120 },
);

const W = 320;
const PAD_X = 10;
const PAD_TOP = 14;
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

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(tMax).toFixed(1)},${(H - PAD_BOTTOM).toFixed(1)} L${x(tMin).toFixed(1)},${(H - PAD_BOTTOM).toFixed(1)} Z`;

  const avg = vs.reduce((a, b) => a + b, 0) / vs.length;

  return {
    H,
    line,
    area,
    yTop: PAD_TOP,
    yBottom: H - PAD_BOTTOM,
    avgY: y(avg),
    vTopLabel: Math.max(...vs),
    vBottomLabel: Math.min(...vs),
    tMax,
  };
});

const fmt = (v: number) => (props.format ? props.format(v) : v.toFixed(1));
</script>

<template>
  <svg
    v-if="view"
    :viewBox="`0 0 ${W} ${view.H}`"
    preserveAspectRatio="xMidYMid meet"
    class="linechart"
    role="img"
  >
    <!-- recessive gridlines -->
    <line :x1="10" :x2="W - 10" :y1="view.yTop" :y2="view.yTop" class="grid" />
    <line :x1="10" :x2="W - 10" :y1="view.yBottom" :y2="view.yBottom" class="grid" />
    <!-- average -->
    <line :x1="10" :x2="W - 10" :y1="view.avgY" :y2="view.avgY" class="avg" />
    <!-- data -->
    <path :d="view.area" :fill="color" class="area" />
    <path :d="view.line" :stroke="color" fill="none" class="line" vector-effect="non-scaling-stroke" />
    <!-- labels -->
    <text :x="12" :y="view.yTop + 10" class="yl">{{ fmt(view.vTopLabel) }}</text>
    <text :x="12" :y="view.yBottom - 4" class="yl">{{ fmt(view.vBottomLabel) }}</text>
    <text :x="W - 12" :y="view.H - 4" class="xl" text-anchor="end">{{ fmtTime(view.tMax) }}</text>
    <text :x="12" :y="view.H - 4" class="xl">0:00</text>
  </svg>
  <p v-else class="chart-empty">Sin datos suficientes.</p>
</template>

<style scoped>
.linechart {
  width: 100%;
  height: auto;
  display: block;
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
.chart-empty {
  color: var(--muted);
  font-size: 13px;
  text-align: center;
  padding: 20px;
}
</style>
