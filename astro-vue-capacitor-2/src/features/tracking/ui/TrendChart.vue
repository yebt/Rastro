<script setup lang="ts">
import { computed } from "vue";

/**
 * Tiny dependency-free line/area chart for a numeric series (e.g. speed over
 * time). Pure SVG so it renders offline and scales crisply. Zeros are kept —
 * a flat-to-zero dip is real stopped time, not missing data.
 */
const props = withDefaults(
  defineProps<{
    values: number[];
    /** Formats the peak/low annotations. */
    format?: (v: number) => string;
    height?: number;
  }>(),
  { format: (v: number) => String(Math.round(v)), height: 120 },
);

const W = 300;
const PAD = 6;

const stats = computed(() => {
  const vs = props.values;
  const max = Math.max(1e-6, ...vs);
  const min = Math.min(...vs);
  return { max, min };
});

const path = computed(() => {
  const vs = props.values;
  if (vs.length < 2) return { line: "", area: "" };
  const H = props.height;
  const max = stats.value.max;
  const stepX = (W - PAD * 2) / (vs.length - 1);
  const y = (v: number): number => H - PAD - (v / max) * (H - PAD * 2);
  const pts = vs.map((v, i) => [PAD + i * stepX, y(v)] as const);
  const line = pts.map(([x, yy], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${yy.toFixed(1)}`).join(" ");
  const area = `${line} L${(PAD + (vs.length - 1) * stepX).toFixed(1)} ${props.height - PAD} L${PAD} ${props.height - PAD} Z`;
  return { line, area };
});
</script>

<template>
  <div class="chart">
    <svg :viewBox="`0 0 ${W} ${height}`" preserveAspectRatio="none" class="svg">
      <path :d="path.area" class="area" />
      <path :d="path.line" class="line" />
    </svg>
    <div class="axis">
      <span>máx {{ format(stats.max) }}</span>
      <span>mín {{ format(stats.min) }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
.svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}
.area {
  fill: color-mix(in srgb, var(--accent) 16%, transparent);
  stroke: none;
}
.line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.axis {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}
</style>
