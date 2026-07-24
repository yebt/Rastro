<script setup lang="ts">
import { computed } from 'vue';
import { ICONS, type IconName } from './icons';

/**
 * The only way icons enter the UI. Enforces a single family and a uniform
 * stroke/size; `size` accepts any CSS length so callers stay declarative.
 */
const props = withDefaults(defineProps<{ name: IconName; size?: string }>(), {
  size: '20px',
});

const component = computed(() => ICONS[props.name]);
</script>

<template>
  <component :is="component" class="app-icon" aria-hidden="true" />
</template>

<style scoped>
.app-icon {
  width: v-bind(size);
  height: v-bind(size);
  flex: none;
  display: block;
  /* Lucide draws with stroke; normalize weight across the app here. */
  stroke-width: 1.7;
}
</style>
