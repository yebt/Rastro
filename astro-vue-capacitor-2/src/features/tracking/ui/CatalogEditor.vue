<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { ref } from "vue";
import { AppButton, AppIcon, AppSubScreen, Card, Field } from "../../../shared/ui";
import {
  $exercises,
  addExercise,
  removeExercise,
  renameExercise,
  routinesUsing,
} from "../../tracking";

/**
 * Edit the exercise catalog: add, rename, remove. Removing an exercise that a
 * routine still references asks for confirmation first, so the user knows a
 * routine will be left pointing at a missing entry.
 */
const emit = defineEmits<{ back: [] }>();

const exercises = useStore($exercises);
const draftLabel = ref("");

function onAdd(): void {
  const created = addExercise(draftLabel.value);
  if (created) draftLabel.value = "";
}

function onRename(id: string, label: string): void {
  renameExercise(id, label);
}

function onRemove(id: string, label: string): void {
  const used = routinesUsing(id);
  if (used.length > 0) {
    const names = used.map((r) => r.name || "sin nombre").join(", ");
    const ok = globalThis.confirm(
      `"${label}" se usa en ${used.length} rutina(s): ${names}. Si lo borrás, esas rutinas quedan con un ejercicio faltante. ¿Borrar igual?`,
    );
    if (!ok) return;
  }
  removeExercise(id);
}
</script>

<template>
  <AppSubScreen title="Ejercicios" @back="emit('back')">
    <Card>
      <Field
        v-model="draftLabel"
        label="Nuevo ejercicio"
        placeholder="Ej. Flexiones"
        @keyup.enter="onAdd"
      >
        <template #action>
          <AppButton icon="plus" :disabled="!draftLabel.trim()" @press="onAdd">Agregar</AppButton>
        </template>
      </Field>
    </Card>

    <Card v-if="exercises.length">
      <div v-for="e in exercises" :key="e.id" class="item">
        <input
          class="name"
          :value="e.label"
          aria-label="Nombre del ejercicio"
          @change="onRename(e.id, ($event.target as HTMLInputElement).value)"
        />
        <button type="button" class="rm" aria-label="Borrar" @click="onRemove(e.id, e.label)">
          <AppIcon name="trash" size="16px" />
        </button>
      </div>
    </Card>

    <p v-else class="empty">No hay ejercicios. Agregá el primero arriba.</p>
  </AppSubScreen>
</template>

<style scoped>
.add {
  display: flex;
  gap: var(--sp-2);
  align-items: center;
}
.add :deep(.field),
.add > :first-child {
  flex: 1;
}
.item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) 0;
}
.item + .item {
  border-top: 1px solid var(--line);
}
.name {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  color: var(--ink);
  font-family: var(--font-cond);
  font-size: 16px;
  font-weight: 600;
  padding: var(--sp-2);
  border-radius: var(--r-sm);
}
.name:focus {
  outline: none;
  background: var(--surface-2);
}
.rm {
  flex: none;
  display: grid;
  place-items: center;
  color: var(--muted);
  padding: var(--sp-2);
}
.empty {
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}
</style>
