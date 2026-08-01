<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { AppButton, AppIcon, AppScreen, Card, Label } from "../../../shared/ui";
import {
  type Activity,
  activityRepository,
  type ExerciseActivity,
  type ExerciseSet,
  exerciseLabel,
  exerciseStats,
  startExercise,
  totalReps,
} from "../../tracking";
import { formatDuration } from "./format";

/**
 * Log an exercise: type the reps for a set (with +/- to nudge), add it, repeat.
 * Finish saves it as an ExerciseActivity. No GPS.
 */
const props = defineProps<{ exerciseId: string }>();
const emit = defineEmits<{ done: [] }>();

const base = startExercise(props.exerciseId, Date.now());
const label = exerciseLabel(props.exerciseId);

const sets = ref<ExerciseSet[]>([]);
const draft = ref(""); // reps for the set being entered
const elapsed = ref(0);
const saved = ref<Activity[]>([]);

const stats = computed(() => exerciseStats(saved.value, props.exerciseId, Date.now()));

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(async () => {
  timer = setInterval(() => {
    elapsed.value = Date.now() - base.startedAt;
  }, 1000);
  saved.value = await activityRepository().list();
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const draftReps = computed(() => Math.max(0, Math.floor(Number(draft.value) || 0)));
const total = computed(() => totalReps(sets.value) + draftReps.value);

function nudge(by: number): void {
  draft.value = String(Math.max(0, draftReps.value + by));
}
function addSet(): void {
  if (draftReps.value > 0) {
    sets.value.push({ reps: draftReps.value });
    draft.value = "";
  }
}
function removeSet(i: number): void {
  sets.value.splice(i, 1);
}

async function finish(): Promise<void> {
  addSet(); // bank a pending draft so nothing is lost
  if (sets.value.length === 0) {
    emit("done"); // nothing logged
    return;
  }
  // Plain objects only — a reactive Proxy can't be structured-cloned into IndexedDB.
  const activity: ExerciseActivity = {
    ...base,
    endedAt: Date.now(),
    sets: sets.value.map((s) => ({ reps: s.reps })),
  };
  await activityRepository().save(activity);
  emit("done");
}
</script>

<template>
  <AppScreen :title="label">
    <div class="head">
      <span class="reg">Registrando</span>
      <span class="time">{{ formatDuration(elapsed) }}</span>
    </div>

    <Card>
      <div class="hstats">
        <div class="hstat"><b>{{ stats.allTime }}</b><small>total</small></div>
        <div class="hstat"><b>{{ stats.today }}</b><small>hoy</small></div>
        <div class="hstat"><b>{{ stats.bestSession }}</b><small>mejor sesión</small></div>
        <div class="hstat"><b>{{ stats.bestSet }}</b><small>mejor serie</small></div>
      </div>
    </Card>

    <Card>
      <Label>Repeticiones · serie {{ sets.length + 1 }}</Label>
      <div class="stepper">
        <button type="button" class="step" aria-label="Restar" @click="nudge(-1)">−</button>
        <input
          v-model="draft"
          class="reps"
          type="number"
          inputmode="numeric"
          placeholder="0"
          @keyup.enter="addSet"
        />
        <button type="button" class="step" aria-label="Sumar" @click="nudge(1)">+</button>
      </div>
      <AppButton block size="lg" icon="plus" :disabled="draftReps === 0" @press="addSet">
        Agregar serie
      </AppButton>
    </Card>

    <Card v-if="sets.length">
      <div class="sets">
        <div v-for="(s, i) in sets" :key="i" class="chip">
          <span class="s">S{{ i + 1 }}</span>
          <b class="n">{{ s.reps }}</b>
          <button type="button" class="rm" aria-label="Quitar serie" @click="removeSet(i)">
            <AppIcon name="trash" size="14px" />
          </button>
        </div>
      </div>
      <div class="total">Total: <b>{{ total }}</b> reps</div>
    </Card>

    <div class="actions">
      <AppButton size="lg" block variant="ghost" @press="emit('done')">Descartar</AppButton>
      <AppButton size="lg" block @press="finish">Guardar</AppButton>
    </div>
  </AppScreen>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.reg {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}
.time {
  font-family: var(--font-mono);
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}
.hstats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-2);
}
.hstat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}
.hstat b {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.hstat small {
  font-size: 10px;
  color: var(--muted);
  line-height: 1.2;
}
.stepper {
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  gap: var(--sp-2);
  margin: var(--sp-2) 0 var(--sp-3);
}
.step {
  height: 64px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 28px;
  font-weight: 600;
}
.step:active {
  background: var(--surface-2);
}
.reps {
  height: 64px;
  width: 100%;
  text-align: center;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 34px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.reps:focus {
  outline: none;
  border-color: var(--ink);
}
.sets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 6px var(--sp-2) 6px var(--sp-3);
  border: 1px solid var(--line);
  border-radius: 999px;
}
.chip .s {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}
.chip .n {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
.chip .rm {
  display: grid;
  place-items: center;
  color: var(--muted);
}
.total {
  margin-top: var(--sp-3);
  font-size: 13px;
  color: var(--muted);
}
.total b {
  font-family: var(--font-mono);
  font-size: 16px;
  color: var(--ink);
}
.actions {
  display: flex;
  gap: var(--sp-3);
  margin-top: var(--sp-2);
}
</style>
