<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { onUnmounted, ref, watch } from "vue";
import { recorder } from "../../recording";
import { $countdown, $startIntent, clearStartIntent, newRoutine, type Routine } from "../../tracking";
import type { MoveType } from "../domain/activity";
import CatalogEditor from "./CatalogEditor.vue";
import ExerciseLive from "./ExerciseLive.vue";
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

// Optional pre-start countdown (Registro › Cuenta atrás).
const countdownLeft = ref(0);
let cdTimer: ReturnType<typeof setInterval> | null = null;
let cdType: MoveType | null = null;

function stopCountdown(): void {
  if (cdTimer) {
    clearInterval(cdTimer);
    cdTimer = null;
  }
  countdownLeft.value = 0;
}
function cancelCountdown(): void {
  stopCountdown();
  cdType = null;
}
onUnmounted(stopCountdown);

function onStart(): void {
  if (pending.value === null) return;
  const type = pending.value;
  pending.value = null;
  const secs = $countdown.get();
  if (secs <= 0) {
    void recorder.start(type);
    return;
  }
  cdType = type;
  countdownLeft.value = secs;
  cdTimer = setInterval(() => {
    countdownLeft.value -= 1;
    if (countdownLeft.value <= 0) {
      stopCountdown();
      if (cdType) void recorder.start(cdType);
      cdType = null;
    }
  }, 1000);
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
  <!-- recording / paused: the global LiveMove overlay (in AppRoot) covers the screen.
       finished: AppRoot opens the saved activity's detail and resets to idle. -->

  <div v-if="countdownLeft > 0" class="countdown" @click="cancelCountdown">
    <b>{{ countdownLeft }}</b>
    <span>tocá para cancelar</span>
  </div>
</template>

<style scoped>
.countdown {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  background: var(--bg);
}
.countdown b {
  font-family: var(--font-mono);
  font-size: 160px;
  font-weight: 600;
  line-height: 1;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.countdown span {
  font-size: 14px;
  color: var(--muted);
}
</style>
