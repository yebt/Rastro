<script setup lang="ts">
import { computed } from "vue";
import { formatPace, type Split } from "../../tracking";

/**
 * Per-kilometre splits as a bar chart. Bar length is proportional to speed
 * (faster km → longer bar), the fastest split highlighted. The trailing partial
 * km is labelled with its distance.
 */
const props = defineProps<{ splits: Split[] }>();

const rows = computed(() => {
  const speeds = props.splits.map((s) => (s.paceSecPerKm ? 1 / s.paceSecPerKm : 0));
  const max = Math.max(1e-6, ...speeds);
  const best = Math.min(...props.splits.map((s) => s.paceSecPerKm ?? Infinity));
  return props.splits.map((s, i) => ({
    label: s.distanceM >= 1000 ? `K${s.index}` : `${(s.distanceM / 1000).toFixed(1)}`,
    pace: formatPace(s.paceSecPerKm),
    pct: Math.round((speeds[i]! / max) * 100),
    best: s.paceSecPerKm === best && Number.isFinite(best),
  }));
});
</script>

<template>
  <div class="splits">
    <div v-for="(r, i) in rows" :key="i" class="srow">
      <span class="k">{{ r.label }}</span>
      <span class="track">
        <span class="bar" :class="{ best: r.best }" :style="{ width: `${Math.max(6, r.pct)}%` }"></span>
      </span>
      <span class="pace">{{ r.pace }}</span>
    </div>
  </div>
</template>

<style scoped>
.splits {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.srow {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: var(--sp-2);
}
.k {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
}
.track {
  height: 14px;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.bar {
  display: block;
  height: 100%;
  background: var(--line-2);
  border-radius: 999px;
}
.bar.best {
  background: var(--accent);
}
.pace {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
