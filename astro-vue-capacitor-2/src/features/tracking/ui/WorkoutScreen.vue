<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { ref, watch } from "vue";
import { recorder } from "../../recording";
import { $startIntent, clearStartIntent, newRoutine, type Routine } from "../../tracking";
import type { MoveType } from "../domain/activity";
import CatalogEditor from "./CatalogEditor.vue";
import ExerciseLive from "./ExerciseLive.vue";
import MoveReview from "./MoveReview.vue";
import ReadyMove from "./ReadyMove.vue";
import RoutineBuilder from "./RoutineBuilder.vue";
import RoutinePlayer from "./RoutinePlayer.vue";
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
const routineDraft = ref<Routine | null>(null);
const runningRoutine = ref<Routine | null>(null);
const editingCatalog = ref(false);

function onSelect(type: MoveType): void {
  pending.value = type;
}

// Home's quick-start hands us a type; land on the Ready screen for it.
const startIntent = useStore($startIntent);
watch(
  startIntent,
  (type) => {
    if (type && status.value === "idle") {
      pending.value = type;
      clearStartIntent();
    }
  },
  { immediate: true },
);
function onExercise(id: string): void {
  exerciseId.value = id;
}
function onNewRoutine(): void {
  routineDraft.value = newRoutine();
}
function onEditRoutine(r: Routine): void {
  routineDraft.value = r;
}
function onRunRoutine(r: Routine): void {
  runningRoutine.value = r;
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
  <RoutinePlayer
    v-else-if="status === 'idle' && runningRoutine"
    :routine="runningRoutine"
    @done="runningRoutine = null"
  />
  <RoutineBuilder
    v-else-if="status === 'idle' && routineDraft"
    :routine="routineDraft"
    @done="routineDraft = null"
  />
  <CatalogEditor
    v-else-if="status === 'idle' && editingCatalog"
    @back="editingCatalog = false"
  />
  <ReadyMove
    v-else-if="status === 'idle' && pending"
    :type="pending"
    @start="onStart"
    @cancel="onCancel"
  />
  <StartMove
    v-else-if="status === 'idle'"
    @select="onSelect"
    @exercise="onExercise"
    @run-routine="onRunRoutine"
    @edit-routine="onEditRoutine"
    @new-routine="onNewRoutine"
    @edit-catalog="editingCatalog = true"
  />
  <MoveReview v-else-if="status === 'finished'" />
  <!-- recording / paused: the global LiveMove overlay (in AppRoot) covers the screen -->

</template>
