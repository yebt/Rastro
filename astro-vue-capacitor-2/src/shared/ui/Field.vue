<script setup lang="ts">
/**
 * Labeled text/number input with an optional trailing action slot (e.g. the
 * weight "+" button). Two-way via v-model; a true form control contract, so
 * v-model is the right tool here.
 */
withDefaults(
  defineProps<{
    label: string;
    modelValue: string;
    type?: "text" | "number";
    inputmode?: "text" | "numeric" | "decimal";
    placeholder?: string;
    hint?: string;
    autocomplete?: string;
  }>(),
  {
    type: "text",
    inputmode: "text",
    placeholder: undefined,
    hint: undefined,
    autocomplete: undefined,
  },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

function onInput(event: Event): void {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>

<template>
  <label class="field">
    <span class="field-lbl">
      {{ label }}
      <em v-if="hint" class="field-hint">{{ hint }}</em>
    </span>
    <span class="field-row">
      <input
        class="field-in"
        :type="type"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :value="modelValue"
        @input="onInput"
      />
      <slot name="action" />
    </span>
  </label>
</template>

<style scoped>
.field {
  display: block;
}
.field-lbl {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 6px;
}
.field-hint {
  font-style: normal;
  font-weight: 500;
  color: var(--accent);
}
.field-row {
  display: flex;
  gap: var(--sp-2);
}
.field-in {
  width: 100%;
  height: 44px;
  padding: 0 var(--sp-3);
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
}
.field-in::placeholder {
  color: var(--muted);
  font-weight: 500;
}
.field-in:focus {
  outline: none;
  border-color: var(--ink);
}
</style>
