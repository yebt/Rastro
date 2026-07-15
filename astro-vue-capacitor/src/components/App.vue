<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconMapPin from '~icons/lucide/map-pin';
import { onMounted } from 'vue';
import { loadActivities } from '../stores/activities';
import { $activeTab, $detailId } from '../stores/ui';
import ActivityDetail from './ActivityDetail.vue';
import BottomNav from './BottomNav.vue';
import DatosTab from './DatosTab.vue';
import DominadasTab from './DominadasTab.vue';
import HistorialTab from './HistorialTab.vue';
import Toast from './Toast.vue';
import TrackerTab from './TrackerTab.vue';

const tab = useStore($activeTab);
const detailId = useStore($detailId);

onMounted(() => {
  void loadActivities();
  if (import.meta.env.DEV) {
    // Dev-only tracking diagnostics (heartbeat + suspension detector) in eruda.
    void import('../debug/trackerDiagnostics').then((m) => m.initTrackerDiagnostics());
  }
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
    </div>

    <TrackerTab :active="tab === 'track'" />
    <DominadasTab :active="tab === 'pull'" />
    <HistorialTab :active="tab === 'hist'" />
    <DatosTab :active="tab === 'data'" />
  </div>

  <BottomNav />
  <Toast />

  <ActivityDetail v-if="detailId" :id="detailId" />
</template>
