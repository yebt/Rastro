<script setup lang="ts">
import IconX from '~icons/lucide/x';
import IconShare from '~icons/lucide/share-2';
import IconDownload from '~icons/lucide/download';
import { computed, onMounted, ref, watch } from 'vue';
import { backupStamp } from '../lib/date';
import type { GpsActivity } from '../lib/types';
import { saveImage, shareImage } from '../share';
import { composeMapCard, drawShareCard, SHARE_THEMES, type ShareTheme } from '../shareCard';
import { showToast } from '../stores/ui';

const props = defineProps<{ activity: GpsActivity }>();
const emit = defineEmits<{ close: [] }>();

const SIZE = 1080;
const canvas = ref<HTMLCanvasElement | null>(null);
const theme = ref<ShareTheme>(SHARE_THEMES[0]!);
const busy = ref(false);
const online = ref(globalThis.navigator?.onLine !== false);

// The Mapa theme needs internet; hide it offline.
const themes = computed(() => SHARE_THEMES.filter((t) => !t.requiresOnline || online.value));

let renderToken = 0;

async function render(): Promise<void> {
  const el = canvas.value;
  if (!el) return;
  const ctx = el.getContext('2d');
  if (!ctx) return;
  await document.fonts.ready.catch(() => undefined);
  const token = ++renderToken;
  const t = theme.value;

  if (t.requiresOnline) {
    busy.value = true;
    try {
      const { renderRouteMap } = await import('../routeMap');
      const result = await renderRouteMap(props.activity.route, SIZE);
      if (token !== renderToken) return; // theme changed while rendering
      if (result instanceof HTMLCanvasElement) {
        composeMapCard(ctx, SIZE, props.activity, result, t);
      } else {
        showToast(`No se pudo generar el mapa: ${result.error}`);
        theme.value = SHARE_THEMES[0]!;
      }
    } finally {
      if (token === renderToken) busy.value = false;
    }
    return;
  }

  drawShareCard(ctx, SIZE, props.activity, t);
}

onMounted(render);
watch(theme, render);

function filename(): string {
  return `rastro-ruta-${backupStamp(Date.now())}.png`;
}

async function onShare(): Promise<void> {
  if (!canvas.value || busy.value) return;
  busy.value = true;
  try {
    const done = await shareImage(canvas.value.toDataURL('image/png'), filename());
    if (done) showToast('Ruta compartida');
  } catch {
    showToast('No se pudo compartir');
  } finally {
    busy.value = false;
  }
}

async function onSave(): Promise<void> {
  if (!canvas.value || busy.value) return;
  busy.value = true;
  try {
    const where = await saveImage(canvas.value.toDataURL('image/png'), filename());
    showToast(where ? `Imagen guardada en ${where}` : 'No se pudo guardar');
  } catch {
    showToast('No se pudo guardar');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="share">
    <div class="share-top">
      <div class="share-ttl">Compartir ruta</div>
      <button class="close" type="button" aria-label="Cerrar" @click="emit('close')"><IconX /></button>
    </div>

    <div class="preview">
      <canvas ref="canvas" :width="SIZE" :height="SIZE"></canvas>
      <div v-if="busy" class="preview-busy">Generando mapa…</div>
    </div>

    <div class="themes">
      <button
        v-for="t in themes"
        :key="t.id"
        type="button"
        class="theme-chip"
        :class="{ on: theme.id === t.id }"
        @click="theme = t"
      >{{ t.label }}</button>
    </div>

    <div class="share-actions">
      <button class="btn ghost" type="button" :disabled="busy" @click="onSave">
        <IconDownload /> Guardar
      </button>
      <button class="btn primary" type="button" :disabled="busy" @click="onShare">
        <IconShare /> Compartir
      </button>
    </div>
  </div>
</template>

<style scoped>
.share {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: var(--paper);
  max-width: 520px;
  margin: 0 auto;
  overflow-y: auto;
  padding: 0 16px calc(20px + var(--safe-b));
  display: flex;
  flex-direction: column;
}
.share-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(14px + var(--safe-t)) 2px 12px;
  position: sticky;
  top: 0;
  background: var(--paper);
}
.share-ttl {
  font-weight: 600;
  font-size: 18px;
}
.close {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  color: var(--ink);
}
.close svg {
  width: 22px;
  height: 22px;
}
.preview {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--line);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.preview canvas {
  display: block;
  width: 100%;
  height: auto;
}
.preview-busy {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
.themes {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.theme-chip {
  padding: 8px 16px;
  border-radius: 20px;
  background: var(--soft);
  border: 1px solid var(--line);
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
}
.theme-chip.on {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}
.share-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.share-actions .btn {
  flex: 1;
  height: 52px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}
.share-actions .btn svg {
  width: 20px;
  height: 20px;
}
.btn.primary {
  background: var(--ink);
  color: var(--paper);
  border: none;
}
.btn.ghost {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
}
.btn:disabled {
  opacity: 0.5;
}
</style>
