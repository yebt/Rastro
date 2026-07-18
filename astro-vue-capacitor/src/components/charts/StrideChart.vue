<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CadenceBin, StridePoint } from '../../lib/stride';

const props = defineProps<{
  points: StridePoint[];
  bins: CadenceBin[];
  optimalCadence: number;
  diminishingCadence: number | null;
  height?: number;
}>();

const W = 320;
const H = computed(() => props.height ?? 150);
const PAD_L = 30;
const PAD_R = 10;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;

const OPTIMAL = '#12A150';
const DOT = '#1B4DFF';

const view = computed(() => {
  const pts = props.points;
  if (pts.length < 2) return null;
  const h = H.value;
  const innerH = h - PAD_TOP - PAD_BOTTOM;
  const innerW = W - PAD_L - PAD_R;

  const cads = pts.map((p) => p.cad);
  const strides = pts.map((p) => p.stride);
  const cMin = Math.min(...cads);
  const cMax = Math.max(...cads);
  let sMin = Math.min(...strides);
  let sMax = Math.max(...strides);
  const sPad = (sMax - sMin) * 0.12 || 0.1;
  sMin -= sPad;
  sMax += sPad;
  const cSpan = cMax - cMin || 1;

  const x = (c: number) => PAD_L + ((c - cMin) / cSpan) * innerW;
  const y = (s: number) => PAD_TOP + (1 - (s - sMin) / (sMax - sMin || 1)) * innerH;

  const scaled = pts.map((p) => ({ x: x(p.cad), y: y(p.stride), ...p }));
  const trend = props.bins
    .map((b) => `${x(b.cadMid).toFixed(1)},${y(b.avgStride).toFixed(1)}`)
    .join(' ');

  // Highlight band = the optimal bin's [cadMin, cadMax] on the X axis.
  const optBin = props.bins.find((b) => Math.round(b.cadMid) === props.optimalCadence);
  const band = optBin
    ? { x1: Math.max(PAD_L, x(optBin.cadMin)), x2: Math.min(W - PAD_R, x(optBin.cadMax)) }
    : null;

  return {
    scaled,
    trend,
    band,
    yTop: PAD_TOP,
    yBottom: h - PAD_BOTTOM,
    sTop: sMax,
    sBottom: sMin,
    cMin,
    cMax,
    optX: x(props.optimalCadence),
  };
});

const svgRef = ref<SVGSVGElement | null>(null);
const active = ref<number | null>(null);

function onMove(e: PointerEvent): void {
  const v = view.value;
  if (!v || !svgRef.value) return;
  const rect = svgRef.value.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * W;
  const py = ((e.clientY - rect.top) / rect.height) * H.value;
  let best = 0;
  let bestD = Infinity;
  v.scaled.forEach((p, i) => {
    const d = (p.x - px) ** 2 + (p.y - py) ** 2;
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
  return p ? Math.min(W - 48, Math.max(48, p.x)) : 0;
});
</script>

<template>
  <svg
    v-if="view"
    ref="svgRef"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="xMidYMid meet"
    class="stridechart"
    role="img"
    @pointermove="onMove"
    @pointerdown="onMove"
    @pointerup="onLeave"
    @pointerleave="onLeave"
    @pointercancel="onLeave"
  >
    <!-- optimal cadence band -->
    <rect
      v-if="view.band"
      :x="view.band.x1"
      :y="view.yTop"
      :width="Math.max(0, view.band.x2 - view.band.x1)"
      :height="view.yBottom - view.yTop"
      class="band"
    />

    <!-- axes -->
    <line :x1="PAD_L" :x2="W - PAD_R" :y1="view.yBottom" :y2="view.yBottom" class="axis" />
    <line :x1="PAD_L" :x2="W - PAD_R" :y1="view.yTop" :y2="view.yTop" class="grid" />

    <!-- bin trend of average stride -->
    <polyline :points="view.trend" fill="none" class="trend" vector-effect="non-scaling-stroke" />

    <!-- raw points -->
    <circle
      v-for="(p, i) in view.scaled"
      :key="i"
      :cx="p.x"
      :cy="p.y"
      r="2.6"
      class="dot"
      :fill="DOT"
    />

    <!-- y labels (stride, m) -->
    <text :x="4" :y="view.yTop + 9" class="yl">{{ view.sTop.toFixed(2) }}</text>
    <text :x="4" :y="view.yBottom - 2" class="yl">{{ view.sBottom.toFixed(2) }}</text>
    <text :x="PAD_L" :y="H - 6" class="xl">{{ Math.round(view.cMin) }}</text>
    <text :x="W - PAD_R" :y="H - 6" class="xl" text-anchor="end">{{ Math.round(view.cMax) }} ppm</text>

    <!-- tooltip -->
    <g v-if="activePoint">
      <circle :cx="activePoint.x" :cy="activePoint.y" r="4.5" :fill="OPTIMAL" class="cursor-dot" />
      <text :x="labelX" :y="10" class="tip" text-anchor="middle">
        {{ Math.round(activePoint.cad) }} ppm · {{ activePoint.stride.toFixed(2) }} m
      </text>
    </g>
  </svg>
  <p v-else class="chart-empty">Sin datos de zancada.</p>
</template>

<style scoped>
.stridechart {
  width: 100%;
  height: auto;
  display: block;
  touch-action: pan-y;
}
.band {
  fill: #12a150;
  opacity: 0.1;
}
.axis {
  stroke: var(--line);
  stroke-width: 1;
}
.grid {
  stroke: var(--line);
  stroke-width: 1;
  opacity: 0.5;
}
.trend {
  stroke: #12a150;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  opacity: 0.85;
}
.dot {
  opacity: 0.5;
}
.cursor-dot {
  stroke: #fff;
  stroke-width: 2;
}
.yl {
  font-family: var(--cond);
  font-size: 10px;
  fill: var(--muted);
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
