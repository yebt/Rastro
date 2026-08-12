<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted } from "vue";
import { AppIcon, AppScreen, Card, Label } from "../../shared/ui";
import { $activities, loadActivities } from "../history/history.store";
import { $goals } from "../history/goals.store";
import { currentStreak, dailyTotals, todayReps, weekSummary } from "../history/summary";
import { distanceParts, formatDuration, type MoveType, setStartIntent } from "../tracking";
import { setInfoView } from "../history/info-view.store";
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

const goals = useStore($goals);
const weekKm = computed(() => week.value.distanceM / 1000);
const todayRepsN = computed(() => todayReps(activities.value, now()));
const pct = (v: number, target: number): number => (target > 0 ? Math.min(100, Math.round((v / target) * 100)) : 0);
const hasGoals = computed(() => goals.value.kmWeekly > 0 || goals.value.repsDaily > 0);

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
function goHistory(): void {
  setInfoView("history");
  setTab("profile");
}
function goAnalytics(): void {
  setInfoView("analytics");
  setTab("profile");
}
</script>

<template>
  <AppScreen title="Inicio">
    <!-- Streak hero → history -->
    <Card class="hero" role="button" tabindex="0" @click="goHistory">
      <div class="streak-n">
        <b>{{ streak }}</b>
        <span>{{ streak === 1 ? "día activo" : "días activos" }}</span>
      </div>
      <AppIcon name="chevron" size="22px" class="hero-ic" />
    </Card>

    <!-- Week graph → analytics -->
    <Card class="week" role="button" tabindex="0" @click="goAnalytics">
      <div class="wk-head">
        <Label>Esta semana</Label>
        <span class="wk-tot">
          {{ useDist ? `${weekDist.value} ${weekDist.unit}` : `${week.count} act.` }} · {{ weekTime }}
          <AppIcon name="chevron" size="14px" class="wk-chev" />
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

    <!-- Goals -->
    <template v-if="hasGoals">
      <Label>Metas</Label>
      <Card v-if="goals.kmWeekly > 0">
        <div class="g-head"><span>Semanal</span><b>{{ weekKm.toFixed(1) }} / {{ goals.kmWeekly }} km</b></div>
        <div class="pbar"><span :style="{ width: `${pct(weekKm, goals.kmWeekly)}%` }"></span></div>
      </Card>
      <Card v-if="goals.repsDaily > 0">
        <div class="g-head"><span>Reps de hoy</span><b>{{ todayRepsN }} / {{ goals.repsDaily }}</b></div>
        <div class="pbar"><span :style="{ width: `${pct(todayRepsN, goals.repsDaily)}%` }"></span></div>
      </Card>
    </template>

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
  cursor: pointer;
}
.hero:active {
  border-color: var(--ink);
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
.week {
  cursor: pointer;
}
.week:active {
  border-color: var(--ink);
}
.wk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}
.wk-tot {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.wk-chev {
  color: var(--faint);
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
.g-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}
.g-head span {
  font-size: 13px;
  color: var(--muted);
}
.g-head b {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.pbar {
  height: 8px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.pbar span {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.3s ease;
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
