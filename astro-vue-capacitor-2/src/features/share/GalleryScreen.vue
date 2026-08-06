<script setup lang="ts">
import { onMounted, ref } from "vue";
import { AppSubScreen } from "../../shared/ui";
import { shareGallery, type SharedImage } from "./gallery-store";
import { shareImage } from "./share-route";

/** Gallery of previously saved/shared cards — its own space, not stuck under
 *  the share editor. Tap a card to re-share it; × removes it. */
defineEmits<{ back: [] }>();

const items = ref<SharedImage[]>([]);
async function load(): Promise<void> {
  items.value = await shareGallery().list();
}
onMounted(load);

async function reshare(img: SharedImage): Promise<void> {
  await shareImage(img.dataUrl, `rastro-${img.activityId}`);
}
async function remove(img: SharedImage): Promise<void> {
  await shareGallery().remove(img.id);
  await load();
}
</script>

<template>
  <AppSubScreen title="Compartidos" @back="$emit('back')">
    <div v-if="items.length" class="grid">
      <div v-for="img in items" :key="img.id" class="item">
        <button type="button" class="thumb" @click="reshare(img)">
          <img :src="img.dataUrl" :alt="`Tarjeta ${img.themeKey}`" />
        </button>
        <button type="button" class="rm" aria-label="Borrar" @click="remove(img)">×</button>
      </div>
    </div>
    <p v-else class="empty">Todavía no guardaste ni compartiste ninguna tarjeta.</p>
  </AppSubScreen>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-3);
}
.item {
  position: relative;
}
.thumb {
  display: block;
  width: 100%;
}
.thumb img {
  width: 100%;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  display: block;
}
.rm {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  border: 1px solid var(--line);
  color: var(--ink);
  font-size: 20px;
  line-height: 1;
  display: grid;
  place-items: center;
  backdrop-filter: blur(6px);
}
.empty {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
</style>
