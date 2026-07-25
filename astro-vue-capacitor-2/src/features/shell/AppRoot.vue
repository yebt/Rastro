<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted } from "vue";
import { applyTheme } from "../settings/settings.store";
import SettingsRoot from "../settings/SettingsRoot.vue";
import { $setupDone } from "../setup/setup.store";
import SetupScreen from "../setup/SetupScreen.vue";
import HomeScreen from "../home/HomeScreen.vue";
import BottomNav from "./BottomNav.vue";
import { $activeTab, TABS } from "./nav.store";
import PlaceholderScreen from "./PlaceholderScreen.vue";

/**
 * Island root — a thin composition surface: reflects the saved theme, gates the
 * first-run setup, and wires the active-tab store to the current screen. No
 * feature logic lives here.
 */
const active = useStore($activeTab);
const setupDone = useStore($setupDone);

const activeLabel = computed(() => TABS.find((t) => t.id === active.value)?.label ?? "");

onMounted(() => {
  applyTheme();
});
</script>

<template>
  <SetupScreen v-if="!setupDone" />
  <div v-else class="app">
    <main class="app-main">
      <HomeScreen v-if="active === 'home'" />
      <SettingsRoot v-else-if="active === 'more'" />
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
