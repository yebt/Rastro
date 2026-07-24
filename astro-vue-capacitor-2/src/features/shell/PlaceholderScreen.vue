<script setup lang="ts">
import { AppScreen } from '../../shared/ui';

/**
 * Stand-in for tabs that don't have a feature yet. Keeps the shell fully
 * navigable while the base app carries no real content.
 */
defineProps<{ title: string }>();
</script>

<template>
  <AppScreen :title="title">
    <p class="placeholder">En construcción.</p>
  </AppScreen>
</template>

<style scoped>
.placeholder {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
</style>
