<script setup lang="ts">
import { Field } from "../../../shared/ui";

/** Step 2 — a single optional name. Parent owns the value (props down, events up). */
defineProps<{ name: string }>();
defineEmits<{ "update:name": [value: string] }>();
</script>

<template>
  <div class="step">
    <header class="head">
      <h2>¿Cómo te llamás?</h2>
      <p>Se usa para saludarte. Queda solo en tu dispositivo.</p>
    </header>
    <Field
      :model-value="name"
      label="Nombre o apodo"
      placeholder="Cómo te dicen"
      @update:model-value="$emit('update:name', $event)"
    />
  </div>
</template>

<style scoped>
.step {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
.head h2 {
  margin: 0;
  font-family: var(--font-cond);
  font-size: 24px;
  font-weight: 700;
  text-transform: uppercase;
}
.head p {
  margin: var(--sp-1) 0 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
</style>
