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
// If it's still missing after the reload (deleted, or a stale id), close rather
// than leave an empty overlay covering the app.
watch(openId, async (id) => {
  if (!id || activities.value.some((a) => a.id === id)) return;
  await loadActivities();
  if ($openActivityId.get() === id && !$activities.get().some((a) => a.id === id)) closeActivity();
});
// The record that was open vanished from the list (e.g. deleted) → close.
watch(activity, (a, prev) => {
  if (!a && prev && prev.id === openId.value) closeActivity();
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
