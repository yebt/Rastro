<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed } from "vue";
import { $settingsPage, closeSettingsPage, openSettingsPage } from "./settings.nav";
import SettingsMenu from "./SettingsMenu.vue";
import AboutSettings from "./pages/AboutSettings.vue";
import AppearanceSettings from "./pages/AppearanceSettings.vue";
import DataSettings from "./pages/DataSettings.vue";
import ProfileSettings from "./pages/ProfileSettings.vue";
import RecordingSettings from "./pages/RecordingSettings.vue";

/**
 * The "Más" tab root. A shallow menu → page stack driven by the settings store:
 * the menu lists categories, each opening its own dedicated page. New categories
 * are added in settings.nav.ts + a page component here, nothing else.
 */
const page = useStore($settingsPage);

const PAGES = {
  profile: ProfileSettings,
  appearance: AppearanceSettings,
  recording: RecordingSettings,
  data: DataSettings,
  about: AboutSettings,
};

const currentPage = computed(() => (page.value ? PAGES[page.value] : null));
</script>

<template>
  <SettingsMenu v-if="currentPage === null" @open="openSettingsPage" />
  <component :is="currentPage" v-else :key="page" @back="closeSettingsPage" />
</template>
