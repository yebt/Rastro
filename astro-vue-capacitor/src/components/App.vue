<script setup lang="ts">
import { App as CapApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { useStore } from '@nanostores/vue';
import IconMapPin from '~icons/lucide/map-pin';
import { computed, onMounted, onUnmounted } from 'vue';
import { loadActivities } from '../stores/activities';
import { $setupDone } from '../stores/settings';
import { initTheme } from '../theme';
import { $activeTab, $detailId, $setupOpen, closeDetail, closeSetup, setTab } from '../stores/ui';
import ActivityDetail from './ActivityDetail.vue';
import BottomNav from './BottomNav.vue';
import HomeTab from './HomeTab.vue';
import MoreTab from './MoreTab.vue';
import ProfileTab from './ProfileTab.vue';
import SetupScreen from './SetupScreen.vue';
import Toast from './Toast.vue';
import WorkoutTab from './WorkoutTab.vue';

const tab = useStore($activeTab);
const detailId = useStore($detailId);
const setupDone = useStore($setupDone);
const setupOpen = useStore($setupOpen);

// First run on native prompts for permissions; also re-openable from More.
const showSetup = computed(
  () => setupOpen.value || (Capacitor.isNativePlatform() && !setupDone.value),
);

// Short motivational line under the wordmark, rotating by day.
const MOTIVES = [
  'Un paso más que ayer',
  'Hoy también suma',
  'Constancia le gana a intensidad',
  'Tu única competencia sos vos',
  'Cada km cuenta',
  'Empezá, el resto viene solo',
  'El mejor rastro es el que dejás hoy',
];
const motive = MOTIVES[new Date().getDate() % MOTIVES.length];

let backHandle: PluginListenerHandle | null = null;

/**
 * Android hardware back: dismiss overlays first, then fall back to the home tab,
 * and only leave (minimize — keeps a running track alive) from home.
 */
async function registerBackButton(): Promise<void> {
  backHandle = await CapApp.addListener('backButton', () => {
    if ($setupOpen.get()) return closeSetup();
    if ($detailId.get()) return closeDetail();
    if ($activeTab.get() !== 'home') return setTab('home');
    void CapApp.minimizeApp();
  });
}

onMounted(() => {
  initTheme();
  void registerBackButton();
  // Reveal the app once the theme is applied and data is loaded — hides the
  // splash with no black gap and no flash of an empty list.
  void loadActivities().finally(() => {
    if (Capacitor.isNativePlatform()) void SplashScreen.hide({ fadeOutDuration: 250 });
  });
  if (import.meta.env.DEV) {
    // Dev-only tracking diagnostics (heartbeat + suspension detector) in eruda.
    void import('../debug/trackerDiagnostics').then((m) => m.initTrackerDiagnostics());
  }
});

onUnmounted(() => {
  void backHandle?.remove();
});
</script>

<template>
  <div id="app">
    <div class="topbar">
      <div class="logo">
        <IconMapPin />
      </div>
      <div>
        <div class="brand">Rastro</div>
        <small>{{ motive }}</small>
      </div>
    </div>

    <HomeTab :active="tab === 'home'" />
    <WorkoutTab :active="tab === 'workout'" />
    <ProfileTab :active="tab === 'profile'" />
    <MoreTab :active="tab === 'more'" />
  </div>

  <BottomNav />
  <Toast />

  <ActivityDetail v-if="detailId" :id="detailId" />
  <SetupScreen v-if="showSetup" />
</template>
