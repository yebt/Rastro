<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { ref } from "vue";
import { recorder } from "../../recording";
import type { MoveType } from "../domain/activity";
import ExerciseLive from "./ExerciseLive.vue";
import MoveReview from "./MoveReview.vue";
import ReadyMove from "./ReadyMove.vue";
import StartMove from "./StartMove.vue";

/**
 * The Actividad tab. Renders by the recorder's status, not local state, so an
 * in-progress recording is shown no matter how the user navigated here — the
 * recorder lives above any screen and survives tab switches.
 *
 * `pending` is the one bit of local state: an activity chosen but not yet
 * started, so the clock only begins when the user taps Iniciar.
 */
const status = useStore(recorder.$status);
const pending = ref<MoveType | null>(null);
const exerciseId = ref<string | null>(null);

function onSelect(type: MoveType): void {
  pending.value = type;
}
function onExercise(id: string): void {
  exerciseId.value = id;
}

function onStart(): void {
  if (pending.value === null) return;
  void recorder.start(pending.value);
  pending.value = null;
}

function onCancel(): void {
  pending.value = null;
}
</script>

<template>
  <ExerciseLive
    v-if="status === 'idle' && exerciseId"
    :exercise-id="exerciseId"
    @done="exerciseId = null"
  />
  <ReadyMove
    v-else-if="status === 'idle' && pending"
    :type="pending"
    @start="onStart"
    @cancel="onCancel"
  />
  <StartMove v-else-if="status === 'idle'" @select="onSelect" @exercise="onExercise" />
  <MoveReview v-else-if="status === 'finished'" />
  <!-- recording / paused: the global LiveMove overlay (in AppRoot) covers the screen -->

</template>
