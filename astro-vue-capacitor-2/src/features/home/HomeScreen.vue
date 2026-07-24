<script setup lang="ts">
import { AppScreen } from '../../shared/ui';

/**
 * Home tab. Intentionally empty for now — it exists to prove the shell, the
 * design-system primitives and the theming end to end. Real content (week
 * summary, streak, quick start) lands in a later pass.
 */
</script>

<template>
  <AppScreen title="Inicio">
    <p class="placeholder">Todavía sin contenido.</p>
  </AppScreen>
</template>

<style scoped>
.placeholder {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
</style>
