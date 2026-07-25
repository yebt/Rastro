<script setup lang="ts">
import { Field } from "../../../shared/ui";

/** Step 2 — optional identity. Parent owns the values (props down, events up). */
defineProps<{ nickname: string; name: string }>();
defineEmits<{ "update:nickname": [value: string]; "update:name": [value: string] }>();
</script>

<template>
  <div class="step">
    <header class="head">
      <h2>¿Cómo te llamás?</h2>
      <p>Opcional. Se usa para saludarte. Todo queda en tu dispositivo.</p>
    </header>
    <Field
      :model-value="nickname"
      label="Apodo"
      placeholder="Cómo te dicen"
      @update:model-value="$emit('update:nickname', $event)"
    />
    <Field
      :model-value="name"
      label="Nombre"
      autocomplete="name"
      placeholder="Tu nombre"
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
