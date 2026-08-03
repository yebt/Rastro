<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { AppIcon, AppScreen, Label } from "../../../shared/ui";
import type { MoveType } from "../domain/activity";
import { $exercises, $routines, type Routine } from "../../tracking";

/** Idle state of the Actividad tab — pick a movement type, an exercise, or a
 *  routine. GPS recording doesn't begin until the user confirms on the ready
 *  screen. */
const emit = defineEmits<{
  select: [type: MoveType];
  exercise: [id: string];
  runRoutine: [routine: Routine];
  editRoutine: [routine: Routine];
  newRoutine: [];
  editCatalog: [];
}>();

const routines = useStore($routines);
const exercises = useStore($exercises);

const TYPES: { type: MoveType; label: string; hint: string }[] = [
  { type: "walk", label: "Caminar", hint: "Paso tranquilo" },
  { type: "jog", label: "Trotar", hint: "Ritmo suave" },
  { type: "run", label: "Correr", hint: "A fondo" },
];
</script>

<template>
  <AppScreen title="Actividad">
    <p class="lead">Elegí cómo te vas a mover. Empieza a registrar al toque.</p>
    <div class="choices">
      <button
        v-for="t in TYPES"
        :key="t.type"
        type="button"
        class="choice"
        @click="emit('select', t.type)"
      >
        <AppIcon :name="t.type" size="24px" class="choice-lead" />
        <span class="choice-text">
          <b>{{ t.label }}</b>
          <small>{{ t.hint }}</small>
        </span>
        <AppIcon name="play" size="18px" class="choice-ic" />
      </button>
    </div>

    <div class="section-h">
      <Label>Ejercicios</Label>
      <button type="button" class="edit" @click="emit('editCatalog')">Editar</button>
    </div>
    <div class="exercises">
      <button
        v-for="e in exercises"
        :key="e.id"
        type="button"
        class="ex"
        @click="emit('exercise', e.id)"
      >
        <AppIcon name="dumbbell" size="20px" />
        <span>{{ e.label }}</span>
      </button>
    </div>

    <Label>Rutinas</Label>
    <div class="routines">
      <div v-for="r in routines" :key="r.id" class="routine">
        <button type="button" class="r-run" @click="emit('runRoutine', r)">
          <span class="r-text">
            <b>{{ r.name }}</b>
            <small>{{ r.exercises.length }} ejercicios · {{ r.rounds }} vueltas</small>
          </span>
          <AppIcon name="play" size="16px" class="r-chev" />
        </button>
        <button
          type="button"
          class="r-edit"
          aria-label="Editar rutina"
          @click="emit('editRoutine', r)"
        >
          <AppIcon name="edit" size="16px" />
        </button>
      </div>
      <button type="button" class="routine new" @click="emit('newRoutine')">
        <AppIcon name="plus" size="18px" />
        <span>Nueva rutina</span>
      </button>
    </div>
  </AppScreen>
</template>

<style scoped>
.lead {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
.choices {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.choice {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  text-align: left;
}
.choice:active {
  border-color: var(--ink);
}
.choice-lead {
  flex: none;
  color: var(--ink);
}
.choice-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.choice-text b {
  font-family: var(--font-cond);
  font-size: 20px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
.choice-text small {
  font-size: 12px;
  color: var(--muted);
}
.choice-ic {
  flex: none;
  color: var(--accent);
}
.section-h {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.edit {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}
.exercises {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}
.ex {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-4);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  color: var(--ink);
  font-family: var(--font-cond);
  font-size: 15px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
.ex:active {
  border-color: var(--ink);
}
.ex :deep(svg) {
  color: var(--accent);
  flex: none;
}
.routines {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.routine {
  display: flex;
  align-items: stretch;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.r-run {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-4);
  color: var(--ink);
  text-align: left;
}
.r-run:active {
  background: var(--surface-2);
}
.r-edit {
  flex: none;
  display: grid;
  place-items: center;
  padding: 0 var(--sp-4);
  border-left: 1px solid var(--line);
  color: var(--muted);
}
.r-edit:active {
  background: var(--surface-2);
}
.r-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.r-text b {
  font-family: var(--font-cond);
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
}
.r-text small {
  font-size: 12px;
  color: var(--muted);
}
.r-chev {
  color: var(--muted);
}
.routine.new {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  padding: var(--sp-4);
  color: var(--muted);
  font-weight: 600;
  border-style: dashed;
}
.routine.new :deep(svg) {
  color: var(--accent);
}
</style>
