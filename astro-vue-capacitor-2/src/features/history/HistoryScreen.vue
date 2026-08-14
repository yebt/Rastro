<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted } from "vue";
import { AppSubScreen, Card } from "../../shared/ui";
import { recordActivityIds } from "../tracking";
import ActivityRow from "./ActivityRow.vue";
import { openActivity } from "./detail.store";
import { $activities, loadActivities } from "./history.store";

/** Full activity history, newest first. Detail opens in the global overlay. */
defineEmits<{ back: [] }>();

const activities = useStore($activities);
const records = computed(() => recordActivityIds(activities.value));

onMounted(() => {
  void loadActivities();
});
</script>

<template>
  <AppSubScreen title="Historial" @back="$emit('back')">
    <Card>
      <div v-if="activities.length" class="list">
        <ActivityRow
          v-for="a in activities"
          :key="a.id"
          :activity="a"
          :record="records.has(a.id)"
          @open="openActivity(a.id)"
        />
      </div>
      <p v-else class="empty">Todavía no registraste ninguna actividad.</p>
    </Card>
  </AppSubScreen>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
}
.empty {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
</style>
