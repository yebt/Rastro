<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { AppButton, AppSubScreen, Card, Label } from "../../shared/ui";
import type { MoveActivity } from "../tracking";
import { shareGallery, type SharedImage } from "./gallery-store";
import { renderRouteCard } from "./route-card";
import { shareImage } from "./share-route";
import {
  DEFAULT_THEME,
  SHARE_GRADIENTS,
  SHARE_LAYOUTS,
  SHARE_PALETTES,
  SHARE_TYPOGRAPHIES,
  type ShareEffect,
  type ShareGradient,
  type ShareTheme,
  themeKey,
  themeLabel,
} from "./themes";

/**
 * Compartir view: pick a theme (layout × palette × typography × background ×
 * effects), preview the card live, then share or save it. Saved cards persist
 * to a gallery below. A photo background stays offline (embedded data URL).
 */
const props = defineProps<{ activity: MoveActivity }>();
const emit = defineEmits<{ back: [] }>();

const theme = ref<ShareTheme>({ ...DEFAULT_THEME, effects: [] });
const preview = ref("");
const gallery = ref<SharedImage[]>([]);
const busy = ref(false);

async function renderPreview(): Promise<void> {
  preview.value = await renderRouteCard(props.activity, theme.value);
}

async function loadGallery(): Promise<void> {
  gallery.value = await shareGallery().list();
}

onMounted(async () => {
  await renderPreview();
  await loadGallery();
});
watch(theme, renderPreview, { deep: true });

function pickLayout(id: string): void {
  theme.value = { ...theme.value, layoutId: id };
}
function pickPalette(id: string): void {
  theme.value = { ...theme.value, paletteId: id };
}
function pickTypography(id: string): void {
  theme.value = { ...theme.value, typographyId: id };
}

const hasPhoto = computed(() => theme.value.background?.kind === "photo");
const photoAuto = computed(
  () => theme.value.background?.kind === "photo" && theme.value.background.adjust === "auto",
);

function onPhoto(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    theme.value = {
      ...theme.value,
      background: { kind: "photo", src: String(reader.result), adjust: "auto" },
    };
  };
  reader.readAsDataURL(file);
}
function clearPhoto(): void {
  theme.value = { ...theme.value, background: { kind: "solid" } };
}
function pickGradient(g: ShareGradient): void {
  theme.value = {
    ...theme.value,
    background: { kind: "gradient", from: g.from, to: g.to, angle: g.angle },
  };
}
const bgKind = computed(() => theme.value.background?.kind ?? "solid");
function toggleAdjust(): void {
  const bg = theme.value.background;
  if (bg?.kind !== "photo") return;
  theme.value = {
    ...theme.value,
    background: { ...bg, adjust: bg.adjust === "auto" ? "manual" : "auto" },
  };
}

const EFFECT_PRESETS: Record<string, { label: string; effect: ShareEffect }> = {
  glow: { label: "Glow", effect: { kind: "routeGlow", blur: 26 } },
  grain: { label: "Grano", effect: { kind: "grain", opacity: 0.06 } },
  blur: { label: "Desenfoque", effect: { kind: "blur", radius: 16 } },
  oscurecer: { label: "Oscurecer", effect: { kind: "exposure", amount: -0.32 } },
  vineta: { label: "Viñeta", effect: { kind: "vignette", strength: 0.55 } },
  duotono: { label: "Duotono", effect: { kind: "duotone", shadow: "#0a0c1f", highlight: "#7b3ff2" } },
  puntos: { label: "Puntos", effect: { kind: "halftone", color: "#ffffff", alpha: 0.1, gap: 26, radius: 3 } },
  sombra: { label: "Sombra", effect: { kind: "textShadow", blur: 14, color: "#000000" } },
};
type EffectName = keyof typeof EFFECT_PRESETS;
const EFFECT_NAMES = Object.keys(EFFECT_PRESETS) as EffectName[];
function hasEffect(name: EffectName): boolean {
  const target = EFFECT_PRESETS[name].effect;
  return (theme.value.effects ?? []).some((e) => e.kind === target.kind);
}
function toggleEffect(name: EffectName): void {
  const target = EFFECT_PRESETS[name].effect;
  const list = theme.value.effects ?? [];
  const next = list.some((e) => e.kind === target.kind)
    ? list.filter((e) => e.kind !== target.kind)
    : [...list, target];
  theme.value = { ...theme.value, effects: next };
}

async function persist(): Promise<void> {
  await shareGallery().add({
    activityId: props.activity.id,
    themeKey: themeKey(theme.value),
    dataUrl: preview.value,
    createdAt: Date.now(),
  });
  await loadGallery();
}

async function onShare(): Promise<void> {
  busy.value = true;
  try {
    await persist();
    await shareImage(preview.value, `rastro-${props.activity.id}`);
  } finally {
    busy.value = false;
  }
}
async function onSave(): Promise<void> {
  busy.value = true;
  try {
    await persist();
  } finally {
    busy.value = false;
  }
}
async function reshare(img: SharedImage): Promise<void> {
  await shareImage(img.dataUrl, `rastro-${img.activityId}`);
}
async function removeImg(img: SharedImage): Promise<void> {
  await shareGallery().remove(img.id);
  await loadGallery();
}

