<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconChevron from '~icons/lucide/chevron-right';
import IconDumbbell from '~icons/lucide/dumbbell';
import IconFlame from '~icons/lucide/flame';
import IconPlay from '~icons/lucide/play';
import { computed } from 'vue';
import { dayKey, fmtDayHeader, relDate } from '../lib/date';
import { fmtPace, fmtTime, paceSecPerKm } from '../lib/format';
import { EXERCISE_LABEL, TYPE_LABEL } from '../lib/labels';
import { currentStreak, lastNDays } from '../lib/streak';
import { computeRecords, weekStart } from '../lib/trends';
import { type Activity, type RouteTuple, isGps } from '../lib/types';
import { $activities } from '../stores/activities';
import { $name } from '../stores/settings';
import { openDetail, setTab } from '../stores/ui';

defineProps<{ active: boolean }>();

const activities = useStore($activities);
const name = useStore($name);

const nowMs = Date.now();
const headerDate = fmtDayHeader(nowMs);

const greeting = computed(() => {
  const h = new Date(nowMs).getHours();
  const base = h < 12 ? 'Buen día' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  return name.value ? `${base}, ${name.value}` : base;
});

const hasAny = computed(() => activities.value.length > 0);

// ---- This week ----
const wkStart = weekStart(nowMs);
const weekGps = computed(() => activities.value.filter((a) => isGps(a) && weekStart(a.date) === wkStart));
const weekKm = computed(() => weekGps.value.reduce((s, a) => s + a.distance / 1000, 0));
const weekMeters = computed(() => weekGps.value.reduce((s, a) => s + a.distance, 0));
const weekSeconds = computed(() => weekGps.value.reduce((s, a) => s + a.duration, 0));
const salidas = computed(() => weekGps.value.length);
const avgPaceText = computed(() =>
  weekMeters.value > 0 ? fmtPace(paceSecPerKm(weekMeters.value, weekSeconds.value)) : '—',
);
const weekTimeText = computed(() => fmtTime(weekSeconds.value));
const streak = computed(() => currentStreak(activities.value, nowMs));

// ---- 7-day strip + sparkline ----
const WEEK_INITIAL = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
function kmForDay(ms: number): number {
  const key = dayKey(ms);
  return activities.value
    .filter((a) => isGps(a) && dayKey(a.date) === key)
    .reduce((s, a) => s + (a as { distance: number }).distance / 1000, 0);
}
const week = computed(() =>
  lastNDays(activities.value, 7, nowMs).map((d) => ({
    ...d,
    km: kmForDay(d.date),
    letter: WEEK_INITIAL[new Date(d.date).getDay()],
    isToday: dayKey(d.date) === dayKey(nowMs),
  })),
);
const maxKm = computed(() => Math.max(0.001, ...week.value.map((d) => d.km)));
const barHeight = (km: number): string => `${Math.round((km / maxKm.value) * 100)}%`;

// ---- All-time totals + records ----
const totalKm = computed(() =>
  activities.value.reduce((s, a) => (isGps(a) ? s + a.distance / 1000 : s), 0),
);
const records = computed(() => computeRecords(activities.value));

// ---- Last activity ----
const last = computed<Activity | null>(() =>
  activities.value.length ? activities.value.toSorted((a, b) => b.date - a.date)[0]! : null,
);
const lastGps = computed(() => (last.value && isGps(last.value) ? last.value : null));
const lastTitle = computed(() => {
  const a = last.value;
  if (!a) return '';
  return isGps(a) ? (TYPE_LABEL[a.type] ?? '') : EXERCISE_LABEL[a.exercise];
});
const lastMeta = computed(() => {
  const a = last.value;
  if (!a) return '';
  const when = relDate(a.date, nowMs);
  if (isGps(a)) {
    return `${when} · ${(a.distance / 1000).toFixed(2)} km · ${fmtTime(a.duration)}`;
  }
  return `${when} · ${a.total} reps`;
});

