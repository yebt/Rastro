<script setup lang="ts">
import { AppIcon, AppScreen } from "../../../shared/ui";
import type { MoveType } from "../domain/activity";

/** Idle state of the Actividad tab — pick a movement type. Recording doesn't
 *  begin until the user confirms on the ready screen. */
const emit = defineEmits<{ select: [type: MoveType] }>();

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
</style>
