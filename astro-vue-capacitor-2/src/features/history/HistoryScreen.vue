<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted, ref } from "vue";
import { AppSubScreen, Card } from "../../shared/ui";
import type { MoveActivity } from "../tracking";
import ActivityDetail from "./ActivityDetail.vue";
import ActivityRow from "./ActivityRow.vue";
import { $activities, loadActivities } from "./history.store";

/** Full activity history, newest first. */
defineEmits<{ back: [] }>();

const activities = useStore($activities);
const selectedId = ref<string | null>(null);

onMounted(() => {
  void loadActivities();
});

const moves = computed(() => activities.value.filter((a): a is MoveActivity => a.kind === "move"));
const selected = computed(() => moves.value.find((a) => a.id === selectedId.value) ?? null);
</script>

<template>
  <ActivityDetail v-if="selected" :activity="selected" @back="selectedId = null" />

  <AppSubScreen v-else title="Historial" @back="$emit('back')">
    <Card>
      <div v-if="moves.length" class="list">
        <ActivityRow v-for="a in moves" :key="a.id" :activity="a" @open="selectedId = a.id" />
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
