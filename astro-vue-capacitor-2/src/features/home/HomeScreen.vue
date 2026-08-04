<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted } from "vue";
import { AppIcon, AppScreen, Card, Label } from "../../shared/ui";
import { $activities, loadActivities } from "../history/history.store";
import { currentStreak, dailyTotals, weekSummary } from "../history/summary";
import { distanceParts, formatDuration, type MoveType, setStartIntent } from "../tracking";
import { setTab } from "../shell/nav.store";

/**
 * Home: a sporty, graphical dashboard — the active-day streak, a week-at-a-glance
 * bar chart, and quick-start favorites that drop you on the Ready screen for a
 * move type. No history list here; history lives under the Info tab.
 */
const activities = useStore($activities);
onMounted(() => {
  void loadActivities();
});

const now = () => Date.now();
const streak = computed(() => currentStreak(activities.value, now()));
const week = computed(() => weekSummary(activities.value, now()));
const weekDist = computed(() => distanceParts(week.value.distanceM));
const weekTime = computed(() => formatDuration(week.value.movingMs));

const DOW = ["D", "L", "M", "M", "J", "V", "S"];
const days = computed(() => dailyTotals(activities.value, now(), 7));
const useDist = computed(() => days.value.some((d) => d.distanceM > 0));
const maxVal = computed(() =>
  Math.max(1e-6, ...days.value.map((d) => (useDist.value ? d.distanceM : d.count))),
);
const bars = computed(() =>
  days.value.map((d, i) => ({
    pct: Math.round(((useDist.value ? d.distanceM : d.count) / maxVal.value) * 100),
    label: DOW[new Date(d.t).getDay()],
    active: d.count > 0,
    today: i === days.value.length - 1,
  })),
);

const FAVORITES: { type: MoveType; label: string; hint: string }[] = [
  { type: "run", label: "Correr", hint: "A fondo" },
  { type: "jog", label: "Trotar", hint: "Ritmo suave" },
  { type: "walk", label: "Caminar", hint: "Paso tranquilo" },
];

function quickStart(type: MoveType): void {
  setStartIntent(type);
  setTab("workout");
}
</script>

<template>
  <AppScreen title="Inicio">
    <!-- Streak hero -->
    <Card class="hero">
      <div class="streak-n">
        <b>{{ streak }}</b>
        <span>{{ streak === 1 ? "día activo" : "días activos" }}</span>
      </div>
      <AppIcon name="run" size="30px" class="hero-ic" />
    </Card>

    <!-- Week graph -->
    <Card>
      <div class="wk-head">
        <Label>Esta semana</Label>
        <span class="wk-tot">
          {{ useDist ? `${weekDist.value} ${weekDist.unit}` : `${week.count} act.` }} · {{ weekTime }}
        </span>
      </div>
      <div class="chart">
        <div v-for="(b, i) in bars" :key="i" class="col">
          <span class="track">
            <span class="bar" :class="{ active: b.active, today: b.today }" :style="{ height: `${Math.max(3, b.pct)}%` }"></span>
          </span>
          <small :class="{ on: b.today }">{{ b.label }}</small>
        </div>
      </div>
    </Card>

    <!-- Quick-start favorites -->
    <Label>Empezá ahora</Label>
    <div class="favs">
      <button
        v-for="f in FAVORITES"
        :key="f.type"
        type="button"
        class="fav"
        @click="quickStart(f.type)"
      >
        <AppIcon :name="f.type" size="22px" class="fav-ic" />
        <span class="fav-text">
          <b>{{ f.label }}</b>
          <small>{{ f.hint }}</small>
        </span>
        <AppIcon name="play" size="16px" class="fav-go" />
      </button>
    </div>
  </AppScreen>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.streak-n {
  display: flex;
  flex-direction: column;
}
.streak-n b {
  font-family: var(--font-mono);
  font-size: 44px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.streak-n span {
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
}
.hero-ic {
  color: var(--accent);
}
.wk-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-2);
}
.wk-tot {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.chart {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--sp-2);
  height: 120px;
  margin-top: var(--sp-3);
}
.col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 0;
}
.track {
  flex: 1;
  width: 60%;
  display: flex;
  align-items: flex-end;
  min-height: 0;
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
.col small {
  font-size: 11px;
  color: var(--muted);
}
.col small.on {
  color: var(--accent);
  font-weight: 600;
}
.favs {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.fav {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  text-align: left;
  color: var(--ink);
}
.fav:active {
  border-color: var(--ink);
}
.fav-ic {
  flex: none;
  color: var(--ink);
}
.fav-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fav-text b {
  font-family: var(--font-cond);
  font-size: 19px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
.fav-text small {
  font-size: 12px;
  color: var(--muted);
}
.fav-go {
  flex: none;
  color: var(--accent);
}
</style>
