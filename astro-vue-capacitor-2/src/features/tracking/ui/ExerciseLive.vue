<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { AppButton, AppScreen, Card } from "../../../shared/ui";
import {
  activityRepository,
  type ExerciseActivity,
  type ExerciseSet,
  exerciseLabel,
  startExercise,
  totalReps,
} from "../../tracking";
import { formatDuration } from "./format";

/**
 * Log an exercise: count reps into sets, no GPS. Tap +1 as you go, "Nueva serie"
 * banks the current set, finish saves it as an ExerciseActivity.
 */
const props = defineProps<{ exerciseId: string }>();
const emit = defineEmits<{ done: [] }>();

const base = startExercise(props.exerciseId, Date.now());
const label = exerciseLabel(props.exerciseId);

const sets = ref<ExerciseSet[]>([]);
const reps = ref(0);
const elapsed = ref(0);

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => {
    elapsed.value = Date.now() - base.startedAt;
  }, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const total = computed(() => totalReps(sets.value) + reps.value);

function inc(): void {
  reps.value++;
}
function dec(): void {
  if (reps.value > 0) reps.value--;
}
function bankSet(): void {
  if (reps.value > 0) {
    sets.value.push({ reps: reps.value });
    reps.value = 0;
  }
}

async function finish(): Promise<void> {
  bankSet();
  if (sets.value.length === 0) {
    emit("done"); // nothing logged — nothing to save
    return;
  }
  const activity: ExerciseActivity = { ...base, endedAt: Date.now(), sets: sets.value };
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
      <div class="counter">
        <div class="count">{{ reps }}</div>
        <div class="count-label">repeticiones · serie {{ sets.length + 1 }}</div>
      </div>
      <div class="pad">
        <AppButton size="lg" variant="ghost" icon="trash" square aria-label="Quitar" @press="dec" />
        <button type="button" class="plus" @click="inc">+1</button>
        <AppButton size="lg" variant="ghost" @press="bankSet">Nueva serie</AppButton>
      </div>
    </Card>

    <Card v-if="sets.length || total">
      <div class="sets">
        <div v-for="(s, i) in sets" :key="i" class="set-row">
          <span>Serie {{ i + 1 }}</span>
          <b>{{ s.reps }}</b>
        </div>
        <div class="set-row total">
          <span>Total</span>
          <b>{{ total }}</b>
        </div>
      </div>
    </Card>

    <div class="actions">
      <AppButton size="lg" block variant="ghost" @press="emit('done')">Descartar</AppButton>
      <AppButton size="lg" block @press="finish">Finalizar</AppButton>
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
.counter {
  text-align: center;
  padding: var(--sp-3) 0 var(--sp-4);
}
.count {
  font-family: var(--font-mono);
  font-size: 64px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.count-label {
  margin-top: var(--sp-2);
  font-size: 12px;
  color: var(--muted);
}
.pad {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--sp-3);
}
.plus {
  height: 64px;
  border-radius: var(--r-md);
  background: var(--accent);
  color: var(--accent-ink);
  font-family: var(--font-cond);
  font-size: 26px;
  font-weight: 700;
}
.plus:active {
  transform: scale(0.98);
}
.sets {
  display: flex;
  flex-direction: column;
}
.set-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: var(--sp-2) 0;
  font-size: 14px;
}
.set-row + .set-row {
  border-top: 1px solid var(--line);
}
.set-row b {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
.set-row.total {
  font-weight: 600;
}
.actions {
  display: flex;
  gap: var(--sp-3);
  margin-top: var(--sp-2);
}
</style>
