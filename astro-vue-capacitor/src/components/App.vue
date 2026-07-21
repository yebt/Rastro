<script setup lang="ts">
import { App as CapApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useStore } from '@nanostores/vue';
import IconMapPin from '~icons/lucide/map-pin';
import IconSettings from '~icons/lucide/settings';
import { onMounted, onUnmounted } from 'vue';
import { loadActivities } from '../stores/activities';
import {
  $activeTab,
  $detailId,
  $settingsOpen,
  closeDetail,
  closeSettings,
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
import Toast from './Toast.vue';
import TrackerTab from './TrackerTab.vue';

const tab = useStore($activeTab);
const detailId = useStore($detailId);
const settingsOpen = useStore($settingsOpen);

let backHandle: PluginListenerHandle | null = null;

/**
 * Android hardware back: dismiss overlays, then fall back to the home tab,
 * and only leave (minimize — keeps a running track alive) from home.
 */
async function registerBackButton(): Promise<void> {
  backHandle = await CapApp.addListener('backButton', () => {
    if ($settingsOpen.get()) return closeSettings();
    if ($detailId.get()) return closeDetail();
    if ($activeTab.get() !== 'track') return setTab('track');
    void CapApp.minimizeApp();
  });
}

onMounted(() => {
  void loadActivities();
  void registerBackButton();
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
        <small>tus km · tus dominadas</small>
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
</template>
