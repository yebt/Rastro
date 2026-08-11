<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed } from "vue";
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
import { GalleryScreen } from "../share";
import { useBackHandler } from "../shell/useBackHandler";
import AnalyticsScreen from "./AnalyticsScreen.vue";
import CalendarScreen from "./CalendarScreen.vue";
import HistoryScreen from "./HistoryScreen.vue";
import ProgressScreen from "./ProgressScreen.vue";
import { $activities } from "./history.store";
import { $infoView, setInfoView } from "./info-view.store";
import { currentStreak } from "./summary";

/** Info tab — lifetime data plus progress, calendar, history and shared cards.
 *  The sub-view is a store so Home can jump straight to History. */
const view = useStore($infoView);

// Back from a sub-view returns to the menu (not straight Home).
useBackHandler(
  computed(() => view.value !== "menu"),
  () => setInfoView("menu"),
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
  <AnalyticsScreen v-if="view === 'analytics'" @back="setInfoView('menu')" />
  <ProgressScreen v-else-if="view === 'progress'" @back="setInfoView('menu')" />
  <CalendarScreen v-else-if="view === 'calendar'" @back="setInfoView('menu')" />
  <HistoryScreen v-else-if="view === 'history'" @back="setInfoView('menu')" />
  <GalleryScreen v-else-if="view === 'shared'" @back="setInfoView('menu')" />

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
      <Row icon="data" label="Analíticas" value="Tu resumen completo" @press="setInfoView('analytics')" />
      <Row icon="workout" label="Progreso" value="Tendencias por tipo" @press="setInfoView('progress')" />
      <Row icon="calendar" label="Calendario" value="Días activos" @press="setInfoView('calendar')" />
      <Row icon="list" label="Historial" value="Todas tus actividades" @press="setInfoView('history')" />
      <Row icon="palette" label="Compartidos" value="Tarjetas guardadas" @press="setInfoView('shared')" />
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
  min-width: 0; /* let wide values (e.g. long times) shrink, not break the grid */
}
.stat b {
  max-width: 100%;
  font-family: var(--font-mono);
  /* Scale down for wide values like "12:34:56" so the cell never overflows. */
  font-size: clamp(15px, 5.2vw, 24px);
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
</style>
