<script setup lang="ts">
import AppIcon from "./AppIcon.vue";

/**
 * A dedicated sub-page with a back header — the chrome for one settings
 * category. Emits `back`; the caller decides where that goes (there is no
 * router; navigation is store-driven).
 */
defineProps<{ title: string }>();
const emit = defineEmits<{ back: [] }>();
</script>

<template>
  <section class="subscreen">
    <header class="sub-head">
      <button type="button" class="back" aria-label="Volver" @click="emit('back')">
        <AppIcon name="back" size="22px" />
      </button>
      <h1 class="sub-title">{{ title }}</h1>
    </header>
    <div class="sub-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.subscreen {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: calc(var(--safe-t) + var(--sp-4)) var(--sp-4) var(--sp-5);
}
.sub-head {
  display: flex;
  align-items: center;
  min-height: 36px;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
}
.back {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-left: -8px;
  border-radius: var(--r-md);
  color: var(--ink);
}
.back:active {
  background: var(--surface-2);
}
.sub-title {
  margin: 0;
  font-family: var(--font-cond);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}
.sub-body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
</style>
