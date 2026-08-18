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
      d="M10 27 L10 11 C10 6.5 21 6 21 12.5 C21 17 13.5 17 11 16.5 C15.5 17.5 18.5 23 22.5 27"
      fill="none"
      stroke="var(--accent)"
      stroke-width="2.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="10" cy="27" r="2.6" fill="var(--ink)" />
    <circle cx="22.5" cy="27" r="2.6" fill="none" stroke="var(--accent)" stroke-width="2" />
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
