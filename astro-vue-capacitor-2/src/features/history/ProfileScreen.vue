<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, ref } from "vue";
import { AppScreen, Card, Label, Row, RowGroup } from "../../shared/ui";
import {
  type Activity,
  cleanTrack,
  distanceMeters,
  distanceParts,
  formatDuration,
  type MoveActivity,
  routineEntriesReps,
  totalReps,
} from "../tracking";
import { useBackHandler } from "../shell/useBackHandler";
import CalendarScreen from "./CalendarScreen.vue";
import HistoryScreen from "./HistoryScreen.vue";
import { $activities } from "./history.store";
import { currentStreak } from "./summary";

/** Info tab — lifetime data plus ways into the calendar and full history. */
type View = "menu" | "calendar" | "history";
const view = ref<View>("menu");

// Back from a sub-view returns to the menu (not straight Home).
useBackHandler(
  computed(() => view.value !== "menu"),
  () => {
    view.value = "menu";
  },
);

const activities = useStore($activities);

const moves = computed(() => activities.value.filter((a): a is MoveActivity => a.kind === "move"));
const salidas = computed(() => moves.value.length);
const distance = computed(() =>
  distanceParts(moves.value.reduce((sum, a) => sum + distanceMeters(cleanTrack(a.points)), 0)),
);
const time = computed(() =>
  formatDuration(moves.value.reduce((sum, a) => sum + (a.movingMs ?? 0), 0)),
);
const streak = computed(() => currentStreak(activities.value, Date.now()));
const reps = computed(() =>
  activities.value.reduce((sum, a: Activity) => {
    if (a.kind === "exercise") return sum + totalReps(a.sets);
    if (a.kind === "routine") return sum + routineEntriesReps(a.entries);
    return sum;
  }, 0),
);
</script>

<template>
  <CalendarScreen v-if="view === 'calendar'" @back="view = 'menu'" />
  <HistoryScreen v-else-if="view === 'history'" @back="view = 'menu'" />

  <AppScreen v-else title="Info">
    <Card>
      <Label>Totales</Label>
      <div class="grid">
        <div class="stat">
          <b>{{ salidas }}</b><small>{{ salidas === 1 ? "salida" : "salidas" }}</small>
        </div>
        <div class="stat"><b>{{ distance.value }}</b><small>{{ distance.unit }}</small></div>
        <div class="stat"><b>{{ time }}</b><small>tiempo</small></div>
        <div class="stat"><b>{{ streak }}</b><small>racha (días)</small></div>
        <div class="stat"><b>{{ reps }}</b><small>reps</small></div>
      </div>
    </Card>

    <RowGroup>
      <Row icon="calendar" label="Calendario" value="Días activos" @press="view = 'calendar'" />
      <Row icon="list" label="Historial" value="Todas tus actividades" @press="view = 'history'" />
    </RowGroup>
  </AppScreen>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-4) var(--sp-3);
  margin-top: var(--sp-3);
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}
.stat b {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.stat small {
  font-size: 11px;
  color: var(--muted);
}
</style>
