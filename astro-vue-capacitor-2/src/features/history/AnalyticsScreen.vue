<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted } from "vue";
import { AppScreen, Card, Label } from "../../shared/ui";
import {
  avgPaceSecPerKm,
  cleanTrack,
  distanceMeters,
  distanceParts,
  formatDuration,
  formatPace,
  MOVE_LABEL,
  type MoveActivity,
  type MoveType,
} from "../tracking";
import { $activities, loadActivities } from "./history.store";
import { currentStreak, dailyTotals } from "./summary";

/**
 * Profile analytics — the "all-time picture" behind Home's weekly card. Built to
 * grow: lifetime totals, a per-type breakdown, records, and a two-week activity
 * strip. Everything derived from stored activities.
 */
defineEmits<{ back: [] }>();

const activities = useStore($activities);
onMounted(() => {
  void loadActivities();
});

const moves = computed(() => activities.value.filter((a): a is MoveActivity => a.kind === "move"));

// Lifetime totals.
const totalDist = computed(() =>
  distanceParts(moves.value.reduce((s, a) => s + distanceMeters(cleanTrack(a.points)), 0)),
);
const totalTime = computed(() => formatDuration(moves.value.reduce((s, a) => s + (a.movingMs ?? 0), 0)));
const streak = computed(() => currentStreak(activities.value, Date.now()));

// Per movement type.
const TYPES: MoveType[] = ["run", "jog", "walk"];
const byType = computed(() =>
  TYPES.map((type) => {
    const list = moves.value.filter((m) => m.type === type);
    const distM = list.reduce((s, a) => s + distanceMeters(cleanTrack(a.points)), 0);
    const timeMs = list.reduce((s, a) => s + (a.movingMs ?? 0), 0);
    const pace = distM > 0 && timeMs > 0 ? timeMs / 1000 / (distM / 1000) : null;
    return { type, label: MOVE_LABEL[type], count: list.length, dist: distanceParts(distM), pace };
  }).filter((t) => t.count > 0),
);

// Records.
const records = computed(() => {
  let longest = 0;
  let best: number | null = null;
  let mostSteps = 0;
  for (const a of moves.value) {
    const clean = cleanTrack(a.points);
    longest = Math.max(longest, distanceMeters(clean));
    const p = avgPaceSecPerKm(clean);
    if (p != null && (best == null || p < best)) best = p;
    mostSteps = Math.max(mostSteps, a.steps ?? 0);
  }
  return { longest: distanceParts(longest), best, mostSteps };
});

// Two-week activity strip.
const days = computed(() => dailyTotals(activities.value, Date.now(), 14));
const maxDay = computed(() => Math.max(1e-6, ...days.value.map((d) => d.distanceM)));
const bars = computed(() =>
  days.value.map((d, i) => ({
    pct: Math.round((d.distanceM / maxDay.value) * 100),
    active: d.count > 0,
    today: i === days.value.length - 1,
  })),
);
</script>

<template>
  <AppScreen title="Analíticas">
    <Card>
      <Label>Totales</Label>
      <div class="grid">
        <div class="stat"><b>{{ moves.length }}</b><small>salidas</small></div>
        <div class="stat"><b>{{ totalDist.value }}</b><small>{{ totalDist.unit }}</small></div>
        <div class="stat"><b>{{ totalTime }}</b><small>tiempo</small></div>
        <div class="stat"><b>{{ streak }}</b><small>racha (días)</small></div>
      </div>
    </Card>

    <template v-if="byType.length">
      <Label>Por tipo</Label>
      <Card>
        <dl class="rows">
          <div v-for="t in byType" :key="t.type" class="r">
            <dt>{{ t.label }}</dt>
            <dd>{{ t.count }} · {{ t.dist.value }} {{ t.dist.unit }} · {{ formatPace(t.pace) }} /km</dd>
          </div>
        </dl>
      </Card>
    </template>

    <Label>Récords</Label>
    <Card>
      <dl class="rows">
        <div class="r"><dt>Distancia más larga</dt><dd>{{ records.longest.value }} {{ records.longest.unit }}</dd></div>
        <div class="r"><dt>Mejor ritmo</dt><dd>{{ formatPace(records.best) }} /km</dd></div>
        <div class="r"><dt>Más pasos</dt><dd>{{ records.mostSteps || "—" }}</dd></div>
      </dl>
    </Card>

    <Label>Últimas 2 semanas</Label>
    <Card>
      <div class="chart">
        <span v-for="(b, i) in bars" :key="i" class="track">
          <span class="bar" :class="{ active: b.active, today: b.today }" :style="{ height: `${Math.max(3, b.pct)}%` }"></span>
        </span>
      </div>
    </Card>
  </AppScreen>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-4) var(--sp-3);
  margin-top: var(--sp-3);
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
  min-width: 0;
}
.stat b {
  max-width: 100%;
  font-family: var(--font-mono);
  font-size: clamp(15px, 5vw, 22px);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat small {
  font-size: 11px;
  color: var(--muted);
}
.rows {
  margin: 0;
  display: flex;
  flex-direction: column;
}
.r {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-2) 0;
}
.r + .r {
  border-top: 1px solid var(--line);
}
.r dt {
  font-size: 13px;
  color: var(--muted);
}
.r dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.chart {
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  gap: 3px;
  height: 90px;
  align-items: end;
}
.track {
  height: 100%;
  display: flex;
  align-items: flex-end;
}
.bar {
  width: 100%;
  background: var(--surface-2);
  border-radius: var(--r-sm);
}
.bar.active {
  background: var(--line-2);
}
.bar.today {
  background: var(--accent);
}
</style>
