<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { EXERCISE_LABEL } from '../lib/labels';
import type { ExerciseKind } from '../lib/types';
import {
  $curExercise,
  $curSets,
  $exerciseStats,
  $repCount,
  $sessTotal,
  addSet,
  decRep,
  incRep,
  removeSet,
  saveSession,
  setExercise,
} from '../stores/session';

defineProps<{ active: boolean }>();

const EXERCISES: ExerciseKind[] = ['dominadas', 'burpees', 'abdominales', 'flexiones'];

const stats = useStore($exerciseStats);
const rep = useStore($repCount);
const sets = useStore($curSets);
const sessTotal = useStore($sessTotal);
const exercise = useStore($curExercise);
</script>

<template>
  <section class="screen" :class="{ active }">
    <div class="filterbar">
      <button
        v-for="ex in EXERCISES"
        :key="ex"
        class="fchip"
        :class="{ on: exercise === ex }"
        @click="setExercise(ex)"
      >
        {{ EXERCISE_LABEL[ex] }}
      </button>
    </div>

    <div class="totcard">
      <svg class="topo" viewBox="0 0 400 200" preserveAspectRatio="none" fill="none" stroke="#3a3f38" stroke-width="1.5">
        <path d="M-10 60 Q100 20 200 60 T410 60" /><path d="M-10 100 Q100 60 200 100 T410 100" />
        <path d="M-10 140 Q100 100 200 140 T410 140" /><path d="M-10 180 Q100 140 200 180 T410 180" />
      </svg>
      <div class="k">Total histórico · {{ EXERCISE_LABEL[exercise] }}</div>
      <div class="v num">{{ stats.all }}<span class="u">reps</span></div>
      <div class="row">
        <div><div class="k">Hoy</div><div class="m num">{{ stats.today }}<span class="u"> reps</span></div></div>
        <div><div class="k">Mejor sesión</div><div class="m num">{{ stats.best }}<span class="u"> reps</span></div></div>
        <div><div class="k">Mejor serie</div><div class="m num">{{ stats.bestSet }}<span class="u"> reps</span></div></div>
      </div>
    </div>

    <div class="card">
      <h3>Nueva sesión · {{ EXERCISE_LABEL[exercise] }}</h3>
      <div class="stepper">
        <button aria-label="Restar" @click="decRep">−</button>
        <div class="count num">{{ rep }}<small>reps / serie</small></div>
        <button aria-label="Sumar" @click="incRep">+</button>
      </div>
      <button class="btn btn-go wide" @click="addSet">Agregar serie</button>

      <template v-if="sets.length">
        <div class="section-h">Series de esta sesión</div>
        <div class="sets">
          <div v-for="(reps, i) in sets" :key="i" class="chip">
            <span class="s">S{{ i + 1 }}</span>
            <span class="n num">{{ reps }}</span>
            <button aria-label="quitar" @click="removeSet(i)">×</button>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 13px; color: var(--muted)">
          Total de la sesión:
          <b class="num" style="color: var(--ink); font-size: 16px">{{ sessTotal }}</b> reps
        </div>
        <button
          class="btn btn-stop wide"
          style="margin-top: 12px; background: var(--accent); color: var(--accent-contrast)"
          @click="saveSession"
        >
          Guardar sesión
        </button>
      </template>
    </div>
  </section>
</template>
