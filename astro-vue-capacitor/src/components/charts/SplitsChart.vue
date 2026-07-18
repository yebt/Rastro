<script setup lang="ts">
import { computed } from 'vue';
import { fmtPace } from '../../lib/format';
import { fastestSplit, type Split } from '../../lib/reports';

const props = defineProps<{ splits: Split[]; selected?: number | null }>();
const emit = defineEmits<{ select: [km: number] }>();

const fastest = computed(() => fastestSplit(props.splits));

// Bar length ∝ split speed (m/s), so faster = longer (intuitive "bigger is better").
const maxSpeed = computed(() =>
  Math.max(...props.splits.map((s) => s.meters / s.seconds), 0.001),
);

function widthPct(s: Split): number {
  const speed = s.meters / s.seconds;
  return Math.max(8, (speed / maxSpeed.value) * 100);
}
</script>

<template>
  <div class="splits">
    <button
      v-for="s in splits"
      :key="s.km"
      type="button"
      class="split-row"
      :class="{ best: s.km === fastest, sel: s.km === selected }"
      @click="emit('select', s.km)"
    >
      <span class="split-k num">{{ s.partial ? `${(s.meters / 1000).toFixed(2)}` : s.km }}</span>
      <div class="split-bar-track">
        <div class="split-bar" :style="{ width: `${widthPct(s)}%` }"></div>
      </div>
      <span class="split-pace num">{{ fmtPace(s.paceSecPerKm) }}<small> /km</small></span>
    </button>
  </div>
</template>

<style scoped>
.splits {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.split-row {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  padding: 4px 6px;
  margin: 0 -6px;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease;
}
.split-row.sel {
  background: var(--surface);
}
.split-k {
  font-size: 15px;
  font-weight: 600;
  color: var(--muted);
  text-align: right;
}
.split-bar-track {
  height: 10px;
}
.split-bar {
  height: 10px;
  background: var(--blue);
  border-radius: 0 5px 5px 0;
  min-width: 6px;
}
.split-pace {
  font-size: 17px;
  font-weight: 600;
}
.split-pace small {
  font-size: 11px;
  color: var(--muted);
  font-weight: 500;
}
.split-row.best .split-bar {
  background: var(--green);
}
.split-row.best .split-k {
  color: var(--green);
}
</style>
