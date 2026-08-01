<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { AppIcon, AppScreen, Label } from "../../../shared/ui";
import type { MoveType } from "../domain/activity";
import { EXERCISES } from "../domain/exercises";
import { $routines, type Routine } from "../../tracking";

/** Idle state of the Actividad tab — pick a movement type, an exercise, or a
 *  routine. GPS recording doesn't begin until the user confirms on the ready
 *  screen. */
const emit = defineEmits<{
  select: [type: MoveType];
  exercise: [id: string];
  openRoutine: [routine: Routine];
  newRoutine: [];
}>();

const routines = useStore($routines);

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

    <Label>Ejercicios</Label>
    <div class="exercises">
      <button
        v-for="e in EXERCISES"
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
      <button
        v-for="r in routines"
        :key="r.id"
        type="button"
        class="routine"
        @click="emit('openRoutine', r)"
      >
        <span class="r-text">
          <b>{{ r.name }}</b>
          <small>{{ r.exercises.length }} ejercicios · {{ r.rounds }} vueltas</small>
        </span>
        <AppIcon name="chevron" size="16px" class="r-chev" />
      </button>
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
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-4);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  color: var(--ink);
  text-align: left;
}
.routine:active {
  border-color: var(--ink);
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
  justify-content: center;
  color: var(--muted);
  font-weight: 600;
  border-style: dashed;
}
.routine.new :deep(svg) {
  color: var(--accent);
}
</style>
