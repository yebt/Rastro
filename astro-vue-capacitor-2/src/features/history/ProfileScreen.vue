<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, ref } from "vue";
import { AppScreen, Card, Row, RowGroup } from "../../shared/ui";
import { $name } from "../profile/profile.store";
import { $activities } from "./history.store";
import { cleanTrack, distanceMeters, distanceParts, type MoveActivity } from "../tracking";
import CalendarScreen from "./CalendarScreen.vue";
import HistoryScreen from "./HistoryScreen.vue";

/**
 * Perfil tab — a hub: who you are, lifetime totals (Home already shows the week),
 * and ways into the calendar and the full history.
 */
type View = "menu" | "calendar" | "history";
const view = ref<View>("menu");

const name = useStore($name);
const activities = useStore($activities);

const moves = computed(() => activities.value.filter((a): a is MoveActivity => a.kind === "move"));
const totalDist = computed(() =>
  distanceParts(moves.value.reduce((sum, a) => sum + distanceMeters(cleanTrack(a.points)), 0)),
);
</script>

<template>
  <CalendarScreen v-if="view === 'calendar'" @back="view = 'menu'" />
  <HistoryScreen v-else-if="view === 'history'" @back="view = 'menu'" />

  <AppScreen v-else title="Perfil">
    <Card>
      <div class="identity">
        <span class="badge">{{ (name.trim().charAt(0) || "·").toUpperCase() }}</span>
        <span class="id-text">
          <b v-if="name">{{ name }}</b>
          <b v-else class="id-empty">Sin nombre</b>
          <small>
            {{ moves.length }} {{ moves.length === 1 ? "salida" : "salidas" }} ·
            {{ totalDist.value }} {{ totalDist.unit }} en total
          </small>
        </span>
      </div>
    </Card>

    <RowGroup>
      <Row icon="calendar" label="Calendario" value="Días activos" @press="view = 'calendar'" />
      <Row icon="list" label="Historial" value="Todas tus salidas" @press="view = 'history'" />
    </RowGroup>
  </AppScreen>
</template>

<style scoped>
.identity {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.badge {
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-2);
  display: grid;
  place-items: center;
  font-size: 19px;
  font-weight: 600;
}
.id-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.id-text b {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.id-empty {
  color: var(--muted);
}
.id-text small {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}
</style>
