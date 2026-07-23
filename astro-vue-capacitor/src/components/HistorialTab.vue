<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconDumbbell from '~icons/lucide/dumbbell';
import IconInbox from '~icons/lucide/inbox';
import IconRoute from '~icons/lucide/route';
import { computed, ref } from 'vue';
import { fmtDistance, fmtPace, fmtTime, paceSecPerKm } from '../lib/format';
import { relDate } from '../lib/date';
import { EXERCISE_LABEL, TYPE_COLOR, TYPE_LABEL } from '../lib/labels';
import { type Activity, isExercise } from '../lib/types';
import { $activities, removeActivity } from '../stores/activities';
import { openDetail } from '../stores/ui';

type Filter = 'all' | 'Caminata' | 'Trote' | 'Carrera' | 'exercise';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'Caminata', label: 'Caminatas' },
  { key: 'Trote', label: 'Trotes' },
  { key: 'Carrera', label: 'Carreras' },
  { key: 'exercise', label: 'Ejercicios' },
];

/** Exercise sessions use their own color; the former dominadas swatch. */
const EXERCISE_COLOR = '#15181A';

defineProps<{ active: boolean }>();

const activities = useStore($activities);
const filter = ref<Filter>('all');

const items = computed(() => {
  const sorted = activities.value.toSorted((a, b) => b.date - a.date);
  if (filter.value === 'all') return sorted;
  return sorted.filter((a) =>
    filter.value === 'exercise' ? isExercise(a) : a.type === filter.value,
  );
});

function itemTitle(a: Activity): string {
  return isExercise(a) ? EXERCISE_LABEL[a.exercise] : (TYPE_LABEL[a.type] ?? '');
}

function itemColor(a: Activity): string {
  return isExercise(a) ? EXERCISE_COLOR : (TYPE_COLOR[a.type] ?? EXERCISE_COLOR);
}

function bestSet(a: Activity): number {
  return isExercise(a) ? Math.max(0, ...a.sets) : 0;
}

async function confirmDelete(id: string): Promise<void> {
  if (globalThis.confirm('¿Eliminar esta actividad?')) await removeActivity(id);
}
</script>

<template>
  <section class="screen" :class="{ active }">
    <div class="filterbar">
      <button
        v-for="f in FILTERS"
        :key="f.key"
        class="fchip"
        :class="{ on: filter === f.key }"
        @click="filter = f.key"
      >
        {{ f.label }}
      </button>
    </div>

    <div v-if="!items.length" class="empty">
      <IconInbox />
      <p>Todavía no hay nada acá.<br />Registrá una salida o una sesión de ejercicios.</p>
    </div>

    <div v-else>
      <div
        v-for="a in items"
        :key="a.id"
        class="actitem"
        role="button"
        tabindex="0"
        @click="openDetail(a.id)"
      >
        <div class="head">
          <div class="badge" :style="{ background: itemColor(a) }">
            <IconDumbbell v-if="a.kind === 'exercise'" />
            <IconRoute v-else />
          </div>
          <div>
            <div class="ttl">{{ itemTitle(a) }}</div>
            <div class="date">{{ relDate(a.date) }}</div>
          </div>
          <button class="del" @click.stop="confirmDelete(a.id)">Eliminar</button>
        </div>

        <div v-if="a.kind === 'exercise'" class="mets">
          <div><div class="k">Total</div><div class="v num">{{ a.total }}</div></div>
          <div><div class="k">Series</div><div class="v num">{{ a.sets.length }}</div></div>
          <div><div class="k">Mejor serie</div><div class="v num">{{ bestSet(a) }}</div></div>
        </div>
        <div v-else class="mets">
          <div><div class="k">Distancia</div><div class="v num">{{ fmtDistance(a.distance).value }}<small> {{ fmtDistance(a.distance).unit }}</small></div></div>
          <div><div class="k">Tiempo</div><div class="v num">{{ fmtTime(a.duration) }}</div></div>
          <div><div class="k">Ritmo</div><div class="v num">{{ fmtPace(paceSecPerKm(a.distance, a.duration)) }}<small> /km</small></div></div>
        </div>
      </div>
    </div>
  </section>
</template>
