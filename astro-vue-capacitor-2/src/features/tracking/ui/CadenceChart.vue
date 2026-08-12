<script setup lang="ts">
import { computed } from "vue";
import type { CadenceBin } from "../../tracking";

/**
 * Stride length by cadence — the efficiency view. Taller bar = longer stride at
 * that cadence; the most efficient cadence is highlighted. Dependency-free.
 */
const props = defineProps<{ bins: CadenceBin[]; best: CadenceBin | null }>();

const maxStride = computed(() => Math.max(1e-6, ...props.bins.map((b) => b.strideM)));
</script>

<template>
  <div class="cad">
    <div v-for="b in bins" :key="b.cadence" class="col">
      <span class="track">
        <span
          class="bar"
          :class="{ best: best && b.cadence === best.cadence }"
          :style="{ height: `${Math.max(4, (b.strideM / maxStride) * 100)}%` }"
        ></span>
      </span>
      <small :class="{ on: best && b.cadence === best.cadence }">{{ b.cadence }}</small>
    </div>
  </div>
  <p class="unit">pasos/min · altura = zancada (m/paso)</p>
</template>

<style scoped>
.cad {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 110px;
}
.col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}
.track {
  flex: 1;
  width: 70%;
  display: flex;
  align-items: flex-end;
  min-height: 0;
}
.bar {
  width: 100%;
  background: var(--surface-2);
  border-radius: var(--r-sm);
}
.bar.best {
  background: var(--accent);
}
.col small {
  font-size: 10px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.col small.on {
  color: var(--accent);
  font-weight: 700;
}
.unit {
  margin: var(--sp-2) 0 0;
  font-size: 11px;
  color: var(--muted);
}
</style>
