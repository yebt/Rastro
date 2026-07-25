<script setup lang="ts">
 /**
 * A bordered card that hosts a stack of <Row>s, drawing hairlines between them.
 * Rows stay dumb; the group owns the separators so a row placed anywhere looks
 * right.
 */
</script>

<template>
  <div class="group"><slot /></div>
</template>

<style scoped>
.group {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.group :deep(.row) {
  border-top: 1px solid var(--line);
}
.group :deep(.row:first-child) {
  border-top: none;
}
</style>
