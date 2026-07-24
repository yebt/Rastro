<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { computed } from 'vue';
import HomeScreen from '../home/HomeScreen.vue';
import BottomNav from './BottomNav.vue';
import { $activeTab, TABS } from './nav.store';
import PlaceholderScreen from './PlaceholderScreen.vue';

/**
 * Island root — a thin composition surface: it wires the active-tab store to
 * the current screen and mounts the bottom nav. No feature logic lives here.
 */
const active = useStore($activeTab);

const activeLabel = computed(() => TABS.find((t) => t.id === active.value)?.label ?? '');
</script>

<template>
  <div class="app">
    <main class="app-main">
      <HomeScreen v-if="active === 'home'" />
      <PlaceholderScreen v-else :key="active" :title="activeLabel" />
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.app {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.app-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
