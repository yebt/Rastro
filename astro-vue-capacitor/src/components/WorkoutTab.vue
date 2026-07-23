<script setup lang="ts">
import { ref } from 'vue';
import ExercisesTab from './ExercisesTab.vue';
import TrackerTab from './TrackerTab.vue';

const props = defineProps<{ active: boolean }>();

type Mode = 'move' | 'exercise';
const mode = ref<Mode>('move');

// Both children stay mounted so the live tracker (map + running session) keeps
// its state while the user peeks at exercises; we only toggle visibility.
</script>

<template>
  <div v-show="props.active" class="workout">
    <div class="seg">
      <button :class="{ on: mode === 'move' }" @click="mode = 'move'">Moverme</button>
      <button :class="{ on: mode === 'exercise' }" @click="mode = 'exercise'">Ejercicios</button>
    </div>

    <TrackerTab :active="props.active && mode === 'move'" />
    <ExercisesTab :active="props.active && mode === 'exercise'" />
  </div>
</template>

<style scoped>
.workout {
  padding: 4px 16px 0;
}
.workout .seg {
  margin: 4px 0 0;
}
/* The child screens bring their own horizontal padding via .screen. */
.workout :deep(.screen) {
  padding-left: 0;
  padding-right: 0;
}
</style>
