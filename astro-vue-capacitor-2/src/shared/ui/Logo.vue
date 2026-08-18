<script setup lang="ts">
/**
 * Rastro brand mark — a filled accent-green tile with an angular R cut in dark
 * negative space. Brand-fixed colors (not theme tokens) so it looks identical
 * in light and dark. The same mark, in the same colors, is the favicon
 * (public/favicon.svg) and the app launcher icon.
 */
withDefaults(defineProps<{ size?: string }>(), { size: "32px" });
</script>

<template>
  <svg class="logo" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="7" fill="#4ce08c" />
    <g
      fill="none"
      stroke="#0a0c0d"
      stroke-width="4.7"
      stroke-linecap="round"
      stroke-linejoin="miter"
      transform="skewX(-8) translate(2.2 0)"
    >
      <path d="M11 25.2 L11 6.8 L19.2 6.8 L23.4 11 L23.4 12.8 L19.2 17 L11 17" />
      <path d="M15 17 L23.4 25.2" />
    </g>
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
