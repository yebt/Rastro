<script setup lang="ts">
/**
 * Surface container with a hairline border. `flush` removes inner padding for
 * cards that host edge-to-edge content (maps, lists with their own rows).
 */
withDefaults(defineProps<{ flush?: boolean }>(), {
  flush: false,
});
</script>

<template>
  <div class="card" :class="{ flush }"><slot /></div>
</template>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: var(--sp-4);
}
.card.flush {
  padding: 0;
  overflow: hidden;
}
</style>
