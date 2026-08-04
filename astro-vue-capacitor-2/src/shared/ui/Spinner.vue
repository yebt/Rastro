<script setup lang="ts">
/** Minimal indeterminate spinner. Size via the `size` prop (CSS length). */
withDefaults(defineProps<{ size?: string }>(), { size: "18px" });
</script>

<template>
  <span
    class="spinner"
    :style="{ width: size, height: size }"
    role="status"
    aria-label="Cargando"
  ></span>
</template>

<style scoped>
.spinner {
  display: inline-block;
  border: 2px solid var(--line-2);
  border-top-color: var(--accent);
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
  flex: none;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
