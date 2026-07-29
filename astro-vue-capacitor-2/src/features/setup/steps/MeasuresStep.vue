<script setup lang="ts">
import { Field } from "../../../shared/ui";

/** Step 3 — optional body measures. Weight seeds the first log entry on finish. */
defineProps<{ weight: string; height: string }>();
defineEmits<{ "update:weight": [value: string]; "update:height": [value: string] }>();
</script>

<template>
  <div class="step">
    <header class="head">
      <h2>Tus medidas</h2>
      <p>
        Opcional. El peso se guarda como historial — volvé a pesarte para ver el cambio. Podés
        corregir estas medidas iniciales más tarde desde Más › Perfil.
      </p>
    </header>
    <Field
      :model-value="weight"
      label="Peso (kg)"
      type="number"
      inputmode="decimal"
      placeholder="72"
      @update:model-value="$emit('update:weight', $event)"
    />
    <Field
      :model-value="height"
      label="Altura (cm)"
      type="number"
      inputmode="numeric"
      placeholder="175"
      @update:model-value="$emit('update:height', $event)"
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
