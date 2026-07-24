<script setup lang="ts">
/**
 * Mono micro-label / kicker — the small uppercase tracked text used above
 * sections and stats. Accent tone highlights an active/positive value.
 */
withDefaults(defineProps<{ tone?: "default" | "accent" }>(), {
  tone: "default",
});
</script>

<template>
  <span class="label" :class="`t-${tone}`"><slot /></span>
</template>

<style scoped>
.label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--faint);
}
.t-accent {
  color: var(--accent);
}
</style>