const currentLabel = computed(() => themeLabel(theme.value));
</script>

<template>
  <AppSubScreen title="Compartir" @back="emit('back')">
    <div class="preview">
      <img v-if="preview" :src="preview" alt="Vista previa de la tarjeta" />
    </div>

    <div class="picker">
      <Label>Formato</Label>
      <div class="chips">
        <button
          v-for="l in SHARE_LAYOUTS"
          :key="l.id"
          type="button"
          class="chip"
          :class="{ on: theme.layoutId === l.id }"
          @click="pickLayout(l.id)"
        >
          {{ l.label }}
        </button>
      </div>
    </div>

    <div class="picker">
      <Label>Color · {{ currentLabel }}</Label>
      <div class="swatches">
        <button
          v-for="p in SHARE_PALETTES"
          :key="p.id"
          type="button"
          class="swatch"
          :class="{ on: theme.paletteId === p.id }"
          :style="{ background: p.bg }"
          :aria-label="p.label"
          @click="pickPalette(p.id)"
        >
          <span class="line" :style="{ background: p.route }"></span>
        </button>
      </div>
    </div>

    <div class="picker">
      <Label>Tipografía</Label>
      <div class="chips">
        <button
          v-for="t in SHARE_TYPOGRAPHIES"
          :key="t.id"
          type="button"
          class="chip"
          :class="{ on: (theme.typographyId ?? 'mono') === t.id }"
          @click="pickTypography(t.id)"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div class="picker">
      <Label>Fondo</Label>
      <div class="chips">
        <button type="button" class="chip" :class="{ on: bgKind === 'solid' }" @click="clearPhoto">
          Sólido
        </button>
        <label class="chip file" :class="{ on: hasPhoto }">
          {{ hasPhoto ? "Cambiar foto" : "Foto…" }}
          <input type="file" accept="image/*" @change="onPhoto" />
        </label>
        <button
          v-if="hasPhoto"
          type="button"
          class="chip"
          :class="{ on: photoAuto }"
          @click="toggleAdjust"
        >
          {{ photoAuto ? "Auto color" : "Color manual" }}
        </button>
      </div>
      <div class="swatches">
        <button
          v-for="g in SHARE_GRADIENTS"
          :key="g.id"
          type="button"
          class="swatch grad"
          :style="{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }"
          :aria-label="g.label"
          @click="pickGradient(g)"
        ></button>
      </div>
    </div>

    <div class="picker">
      <Label>Efectos</Label>
      <div class="chips">
        <button
          v-for="name in EFFECT_NAMES"
          :key="name"
          type="button"
          class="chip"
          :class="{ on: hasEffect(name) }"
          @click="toggleEffect(name)"
        >
          {{ EFFECT_PRESETS[name].label }}
        </button>
      </div>
    </div>

    <div class="actions">
      <AppButton size="lg" block variant="ghost" :disabled="busy" @press="onSave">Guardar</AppButton>
      <AppButton size="lg" block icon="export" :disabled="busy" @press="onShare">Compartir</AppButton>
    </div>

    <template v-if="gallery.length">
      <Label>Compartidos</Label>
      <div class="gallery">
        <Card v-for="img in gallery" :key="img.id" class="g-item">
          <button type="button" class="g-thumb" @click="reshare(img)">
            <img :src="img.dataUrl" :alt="`Tarjeta ${img.themeKey}`" />
          </button>
          <button type="button" class="g-rm" aria-label="Borrar" @click="removeImg(img)">×</button>
        </Card>
      </div>
    </template>
  </AppSubScreen>
</template>

<style scoped>
.preview {
  display: flex;
  justify-content: center;
}
.preview img {
  max-width: 100%;
  max-height: 46vh;
  border-radius: var(--r-lg);
  border: 1px solid var(--line);
}
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.chips {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}
.chip {
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}
.chip.on {
  border-color: var(--ink);
  color: var(--ink);
  background: var(--surface-2);
}
.chip.file {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.chip.file input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.swatches {
  display: flex;
  gap: var(--sp-3);
  flex-wrap: wrap;
}
.swatch {
  width: 52px;
  height: 52px;
  border-radius: var(--r-md);
  border: 2px solid var(--line);
  display: grid;
  place-items: center;
}
.swatch.on {
  border-color: var(--accent);
}
.swatch .line {
  width: 26px;
  height: 5px;
  border-radius: 999px;
}
.actions {
  display: flex;
  gap: var(--sp-3);
}
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-3);
}
.g-item {
  position: relative;
  padding: var(--sp-2);
}
.g-thumb {
  display: block;
  width: 100%;
}
.g-thumb img {
  width: 100%;
  border-radius: var(--r-sm);
  display: block;
}
.g-rm {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: var(--bg);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 18px;
  line-height: 1;
  display: grid;
  place-items: center;
}
</style>
