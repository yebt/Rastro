<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconUser from '~icons/lucide/user';
import { computed } from 'vue';
import { fmtDistance, fmtPace, fmtTime } from '../lib/format';
import { activeDaysInMonth, type DayType } from '../lib/streak';
import { computeRecords } from '../lib/trends';
import { isGps } from '../lib/types';
import { $activities } from '../stores/activities';
import { $name } from '../stores/settings';
import HistorialTab from './HistorialTab.vue';

const props = defineProps<{ active: boolean }>();

const activities = useStore($activities);
const name = useStore($name);

const initial = computed(() => name.value.trim().charAt(0).toUpperCase());

const totalKm = computed(() =>
  activities.value.reduce((sum, a) => (isGps(a) ? sum + a.distance / 1000 : sum), 0),
);
const count = computed(() => activities.value.length);
const records = computed(() => computeRecords(activities.value));
const longest = computed(() =>
  records.value.longestRun ? fmtDistance(records.value.longestRun) : null,
);

// Current-month calendar grid (Monday-first) with per-day activity marks.
const WEEK_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Cell {
  day: number | null;
  type: DayType | null;
  today: boolean;
}

const now = new Date();
const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

const calendar = computed<Cell[]>(() => {
  const year = now.getFullYear();
  const month = now.getMonth();
  const marks = activeDaysInMonth(activities.value, year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const todayNum = now.getDate();

  const cells: Cell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, type: null, today: false });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, type: marks.get(d) ?? null, today: d === todayNum });
  }
  return cells;
});
</script>

<template>
  <section class="screen profile" :class="{ active: props.active }">
    <header class="phead">
      <div class="mono-avatar">
        <span v-if="initial">{{ initial }}</span>
        <IconUser v-else />
      </div>
      <div class="pmeta">
        <div class="pname">{{ name || 'Tu perfil' }}</div>
        <div class="lbl psub">
          <span class="num">{{ totalKm.toFixed(1) }}</span> KM ·
          <span class="num">{{ count }}</span> ACTIVIDADES
        </div>
      </div>
    </header>

    <div class="lbl calh">{{ monthLabel }}</div>
    <div class="cal">
      <div v-for="w in WEEK_LABELS" :key="w" class="cal-w">{{ w }}</div>
      <div
        v-for="(c, i) in calendar"
        :key="i"
        class="cal-d"
        :class="{ today: c.today, gps: c.type === 'gps', ex: c.type === 'exercise' }"
      >
        <span v-if="c.day" class="num">{{ c.day }}</span>
      </div>
    </div>

    <div class="lbl calh">Récords</div>
    <div class="statcols recs">
      <div class="statcol">
        <div class="lbl">Mejor 5K</div>
        <div class="val">{{ records.fastest5k ? fmtTime(records.fastest5k) : '—' }}</div>
      </div>
      <div class="statcol">
        <div class="lbl">Mejor ritmo</div>
        <div class="val">{{ records.fastest1k ? fmtPace(records.fastest1k) : '—' }}</div>
      </div>
      <div class="statcol">
        <div class="lbl">Más larga</div>
        <div class="val">{{ longest ? longest.value : '—' }}<small v-if="longest"> {{ longest.unit }}</small></div>
      </div>
    </div>

    <div class="lbl calh">Historial</div>
    <HistorialTab :active="props.active" />
  </section>
</template>

<style scoped>
.profile :deep(.screen) {
  padding: 0;
  animation: none;
}
.phead {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0 6px;
}
.mono-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  flex: none;
  font-family: var(--cond);
  font-weight: 700;
  font-size: 26px;
  color: var(--ink);
}
.mono-avatar svg {
  width: 24px;
  height: 24px;
  color: var(--muted);
}
.pmeta {
  min-width: 0;
}
.pname {
  font-family: var(--cond);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1;
}
.psub {
  margin: 6px 0 0;
}
.calh {
  margin: 22px 0 10px;
}
.cal {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-w {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--muted);
  text-align: center;
  padding-bottom: 2px;
}
.cal-d {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: var(--muted);
  border-radius: var(--r-1);
}
.cal-d.gps {
  color: var(--ink);
  background: var(--soft);
}
.cal-d.ex {
  color: var(--accent-contrast);
  background: var(--accent);
}
.cal-d.today {
  box-shadow: inset 0 0 0 1.5px var(--accent);
  color: var(--ink);
}
.cal-d.today.ex {
  color: var(--accent-contrast);
}
.recs {
  margin-bottom: 4px;
}
</style>
