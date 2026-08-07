<script setup lang="ts">
/**
 * Rastro brand mark — a trail with a start point and a goal. Theme-aware (uses
 * tokens), transparent background, so it sits anywhere in the app. The same
 * glyph, in fixed colors, is the favicon (public/favicon.svg).
 */
withDefaults(defineProps<{ size?: string }>(), { size: "32px" });
</script>

<template>
  <svg class="logo" viewBox="0 0 32 32" aria-hidden="true">
    <path
      d="M8 23c4-2 3-7 7-8s6-3 9-6"
      fill="none"
      stroke="var(--accent)"
      stroke-width="2.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="8" cy="23" r="2.6" fill="var(--ink)" />
    <circle cx="24" cy="9" r="2.6" fill="var(--accent)" />
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
