<script setup lang="ts">
/**
 * A single tab's scroll surface. Owns the safe-area top inset and consistent
 * screen padding; the shell stacks these under the bottom nav.
 *
 * `title` renders the standard screen header; omit it for custom/flush screens
 * (e.g. a full-bleed map) and lay out via the default slot.
 */
withDefaults(defineProps<{ title?: string; flush?: boolean }>(), {
  title: undefined,
  flush: false,
});
</script>

<template>
  <section class="screen" :class="{ flush }">
    <header v-if="title" class="screen-head">
      <h1 class="screen-title">{{ title }}</h1>
    </header>
    <div class="screen-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.screen {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: calc(var(--safe-t) + var(--sp-4)) var(--sp-4) var(--sp-5);
}
.screen.flush {
  padding: 0;
}
.screen-head {
  display: flex;
  align-items: center;
  min-height: 36px;
  margin-bottom: var(--sp-4);
}
.screen-title {
  margin: 0;
  font-family: var(--font-cond);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}
.screen-body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
</style>
