<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted, ref } from "vue";
import { AppIcon, AppSubScreen, Card } from "../../shared/ui";
import type { MoveActivity } from "../tracking";
import ActivityDetail from "./ActivityDetail.vue";
import ActivityRow from "./ActivityRow.vue";
import { buildMonth } from "./calendar";
import { $activities, loadActivities } from "./history.store";

/** Month calendar of active days; tap a day for its activities. */
defineEmits<{ back: [] }>();

const activities = useStore($activities);

const now = new Date();
const viewYear = ref(now.getFullYear());
const viewMonth = ref(now.getMonth());
const selectedDay = ref<number | null>(null);
const selectedId = ref<string | null>(null);

onMounted(() => {
  void loadActivities();
});

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const monthLabel = computed(() =>
  new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(
    new Date(viewYear.value, viewMonth.value, 1),
  ),
);
const grid = computed(() => buildMonth(viewYear.value, viewMonth.value, activities.value));

const moves = computed(() => activities.value.filter((a): a is MoveActivity => a.kind === "move"));

const isThisMonth = computed(
  () => viewYear.value === now.getFullYear() && viewMonth.value === now.getMonth(),
);
const today = now.getDate();

const dayActivities = computed(() => {
  if (selectedDay.value === null) return [];
  return moves.value.filter((a) => {
    const d = new Date(a.startedAt);
    return (
      d.getFullYear() === viewYear.value &&
      d.getMonth() === viewMonth.value &&
      d.getDate() === selectedDay.value
    );
  });
});

const selected = computed(() => moves.value.find((a) => a.id === selectedId.value) ?? null);

function step(delta: number): void {
  selectedDay.value = null;
  const d = new Date(viewYear.value, viewMonth.value + delta, 1);
  viewYear.value = d.getFullYear();
  viewMonth.value = d.getMonth();
}
</script>

<template>
  <ActivityDetail v-if="selected" :activity="selected" @back="selectedId = null" />

  <AppSubScreen v-else title="Calendario" @back="$emit('back')">
    <Card>
      <header class="cal-head">
        <button type="button" class="nav" aria-label="Mes anterior" @click="step(-1)">
          <AppIcon name="back" size="20px" />
        </button>
        <span class="month">{{ monthLabel }}</span>
        <button type="button" class="nav" aria-label="Mes siguiente" @click="step(1)">
          <AppIcon name="chevron" size="20px" />
        </button>
      </header>

      <div class="weekdays">
        <span v-for="(w, i) in WEEKDAYS" :key="i">{{ w }}</span>
      </div>

      <div class="grid">
        <template v-for="(week, wi) in grid.weeks" :key="wi">
          <template v-for="(cell, ci) in week" :key="ci">
            <span v-if="!cell" class="cell empty" />
            <button
              v-else
              type="button"
              class="cell"
              :class="{
                active: cell.active,
                today: isThisMonth && cell.day === today,
                on: cell.day === selectedDay,
              }"
              :disabled="!cell.active"
              @click="selectedDay = cell.day"
            >
              {{ cell.day }}
            </button>
          </template>
        </template>
      </div>
    </Card>

    <Card v-if="selectedDay !== null">
      <div v-if="dayActivities.length" class="list">
        <ActivityRow
          v-for="a in dayActivities"
          :key="a.id"
          :activity="a"
          @open="selectedId = a.id"
        />
      </div>
      <p v-else class="empty-day">Sin actividades ese día.</p>
    </Card>
  </AppSubScreen>
</template>

<style scoped>
.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}
.nav {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
  color: var(--ink);
}
.nav:active {
  background: var(--surface-2);
}
.month {
  font-family: var(--font-cond);
  font-size: 18px;
  font-weight: 600;
  text-transform: capitalize;
}
.weekdays,
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.weekdays {
  margin: var(--sp-4) 0 var(--sp-2);
}
.weekdays span {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}
.cell {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: var(--r-sm);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}
.cell.active {
  color: var(--ink);
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  font-weight: 600;
}
.cell.today {
  box-shadow: inset 0 0 0 1px var(--line);
}
.cell.on {
  background: var(--accent);
  color: var(--accent-ink);
}
.cell.empty {
  pointer-events: none;
}
.list {
  display: flex;
  flex-direction: column;
}
.empty-day {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
</style>
