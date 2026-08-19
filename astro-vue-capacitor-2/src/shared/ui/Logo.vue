<script setup lang="ts">
/**
 * Rastro brand mark — a clean geometric route-R: a single green stroke that
 * reads as an "R" with a solid ink start-dot, on a dark rounded tile.
 * Brand-fixed colors (not theme tokens) so it looks identical in light and
 * dark. The same mark, in the same colors, is the favicon (public/favicon.svg)
 * and the app launcher icon.
 */
withDefaults(defineProps<{ size?: string }>(), { size: "32px" });
</script>

<template>
  <svg class="logo" viewBox="0 0 48 48" aria-hidden="true">
    <rect width="48" height="48" rx="11" fill="#0a0c0d" />
    <path
      d="M 16.5 40 L 16.5 15.5 Q 16.5 10.5 21.5 10.5 L 25 10.5 A 7.5 7.5 0 0 1 25 25.5 L 19 25.5 C 24.5 28 29.5 33.5 32 40"
      fill="none"
      stroke="#4ce08c"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="16.5" cy="40" r="3.4" fill="#eef1ee" />
  </svg>
</template>

<style scoped>
.logo {
  width: v-bind(size);
  height: v-bind(size);
  display: block;
  flex: none;
}
</style>
