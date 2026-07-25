<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "./AppIcon.vue";
import type { IconName } from "./icons";

/**
 * One list row: leading icon, label, and either a `value` + chevron (a link into
 * a sub-page) or a custom trailing control via the `trailing` slot (a toggle,
 * swatches…). Interactive rows emit `press`; static rows (info) don't.
 */
const props = withDefaults(
  defineProps<{
    icon?: IconName;
    label: string;
    value?: string;
    interactive?: boolean;
    chevron?: boolean;
  }>(),
  {
    icon: undefined,
    value: undefined,
    interactive: true,
    chevron: undefined,
  },
);

const emit = defineEmits<{ press: [] }>();

// Chevron shows by default on interactive rows unless explicitly disabled.
const showChevron = computed(() => props.chevron ?? props.interactive);
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    class="row"
    :class="{ static: !interactive }"
    :type="interactive ? 'button' : undefined"
    @click="interactive && emit('press')"
  >
    <AppIcon v-if="icon" :name="icon" size="18px" class="row-ic" />
    <span class="row-label">{{ label }}</span>
    <span class="row-trail">
      <slot name="trailing">
        <span v-if="value" class="row-value">{{ value }}</span>
      </slot>
      <AppIcon v-if="showChevron" name="chevron" size="16px" class="row-chev" />
    </span>
  </component>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: 13px var(--sp-4);
  text-align: left;
  color: var(--ink);
  background: none;
}
.row:not(.static):active {
  background: var(--surface-2);
}
.row-ic {
  color: var(--muted);
}
.row-label {
  font-size: 14px;
  font-weight: 500;
}
.row-trail {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.row-value {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--muted);
}
.row-chev {
  color: var(--faint);
}
</style>
