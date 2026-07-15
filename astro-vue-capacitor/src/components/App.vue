<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconMapPin from '~icons/lucide/map-pin';
import { onMounted } from 'vue';
import { loadActivities } from '../stores/activities';
import { $activeTab } from '../stores/ui';
import BottomNav from './BottomNav.vue';
import DatosTab from './DatosTab.vue';
import DominadasTab from './DominadasTab.vue';
import HistorialTab from './HistorialTab.vue';
import Toast from './Toast.vue';
import TrackerTab from './TrackerTab.vue';

const tab = useStore($activeTab);

onMounted(() => {
  void loadActivities();
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
</template>
