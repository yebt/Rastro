<script setup lang="ts">
import { App as CapApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { useStore } from '@nanostores/vue';
import IconMapPin from '~icons/lucide/map-pin';
import IconSettings from '~icons/lucide/settings';
import { computed, onMounted, onUnmounted } from 'vue';
import { loadActivities } from '../stores/activities';
import { $setupDone } from '../stores/settings';
import { initTheme } from '../theme';
import {
  $activeTab,
  $detailId,
  $settingsOpen,
  $setupOpen,
  closeDetail,
  closeSettings,
  closeSetup,
  openSettings,
  setTab,
} from '../stores/ui';
import ActivityDetail from './ActivityDetail.vue';
import BottomNav from './BottomNav.vue';
import DatosTab from './DatosTab.vue';
import DominadasTab from './DominadasTab.vue';
import HistorialTab from './HistorialTab.vue';
import ProgresoTab from './ProgresoTab.vue';
import SettingsSheet from './SettingsSheet.vue';
import SetupScreen from './SetupScreen.vue';
import Toast from './Toast.vue';
import TrackerTab from './TrackerTab.vue';

const tab = useStore($activeTab);
const detailId = useStore($detailId);
const settingsOpen = useStore($settingsOpen);
const setupDone = useStore($setupDone);
const setupOpen = useStore($setupOpen);

// First run on native prompts for permissions; also re-openable from settings.
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
 * Android hardware back: dismiss overlays, then fall back to the home tab,
 * and only leave (minimize — keeps a running track alive) from home.
 */
async function registerBackButton(): Promise<void> {
  backHandle = await CapApp.addListener('backButton', () => {
    if ($setupOpen.get()) return closeSetup();
    if ($settingsOpen.get()) return closeSettings();
    if ($detailId.get()) return closeDetail();
    if ($activeTab.get() !== 'track') return setTab('track');
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
      <button class="gear" type="button" aria-label="Configuración" @click="openSettings">
        <IconSettings />
      </button>
    </div>

    <TrackerTab :active="tab === 'track'" />
    <DominadasTab :active="tab === 'pull'" />
    <HistorialTab :active="tab === 'hist'" />
    <ProgresoTab :active="tab === 'progress'" />
    <DatosTab :active="tab === 'data'" />
  </div>

  <BottomNav />
  <Toast />

  <ActivityDetail v-if="detailId" :id="detailId" />
  <SettingsSheet v-if="settingsOpen" />
  <SetupScreen v-if="showSetup" />
</template>
