<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted, watch } from "vue";
import { useBackHandler } from "../shell/useBackHandler";
import ActivityDetail from "./ActivityDetail.vue";
import { $openActivityId, closeActivity } from "./detail.store";
import { $activities, $loaded, loadActivities } from "./history.store";

/**
 * Global activity-detail overlay. Whatever opened it (history row, calendar, or
 * a just-finished run) sets $openActivityId; this resolves the record and shows
 * the same detail everywhere, with back closing it.
 */
const openId = useStore($openActivityId);
const activities = useStore($activities);
const loaded = useStore($loaded);

onMounted(() => {
  if (!loaded.value) void loadActivities();
});

const activity = computed(() => activities.value.find((a) => a.id === openId.value) ?? null);

// A just-finished activity may not be in the store yet — reload to resolve it.
watch(openId, (id) => {
  if (id && !activities.value.some((a) => a.id === id)) void loadActivities();
});

useBackHandler(
  computed(() => openId.value !== null),
  closeActivity,
);
</script>

<template>
  <div v-if="openId" class="detail-host">
    <ActivityDetail v-if="activity" :activity="activity" @back="closeActivity" />
  </div>
</template>

<style scoped>
.detail-host {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--bg);
  overflow-y: auto;
}
</style>