/** Normalized SVG points for a route thumbnail (thin polyline), or '' if too short. */
function routePoints(route: RouteTuple[]): string {
  if (route.length < 2) return '';
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [la, ln] of route) {
    minLat = Math.min(minLat, la);
    maxLat = Math.max(maxLat, la);
    minLng = Math.min(minLng, ln);
    maxLng = Math.max(maxLng, ln);
  }
  const w = maxLng - minLng || 1;
  const h = maxLat - minLat || 1;
  const size = 44;
  const pad = 6;
  const scale = Math.min((size - pad * 2) / w, (size - pad * 2) / h);
  const ox = (size - w * scale) / 2;
  const oy = (size - h * scale) / 2;
  return route
    .map(([la, ln]) => {
      const x = ox + (ln - minLng) * scale;
      const y = size - (oy + (la - minLat) * scale);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
const lastThumb = computed(() => (lastGps.value ? routePoints(lastGps.value.route) : ''));

function openLast(): void {
  if (last.value) openDetail(last.value.id);
}
</script>

<template>
  <section class="screen home" :class="{ active }">
    <header class="hhead">
      <div class="lbl">{{ headerDate }}</div>
      <h1 class="greet">{{ greeting }}</h1>
    </header>

    <!-- Designed empty state -->
    <div v-if="!hasAny" class="home-empty">
      <p>Todavía no registraste nada. Tu primer rastro empieza con un paso.</p>
      <button type="button" class="cta" @click="setTab('workout')">
        <IconPlay /> Empezar actividad
      </button>
    </div>

    <template v-else>
      <!-- Hero: this week -->
      <section class="hero">
        <div class="hero-top">
          <div class="lbl">Esta semana</div>
          <div v-if="streak > 0" class="racha">
            <IconFlame /> Racha <span class="num">{{ streak }}</span>
          </div>
        </div>
        <div class="hero-big">
          <span class="num">{{ weekKm.toFixed(1) }}</span><span class="unit">km</span>
        </div>
        <div class="hero-sub">
          <span><span class="num">{{ salidas }}</span> salidas</span>
          <span class="dot">·</span>
          <span><span class="num">{{ avgPaceText }}</span> /km</span>
          <span class="dot">·</span>
          <span><span class="num">{{ weekTimeText }}</span></span>
        </div>
        <div class="spark" role="img" aria-label="Distancia de los últimos 7 días">
          <div
            v-for="(d, i) in week"
            :key="i"
            class="spark-bar"
            :class="{ end: d.isToday, zero: d.km === 0 }"
            :style="{ height: barHeight(d.km) }"
          />
        </div>
      </section>

      <button type="button" class="cta" @click="setTab('workout')">
        <IconPlay /> Empezar actividad
      </button>

      <!-- Stat columns -->
      <div class="statcols totals">
        <div class="statcol">
          <div class="lbl">Total</div>
          <div class="val">{{ totalKm.toFixed(0) }}<small> km</small></div>
        </div>
        <div class="statcol">
          <div class="lbl">Mejor 5K</div>
          <div class="val">{{ records.fastest5k ? fmtTime(records.fastest5k) : '—' }}</div>
        </div>
        <div class="statcol">
          <div class="lbl">Mejor ritmo</div>
          <div class="val">{{ records.fastest1k ? fmtPace(records.fastest1k) : '—' }}</div>
        </div>
      </div>

      <!-- Week strip -->
      <div class="strip">
        <div v-for="(d, i) in week" :key="i" class="strip-day">
          <span
            class="mark"
            :class="{
              gps: d.active && d.type === 'gps',
              ex: d.active && d.type === 'exercise',
              today: d.isToday,
            }"
          />
          <span class="strip-l">{{ d.letter }}</span>
        </div>
      </div>

      <!-- Last activity -->
      <div class="lbl last-h">Última actividad</div>
      <button v-if="last" type="button" class="last" @click="openLast">
        <span class="thumb">
          <svg v-if="lastThumb" class="thumbsvg" viewBox="0 0 44 44" aria-hidden="true">
            <polyline
              :points="lastThumb"
              fill="none"
              stroke="var(--ink)"
              stroke-width="1.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
          <IconDumbbell v-else />
        </span>
        <span class="last-body">
          <span class="last-ttl">{{ lastTitle }}</span>
          <span class="last-meta num">{{ lastMeta }}</span>
        </span>
        <IconChevron class="last-chev" />
      </button>
    </template>
  </section>
</template>

<style scoped>
.home {
  padding-top: 8px;
}
.hhead {
  margin-bottom: 22px;
}
.greet {
  margin: 8px 0 0;
  font-family: var(--cond);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.05;
  text-wrap: balance;
}
.home-empty {
  padding: 12px 0;
}
.home-empty p {
  font-size: 15px;
  line-height: 1.55;
  color: var(--muted);
  max-width: 30ch;
  margin: 0 0 20px;
}

/* Hero */
.hero {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
}
.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.racha {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}
.racha svg {
  width: 14px;
  height: 14px;
}
.hero-big {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 2px;
}
.hero-big .num {
  font-size: 76px;
  font-weight: 700;
  line-height: 0.85;
}
.hero-big .unit {
  font-family: var(--cond);
  font-size: 22px;
  font-weight: 600;
  color: var(--muted);
}
.hero-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 13.5px;
  color: var(--muted);
}
.hero-sub .num {
  color: var(--ink);
  font-size: 15px;
}
.hero-sub .dot {
  opacity: 0.5;
}

/* Sparkline (endpoint = today, emphasized in accent) */
.spark {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 46px;
  margin-top: 16px;
}
.spark-bar {
  flex: 1;
  min-height: 3px;
  border-radius: 2px;
  background: var(--soft);
}
.spark-bar:not(.zero) {
  background: var(--muted);
  opacity: 0.55;
}
.spark-bar.end:not(.zero) {
  background: var(--accent);
  opacity: 1;
}

/* Totals */
.totals {
  margin: 22px 0 24px;
}

/* Week strip */
.strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.strip-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}
.mark {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--line);
}
.mark.gps {
  background: var(--muted);
  border-color: var(--muted);
}
.mark.ex {
  background: var(--accent);
  border-color: var(--accent);
}
.mark.today {
  box-shadow: 0 0 0 1.5px var(--accent);
  border-color: var(--accent);
}
.strip-l {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

/* Last activity */
.last-h {
  margin: 26px 0 10px;
}
.last {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 2px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  text-align: left;
}
.thumb {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: var(--r-1);
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.thumb .thumbsvg {
  width: 44px;
  height: 44px;
}
.thumb :deep(svg) {
  width: 22px;
  height: 22px;
  color: var(--muted);
}
.last-body {
  flex: 1;
  min-width: 0;
}
.last-ttl {
  display: block;
  font-weight: 600;
  font-size: 15px;
}
.last-meta {
  display: block;
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}
.last-chev {
  width: 18px;
  height: 18px;
  color: var(--muted);
  flex: none;
}
</style>
