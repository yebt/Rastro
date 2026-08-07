<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, ref } from "vue";
import { AppButton, AppIcon, AppSubScreen, Card, Field, Label } from "../../../shared/ui";
import {
  $exercises,
  deleteRoutine,
  exerciseLabel,
  getRoutine,
  type Routine,
  saveRoutine,
} from "../../tracking";

const catalog = useStore($exercises);

/** Create or edit a routine (a circuit: reps per exercise, rounds, rests). */
const props = defineProps<{ routine: Routine }>();
const emit = defineEmits<{ done: [] }>();

const draft = ref<Routine>(JSON.parse(JSON.stringify(props.routine)) as Routine);
const isExisting = computed(() => getRoutine(props.routine.id) !== undefined);

const canSave = computed(
  () => draft.value.name.trim().length > 0 && draft.value.exercises.length > 0,
);

function num(value: string, min: number): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= min ? n : min;
}

function addExercise(id: string): void {
  draft.value.exercises.push({ exerciseId: id, reps: 10 });
}
function removeExercise(i: number): void {
  draft.value.exercises.splice(i, 1);
}

function save(): void {
  if (!canSave.value) return;
  draft.value.name = draft.value.name.trim();
  saveRoutine(draft.value);
  emit("done");
}
function remove(): void {
  deleteRoutine(draft.value.id);
  emit("done");
}
</script>

<template>
  <AppSubScreen :title="isExisting ? 'Editar rutina' : 'Nueva rutina'" @back="emit('done')">
    <Card>
      <div class="stack">
        <Field
          :model-value="draft.name"
          label="Nombre"
          placeholder="Ej. Circuito mañana"
          @update:model-value="(v) => (draft.name = v)"
        />
        <Field
          :model-value="String(draft.rounds)"
          label="Vueltas"
          type="number"
          inputmode="numeric"
          @update:model-value="(v) => (draft.rounds = num(v, 1))"
        />
        <Field
          :model-value="String(draft.restBetweenExercisesSec)"
          label="Descanso entre ejercicios (seg)"
          type="number"
          inputmode="numeric"
          @update:model-value="(v) => (draft.restBetweenExercisesSec = num(v, 0))"
        />
        <Field
          :model-value="String(draft.restBetweenRoundsSec)"
          label="Descanso entre vueltas (seg)"
          type="number"
          inputmode="numeric"
          @update:model-value="(v) => (draft.restBetweenRoundsSec = num(v, 0))"
        />
      </div>
    </Card>

    <Label>Ejercicios (en orden)</Label>
    <Card>
      <div v-if="draft.exercises.length" class="stack">
        <div v-for="(ex, i) in draft.exercises" :key="i" class="ex-row">
          <span class="ex-name">{{ exerciseLabel(ex.exerciseId) }}</span>
          <Field
            class="ex-reps"
            :model-value="String(ex.reps)"
            label="reps"
            type="number"
            inputmode="numeric"
            @update:model-value="(v) => (ex.reps = num(v, 1))"
          />
          <AppButton
            icon="trash"
            square
            variant="ghost"
            aria-label="Quitar"
            @press="removeExercise(i)"
          />
        </div>
      </div>
      <p v-else class="empty">Agregá al menos un ejercicio.</p>
    </Card>

    <div class="add">
      <button v-for="e in catalog" :key="e.id" type="button" class="chip" @click="addExercise(e.id)">
        <AppIcon name="plus" size="14px" /> {{ e.label }}
      </button>
    </div>

    <div class="actions">
      <AppButton v-if="isExisting" size="lg" block variant="danger" @press="remove">Borrar</AppButton>
      <AppButton size="lg" block :disabled="!canSave" @press="save">Guardar</AppButton>
    </div>
  </AppSubScreen>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
.ex-row {
  display: flex;
  align-items: flex-end;
  gap: var(--sp-3);
}
.ex-name {
  flex: 1;
  min-width: 0;
  font-family: var(--font-cond);
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  padding-bottom: 12px;
}
.ex-reps {
  width: 92px;
  flex: none;
}
.add {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px var(--sp-3);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.chip :deep(svg) {
  color: var(--accent);
}
.empty {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
.actions {
  display: flex;
  gap: var(--sp-3);
}
</style>
