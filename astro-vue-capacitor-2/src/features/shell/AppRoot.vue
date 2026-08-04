<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onBeforeUnmount, onMounted } from "vue";
import { requestPendingPermissions } from "../permissions/permissions";
import { recorder } from "../recording";
import { applyAccent } from "../settings/accent.store";
import { applyTheme } from "../settings/settings.store";
import SettingsRoot from "../settings/SettingsRoot.vue";
import { $setupDone } from "../setup/setup.store";
import SetupScreen from "../setup/SetupScreen.vue";
import ProfileScreen from "../history/ProfileScreen.vue";
import HomeScreen from "../home/HomeScreen.vue";
import LiveMove from "../tracking/ui/LiveMove.vue";
import WorkoutScreen from "../tracking/ui/WorkoutScreen.vue";
import { registerBackButton } from "./back";
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
const recStatus = useStore(recorder.$status);
// While recording, the immersive LiveMove overlay covers the tabs and the nav.
const recording = computed(() => recStatus.value === "recording" || recStatus.value === "paused");

const activeLabel = computed(() => TABS.find((t) => t.id === active.value)?.label ?? "");

let disposeBack: (() => void) | null = null;

onMounted(() => {
  applyTheme();
  applyAccent();
  disposeBack = registerBackButton();
  // First run asks inside the setup; once it's done the setup never shows again,
  // so ask here on entry for anything still undecided (v1 behaviour).
  if (setupDone.value) void requestPendingPermissions();
});

onBeforeUnmount(() => {
  disposeBack?.();
});
</script>

<template>
  <SetupScreen v-if="!setupDone" />
  <template v-else>
    <div class="app">
      <main class="app-main">
        <HomeScreen v-if="active === 'home'" />
        <WorkoutScreen v-else-if="active === 'workout'" />
        <ProfileScreen v-else-if="active === 'profile'" />
        <SettingsRoot v-else-if="active === 'more'" />
        <PlaceholderScreen v-else :key="active" :title="activeLabel" />
      </main>
      <BottomNav />
    </div>
    <LiveMove v-if="recording" />
  </template>
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
