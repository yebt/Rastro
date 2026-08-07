<script setup lang="ts">
import { onMounted, ref } from "vue";
import { AppButton, AppSubScreen } from "../../shared/ui";
import { shareGallery, type SharedImage } from "./gallery-store";
import { shareImage } from "./share-route";

/** Gallery of previously saved/shared cards — its own space. Tap re-shares,
 *  long-press opens it large, × removes it. */
defineEmits<{ back: [] }>();

const items = ref<SharedImage[]>([]);
async function load(): Promise<void> {
  items.value = await shareGallery().list();
}
onMounted(load);

const zoomed = ref<SharedImage | null>(null);
const longFired = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

function pressStart(img: SharedImage): void {
  longFired.value = false;
  timer = setTimeout(() => {
    longFired.value = true;
    zoomed.value = img; // long-press → view large
  }, 450);
}
function pressEnd(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
function onTap(img: SharedImage): void {
  if (longFired.value) {
    longFired.value = false;
    return; // was a long-press, not a tap
  }
  void reshare(img);
}

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
    <p v-if="items.length" class="tip">Tocá para compartir · mantené presionado para ver en grande.</p>
    <div v-if="items.length" class="grid">
      <div v-for="img in items" :key="img.id" class="item">
        <button
          type="button"
          class="thumb"
          @pointerdown="pressStart(img)"
          @pointerup="pressEnd"
          @pointerleave="pressEnd"
          @pointercancel="pressEnd"
          @click="onTap(img)"
        >
          <img :src="img.dataUrl" :alt="`Tarjeta ${img.themeKey}`" />
        </button>
        <button type="button" class="rm" aria-label="Borrar" @click="remove(img)">×</button>
      </div>
    </div>
    <p v-else class="empty">Todavía no guardaste ni compartiste ninguna tarjeta.</p>

    <div v-if="zoomed" class="lightbox" @click="zoomed = null">
      <img :src="zoomed.dataUrl" alt="Tarjeta ampliada" />
      <div class="lb-actions" @click.stop>
        <AppButton icon="export" @press="reshare(zoomed)">Compartir</AppButton>
        <AppButton variant="ghost" @press="zoomed = null">Cerrar</AppButton>
      </div>
    </div>
  </AppSubScreen>
</template>

<style scoped>
.tip {
  margin: 0 0 var(--sp-3);
  font-size: 12px;
  color: var(--muted);
}
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
  -webkit-touch-callout: none;
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
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-4);
  padding: var(--sp-5);
  background: color-mix(in srgb, black 82%, transparent);
  backdrop-filter: blur(4px);
}
.lightbox img {
  max-width: 100%;
  max-height: 74vh;
  border-radius: var(--r-lg);
}
.lb-actions {
  display: flex;
  gap: var(--sp-3);
}
</style>
