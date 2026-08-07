<script setup lang="ts" generic="T extends string">
/**
 * Segmented control — a small set of mutually-exclusive options. Generic over
 * the value type so callers keep their own union (e.g. Theme) end to end.
 */
defineProps<{
  options: { value: T; label: string }[];
  modelValue: T;
}>();

const emit = defineEmits<{ "update:modelValue": [value: T] }>();
</script>

<template>
  <div class="seg" role="group">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :class="{ on: modelValue === opt.value }"
      :aria-pressed="modelValue === opt.value"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: flex;
  gap: 6px;
  padding: 4px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
}
.seg button {
  flex: 1;
  padding: 9px;
  border-radius: var(--r-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}
.seg button.on {
  background: var(--ink);
  color: var(--bg);
}
</style>
