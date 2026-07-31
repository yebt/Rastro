<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted, ref } from "vue";
import { AppScreen, Card, Label } from "../../shared/ui";
import ActivityDetail from "../history/ActivityDetail.vue";
import ActivityRow from "../history/ActivityRow.vue";
import { $activities, loadActivities } from "../history/history.store";
import { currentStreak, weekSummary } from "../history/summary";
import { distanceParts, formatDuration, type MoveActivity } from "../tracking";

/**
 * Home dashboard: this week's totals, the active-day streak, and recent
 * activities. Tapping one opens its detail. Reloads on mount so it reflects
 * whatever was just recorded (the tab remounts on navigation).
 */
const activities = useStore($activities);
const selectedId = ref<string | null>(null);

onMounted(() => {
  void loadActivities();
});

const moves = computed(() =>
  activities.value.filter((a): a is MoveActivity => a.kind === "move"),
);
const recent = computed(() => moves.value.slice(0, 20));
const selected = computed(() => moves.value.find((a) => a.id === selectedId.value) ?? null);

const summary = computed(() => weekSummary(activities.value, Date.now()));
const streak = computed(() => currentStreak(activities.value, Date.now()));
const weekDist = computed(() => distanceParts(summary.value.distanceM));
const weekTime = computed(() => formatDuration(summary.value.movingMs));
</script>

<template>
  <ActivityDetail v-if="selected" :activity="selected" @back="selectedId = null" />

  <AppScreen v-else title="Inicio">
    <Card>
      <Label>Esta semana</Label>
      <div class="week">
        <div class="wk">
          <b>{{ summary.count }}</b>
          <small>{{ summary.count === 1 ? "actividad" : "actividades" }}</small>
        </div>
        <div class="wk">
          <b>{{ weekDist.value }}</b>
          <small>{{ weekDist.unit }}</small>
        </div>
        <div class="wk">
          <b>{{ weekTime }}</b>
          <small>tiempo</small>
        </div>
      </div>
      <div v-if="streak > 0" class="streak">
        Racha · {{ streak }} {{ streak === 1 ? "día activo" : "días activos" }}
      </div>
    </Card>

    <Label>Recientes</Label>
    <Card>
      <div v-if="recent.length" class="list">
        <ActivityRow
          v-for="a in recent"
          :key="a.id"
          :activity="a"
          @open="selectedId = a.id"
        />
      </div>
      <p v-else class="empty">
        Todavía no registraste nada. Andá a <b>Actividad</b> y arrancá tu primer recorrido.
      </p>
    </Card>
  </AppScreen>
</template>

<style scoped>
.week {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-3);
  margin-top: var(--sp-2);
}
.wk {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}
.wk b {
  font-family: var(--font-mono);
  font-size: 26px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.wk small {
  font-size: 11px;
  color: var(--muted);
}
.streak {
  margin-top: var(--sp-4);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--line);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}
.list {
  display: flex;
  flex-direction: column;
}
.empty {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
</style>
