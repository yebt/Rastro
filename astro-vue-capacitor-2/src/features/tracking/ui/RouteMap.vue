<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, defineAsyncComponent, ref } from "vue";
import { $basemap, reportBasemapError } from "../../../shared/basemap";
import type { TrackPoint } from "../domain/track-point";
import RouteMapLeaflet from "./RouteMapLeaflet.vue";

/**
 * Route map — picks the renderer from the Apariencia → Mapa setting:
 * OpenFreeMap → RouteMapGL (MapLibre, loaded on demand), Esri → RouteMapLeaflet.
 * If the vector map fails to load, it swaps to Esri for this view and records
 * why (shown under the setting).
 */
const RouteMapGL = defineAsyncComponent(() => import("./RouteMapGL.vue"));

defineProps<{ points: TrackPoint[]; fill?: boolean }>();
const emit = defineEmits<{ tap: [] }>();

const basemap = useStore($basemap);
const failed = ref(false);
const useVector = computed(() => basemap.value === "vector" && !failed.value);

const inner = ref<{ recenter: () => void } | null>(null);

function onFailed(reason: string): void {
  reportBasemapError(reason);
  failed.value = true;
}

/** Jump back to the current position (last fix). */
function recenter(): void {
  inner.value?.recenter();
}
defineExpose({ recenter });
</script>

<template>
  <RouteMapGL
    v-if="useVector"
    ref="inner"
    :points="points"
    :fill="fill"
    @tap="emit('tap')"
    @failed="onFailed"
  />
  <RouteMapLeaflet v-else ref="inner" :points="points" :fill="fill" @tap="emit('tap')" />
</template>
