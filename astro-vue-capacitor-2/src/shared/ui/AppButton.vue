<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import type { IconName } from "./icons";

/**
 * The app's button. Variants and sizes are the only knobs — no ad-hoc styling
 * in features, so every tap target looks and behaves the same.
 *
 * Props down / events up: emits `press`; the parent decides what it does.
 */
withDefaults(
  defineProps<{
    variant?: "primary" | "ghost" | "danger";
    size?: "md" | "lg";
    icon?: IconName;
    block?: boolean;
    square?: boolean;
    disabled?: boolean;
  }>(),
  {
    variant: "primary",
    size: "md",
    icon: undefined,
    block: false,
    square: false,
    disabled: false,
  },
);

const emit = defineEmits<{ press: [] }>();
</script>

<template>
  <button
    type="button"
    class="btn"
    :class="[`v-${variant}`, `s-${size}`, { block, square }]"
    :disabled="disabled"
    @click="emit('press')"
  >
    <AppIcon v-if="icon" :name="icon" size="18px" />
    <span v-if="!square" class="btn-label"><slot /></span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  border-radius: var(--r-md);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
  transition:
    opacity 0.12s ease,
    transform 0.06s ease;
}
.btn:active {
  transform: scale(0.985);
}
.btn:disabled {
  opacity: 0.45;
  pointer-events: none;
}
.btn.block {
  display: flex;
  width: 100%;
}
.btn.square {
  width: 44px;
  padding: 0;
  flex: none;
}
.btn.square.s-lg {
  width: 52px;
}

/* Sizes */
.s-md {
  height: 44px;
  padding: 0 var(--sp-4);
}
.s-lg {
  height: 52px;
  padding: 0 var(--sp-5);
  font-size: 15px;
}

/* Variants */
.v-primary {
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}
.v-ghost {
  background: var(--surface);
  color: var(--ink);
  border-color: var(--line);
}
.v-danger {
  background: var(--danger);
  color: #fff;
  font-weight: 700;
  border-color: transparent;
}
</style>
