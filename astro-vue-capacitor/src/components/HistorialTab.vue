<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconDumbbell from '~icons/lucide/dumbbell';
import IconInbox from '~icons/lucide/inbox';
import IconRoute from '~icons/lucide/route';
import { computed, ref } from 'vue';
import { fmtPace, fmtTime, paceSecPerKm } from '../lib/format';
import { relDate } from '../lib/date';
import { TYPE_COLOR, TYPE_LABEL } from '../lib/labels';
import { isDominadas, type Activity } from '../lib/types';
import { $activities, removeActivity } from '../stores/activities';

type Filter = 'all' | 'Caminata' | 'Trote' | 'Carrera' | 'dominadas';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'Caminata', label: 'Caminatas' },
  { key: 'Trote', label: 'Trotes' },
  { key: 'Carrera', label: 'Carreras' },
  { key: 'dominadas', label: 'Dominadas' },
];

defineProps<{ active: boolean }>();

const activities = useStore($activities);
const filter = ref<Filter>('all');

const items = computed(() => {
  const sorted = activities.value.toSorted((a, b) => b.date - a.date);
  if (filter.value === 'all') return sorted;
  return sorted.filter((a) =>
    filter.value === 'dominadas' ? a.kind === 'dominadas' : a.type === filter.value,
  );
});

function bestSet(a: Activity): number {
  return isDominadas(a) ? Math.max(0, ...a.sets) : 0;
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
      <p>Todavía no hay nada acá.<br />Registrá una salida o una sesión de dominadas.</p>
    </div>

    <div v-else>
      <div v-for="a in items" :key="a.id" class="actitem">
        <div class="head">
          <div class="badge" :style="{ background: TYPE_COLOR[a.type] || '#15181A' }">
            <IconDumbbell v-if="a.kind === 'dominadas'" />
            <IconRoute v-else />
          </div>
          <div>
            <div class="ttl">{{ TYPE_LABEL[a.type] }}</div>
            <div class="date">{{ relDate(a.date) }}</div>
          </div>
          <button class="del" @click="confirmDelete(a.id)">Eliminar</button>
        </div>

        <div v-if="a.kind === 'dominadas'" class="mets">
          <div><div class="k">Total</div><div class="v num">{{ a.total }}</div></div>
          <div><div class="k">Series</div><div class="v num">{{ a.sets.length }}</div></div>
          <div><div class="k">Mejor serie</div><div class="v num">{{ bestSet(a) }}</div></div>
        </div>
        <div v-else class="mets">
          <div><div class="k">Distancia</div><div class="v num">{{ (a.distance / 1000).toFixed(2) }}<small> km</small></div></div>
          <div><div class="k">Tiempo</div><div class="v num">{{ fmtTime(a.duration) }}</div></div>
          <div><div class="k">Ritmo</div><div class="v num">{{ fmtPace(paceSecPerKm(a.distance, a.duration)) }}<small> /km</small></div></div>
        </div>
      </div>
    </div>
  </section>
</template>
