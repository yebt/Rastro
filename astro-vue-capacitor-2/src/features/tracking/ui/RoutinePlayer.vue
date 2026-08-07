<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { AppButton, AppIcon, AppSubScreen, Card } from "../../../shared/ui";
import {
  activityRepository,
  buildRun,
  entriesFrom,
  exercisesDone,
  exerciseLabel,
  exerciseStepCount,
  routineActivity,
  type Routine,
  type RunStep,
} from "../../tracking";
import { formatDuration } from "./format";

/**
 * Guided run of a routine. Exercise steps are self-paced (advance on "Hecho");
 * rest steps run a live countdown that can be paused, skipped or extended.
 * Restarting asks for confirmation. Finishing emits `done` (persisting the
 * session as an activity is a later phase).
 */
const props = defineProps<{ routine: Routine }>();
const emit = defineEmits<{ done: [] }>();

const steps = ref<RunStep[]>(buildRun(props.routine));
const index = ref(0);
const remaining = ref(0); // seconds left on the current rest
const paused = ref(false);
const startedAt = Date.now();
const saving = ref(false);

const totalExercises = exerciseStepCount(steps.value);
const current = computed<RunStep | null>(() => steps.value[index.value] ?? null);
const finished = computed(() => index.value >= steps.value.length);
const doneCount = computed(() => exercisesDone(steps.value, index.value));

let timer: ReturnType<typeof setInterval> | null = null;
function stopTimer(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
function tick(): void {
  if (paused.value) return;
  remaining.value -= 1;
  if (remaining.value <= 0) {
    stopTimer();
    next();
  }
}

// Whenever we land on a rest step, seed and run its countdown.
watch(
  [current, () => steps.value],
  () => {
    stopTimer();
    const step = current.value;
    if (step?.kind === "rest") {
      remaining.value = step.seconds;
      timer = setInterval(tick, 1000);
    }
  },
  { immediate: true },
);
onUnmounted(stopTimer);

function next(): void {
  if (index.value < steps.value.length) index.value += 1;
}
function togglePause(): void {
  paused.value = !paused.value;
}
function addTime(sec: number): void {
  remaining.value += sec;
}
function skipRest(): void {
  stopTimer();
  next();
}
function restart(): void {
  if (!globalThis.confirm("¿Reiniciar la rutina desde el principio?")) return;
  stopTimer();
  paused.value = false;
  remaining.value = 0;
  index.value = 0;
}

/** Persist the completed run as an activity, then close. */
async function saveAndFinish(): Promise<void> {
  saving.value = true;
  try {
    const entries = entriesFrom(steps.value);
    if (entries.length > 0) {
      const activity = routineActivity(props.routine, entries, startedAt, Date.now());
      await activityRepository().save(activity);
    }
    emit("done");
  } finally {
    saving.value = false;
  }
}

const restLabel = computed(() =>
  current.value?.kind === "rest" && current.value.scope === "round"
    ? "Descanso entre vueltas"
    : "Descanso",
);
</script>

<template>
  <AppSubScreen :title="routine.name || 'Rutina'" @back="emit('done')">
    <!-- Progress -->
    <div class="progress">
      <div class="bar"><span :style="{ width: `${(doneCount / totalExercises) * 100}%` }"></span></div>
      <span class="pnum">{{ doneCount }}/{{ totalExercises }}</span>
    </div>

    <!-- Finished -->
    <template v-if="finished">
      <Card class="stage done">
        <AppIcon name="check" size="40px" />
        <b>¡Rutina completa!</b>
        <small>{{ routine.rounds }} vueltas · {{ totalExercises }} ejercicios</small>
      </Card>
      <div class="actions">
        <AppButton size="lg" block variant="ghost" :disabled="saving" @press="restart">Repetir</AppButton>
        <AppButton size="lg" block :disabled="saving" @press="saveAndFinish">Guardar</AppButton>
      </div>
    </template>

    <!-- Exercise step -->
    <template v-else-if="current?.kind === 'exercise'">
      <Card class="stage">
        <span class="round">Vuelta {{ current.round }}/{{ current.rounds }} · {{ current.position }}/{{ current.perRound }}</span>
        <b class="ex">{{ exerciseLabel(current.exerciseId) }}</b>
        <span class="reps">{{ current.reps }}<small>reps</small></span>
      </Card>
      <AppButton size="lg" block icon="check" @press="next">Hecho</AppButton>
    </template>

    <!-- Rest step -->
    <template v-else-if="current?.kind === 'rest'">
      <Card class="stage rest" :class="{ paused }">
        <span class="round">{{ restLabel }}</span>
        <b class="clock">{{ formatDuration(remaining * 1000) }}</b>
        <span class="hint">Próxima: vuelta {{ current.nextRound }}/{{ current.rounds }}</span>
      </Card>
      <div class="rest-actions">
        <AppButton variant="ghost" @press="togglePause">{{ paused ? "Reanudar" : "Pausar" }}</AppButton>
        <AppButton variant="ghost" @press="addTime(15)">+15 s</AppButton>
        <AppButton variant="ghost" icon="skip" @press="skipRest">Saltar</AppButton>
      </div>
    </template>

    <!-- Restart is always available while running -->
    <AppButton v-if="!finished" block variant="ghost" @press="restart">Reiniciar</AppButton>
  </AppSubScreen>
</template>

<style scoped>
.progress {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 0.25s ease;
}
.pnum {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  text-align: center;
  padding: var(--sp-6) var(--sp-4);
}
.round {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ex {
  font-family: var(--font-cond);
  font-size: 40px;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.05;
}
.reps {
  font-family: var(--font-mono);
  font-size: 56px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.reps small {
  font-size: 20px;
  color: var(--muted);
  margin-left: 6px;
}
.rest .clock {
  font-family: var(--font-mono);
  font-size: 72px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.rest.paused .clock {
  color: var(--muted);
}
.hint {
  font-size: 12px;
  color: var(--muted);
}
.done {
  gap: var(--sp-3);
}
.done :deep(svg) {
  color: var(--accent);
}
.done b {
  font-family: var(--font-cond);
  font-size: 26px;
  font-weight: 700;
  text-transform: uppercase;
}
.done small {
  font-size: 13px;
  color: var(--muted);
}
.actions {
  display: flex;
  gap: var(--sp-3);
}
.rest-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-2);
}
</style>
