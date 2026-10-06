<script setup lang="ts">
import { ref, watch } from "vue";
import AppButton from "./AppButton.vue";
import ColorPicker from "./ColorPicker.vue";

/**
 * Bottom sheet wrapping the in-app ColorPicker: edit a draft, then "Usar color"
 * commits it (Cancelar / tapping outside discards). Used for every free color
 * choice in the app instead of the WebView's native color dialog.
 */
const props = withDefaults(
  defineProps<{ open: boolean; modelValue: string; title?: string; presets?: string[]; note?: string }>(),
  { title: "Elegir color", presets: () => [], note: "" },
);
const emit = defineEmits<{ "update:modelValue": [hex: string]; close: [] }>();

const draft = ref(props.modelValue);
watch(
  () => props.open,
  (o) => {
    if (o) draft.value = props.modelValue;
  },
);

function apply(): void {
  emit("update:modelValue", draft.value);
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="sheet-backdrop" @click.self="emit('close')">
      <div class="sheet" role="dialog" :aria-label="title">
        <div class="sheet-title">{{ title }}</div>
        <ColorPicker v-model="draft" :presets="presets" />
        <p v-if="note" class="note">{{ note }}</p>
        <div class="actions">
          <AppButton size="lg" block variant="ghost" @press="emit('close')">Cancelar</AppButton>
          <AppButton size="lg" block @press="apply">Usar color</AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  align-items: flex-end;
  background: color-mix(in srgb, black 55%, transparent);
  padding: var(--sp-4);
  padding-bottom: calc(var(--safe-b, 0px) + var(--sp-4));
}
.sheet {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
}
.sheet-title {
  font-family: var(--font-cond);
  font-size: 22px;
  font-weight: 600;
  text-transform: uppercase;
}
.note {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
.actions {
  display: flex;
  gap: var(--sp-3);
}
</style>
