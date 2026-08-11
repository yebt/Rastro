<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, onMounted, ref, watch } from "vue";
import { AppButton, AppIcon, Label, Spinner } from "../../shared/ui";
import { cleanTrack, type MoveActivity } from "../tracking";
import { $favorites, addFavorite, removeFavorite } from "./favorites.store";
import { shareGallery } from "./gallery-store";
import MapEditor from "./MapEditor.vue";
import { renderRouteCard } from "./route-card";
import { shareImage } from "./share-route";
import {
  DEFAULT_THEME,
  getLayout,
  getPalette,
  type MapCamera,
  MAP_STYLES,
  MARKERS,
  type MapStyleId,
  type MarkerStyle,
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
 * Compartir editor: a fixed live preview and pinned actions, with the theme
 * controls grouped into tabs whose panel is the only thing that scrolls. A map
 * background is framed in a full interactive editor (MapEditor).
 */
const props = defineProps<{ activity: MoveActivity }>();
const emit = defineEmits<{ back: [] }>();

const theme = ref<ShareTheme>({ ...DEFAULT_THEME, effects: [] });
const preview = ref("");
const busy = ref(false);
const previewing = ref(false);
let renderToken = 0;

async function renderPreview(): Promise<void> {
  const token = ++renderToken;
  previewing.value = true;
  try {
    const url = await renderRouteCard(props.activity, theme.value);
    if (token === renderToken) preview.value = url;
  } finally {
    if (token === renderToken) previewing.value = false;
  }
}
onMounted(renderPreview);
watch(theme, renderPreview, { deep: true });

// ---- Tabs ----
type Tab = "formato" | "color" | "texto" | "fondo" | "efectos" | "favoritos";
const tab = ref<Tab>("formato");
const TABS: { id: Tab; label: string }[] = [
  { id: "formato", label: "Formato" },
  { id: "color", label: "Color" },
  { id: "texto", label: "Texto" },
  { id: "fondo", label: "Fondo" },
  { id: "efectos", label: "Efectos" },
  { id: "favoritos", label: "Favoritos" },
];

// ---- Favorites ----
const favorites = useStore($favorites);
function saveFavorite(): void {
  addFavorite(theme.value);
}
function applyFavorite(fav: ShareTheme): void {
  // Keep the current per-activity background (photo/map) unless the favorite has one.
  theme.value = { ...fav };
}

// ---- Manual route color override ----
const routeColor = computed(() => theme.value.override?.route ?? getPalette(theme.value.paletteId).route);
function setRouteColor(hex: string): void {
  theme.value = { ...theme.value, override: { ...theme.value.override, route: hex } };
}
function clearOverride(): void {
  theme.value = { ...theme.value, override: undefined };
}
const hasOverride = computed(() => !!theme.value.override?.route);

// ---- Basic pickers ----
function pickLayout(id: string): void {
  theme.value = { ...theme.value, layoutId: id };
}
function pickPalette(id: string): void {
  theme.value = { ...theme.value, paletteId: id };
}
function pickTypography(id: string): void {
  theme.value = { ...theme.value, typographyId: id };
}
function pickMarker(id: MarkerStyle): void {
  theme.value = { ...theme.value, marker: id };
}
const currentLabel = computed(() => themeLabel(theme.value));

// ---- Background ----
const bgKind = computed(() => theme.value.background?.kind ?? "solid");
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
function setSolid(): void {
  theme.value = { ...theme.value, background: { kind: "solid" } };
}
function toggleAdjust(): void {
  const bg = theme.value.background;
  if (bg?.kind !== "photo") return;
  theme.value = { ...theme.value, background: { ...bg, adjust: bg.adjust === "auto" ? "manual" : "auto" } };
}
function pickGradient(g: ShareGradient): void {
  theme.value = { ...theme.value, background: { kind: "gradient", from: g.from, to: g.to, angle: g.angle } };
}

// ---- Map editor ----
const editingMap = ref(false);
const editingStyle = ref<MapStyleId>("voyager");
const isMap = computed(() => theme.value.background?.kind === "map");
function currentMapStyle(): MapStyleId | null {
  const bg = theme.value.background;
  return bg?.kind === "map" ? bg.style : null;
}
const editorCamera = computed(() =>
  theme.value.background?.kind === "map" ? theme.value.background.camera : null,
);
const layout = computed(() => getLayout(theme.value.layoutId));
const palette = computed(() => getPalette(theme.value.paletteId));
const editorPoints = computed(() => cleanTrack(props.activity.points));

function openMapEditor(style: MapStyleId): void {
  editingStyle.value = style;
  editingMap.value = true;
}
function onMapDone(payload: { src: string; camera: MapCamera }): void {
  theme.value = {
    ...theme.value,
    background: { kind: "map", style: editingStyle.value, src: payload.src, camera: payload.camera },
  };
  editingMap.value = false;
}

// ---- Effects ----
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

// ---- Save / share ----
async function persist(): Promise<void> {
  await shareGallery().add({
    activityId: props.activity.id,
    themeKey: themeKey(theme.value),
    dataUrl: preview.value,
    createdAt: Date.now(),
  });
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
</script>

<template>
  <section class="share">
    <header class="head">
      <button type="button" class="back" aria-label="Volver" @click="emit('back')">
        <AppIcon name="back" size="22px" />
      </button>
      <h1 class="title">Compartir</h1>
    </header>

    <div class="preview">
      <img v-if="preview" :src="preview" alt="Vista previa de la tarjeta" />
      <div v-if="previewing" class="prev-busy"><Spinner size="26px" /></div>
    </div>

    <nav class="tabs">
      <button
        v-for="t in TABS"
        :key="t.id"
        type="button"
        class="tab"
        :class="{ on: tab === t.id }"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </nav>

    <div class="panel">
      <!-- Formato -->
      <div v-if="tab === 'formato'" class="group">
        <Label>Layout</Label>
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
        <Label>Marcador de meta</Label>
        <div class="chips">
          <button
            v-for="m in MARKERS"
            :key="m.id"
            type="button"
            class="chip"
            :class="{ on: (theme.marker ?? 'dot') === m.id }"
            @click="pickMarker(m.id)"
          >
            {{ m.label }}
          </button>
        </div>
      </div>

      <!-- Color -->
      <div v-else-if="tab === 'color'" class="group">
        <Label>{{ currentLabel }}</Label>
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

        <Label>Color de ruta</Label>
        <div class="rowline">
          <label class="colorpick" :style="{ background: routeColor }">
            <input type="color" :value="routeColor" @input="setRouteColor(($event.target as HTMLInputElement).value)" />
          </label>
          <span class="hex">{{ routeColor }}</span>
          <button v-if="hasOverride" type="button" class="chip" @click="clearOverride">Usar paleta</button>
        </div>
      </div>

      <!-- Texto -->
      <div v-else-if="tab === 'texto'" class="chips">
        <button
          v-for="ty in SHARE_TYPOGRAPHIES"
          :key="ty.id"
          type="button"
          class="chip"
          :class="{ on: (theme.typographyId ?? 'mono') === ty.id }"
          @click="pickTypography(ty.id)"
        >
          {{ ty.label }}
        </button>
      </div>

      <!-- Fondo -->
      <div v-else-if="tab === 'fondo'" class="group">
        <div class="chips">
          <button type="button" class="chip" :class="{ on: bgKind === 'solid' }" @click="setSolid">Sólido</button>
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

        <Label>Gradiente</Label>
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

        <Label>Mapa</Label>
        <div class="chips">
          <button
            v-for="m in MAP_STYLES"
            :key="m.id"
            type="button"
            class="chip"
            :class="{ on: currentMapStyle() === m.id }"
            @click="openMapEditor(m.id)"
          >
            {{ m.label }}
          </button>
          <button v-if="isMap" type="button" class="chip on-accent" @click="openMapEditor(currentMapStyle()!)">
            Ajustar encuadre
          </button>
        </div>
        <p class="hint">El mapa se encuadra a mano (mover, zoom, rotar, inclinar). Usa datos en línea.</p>
      </div>

      <!-- Efectos -->
      <div v-else-if="tab === 'efectos'" class="chips">
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

      <!-- Favoritos -->
      <div v-else class="group">
        <AppButton block variant="ghost" icon="plus" @press="saveFavorite">Guardar tema actual</AppButton>
        <div v-if="favorites.length" class="favs">
          <div v-for="(f, i) in favorites" :key="i" class="favitem">
            <button type="button" class="chip fav" @click="applyFavorite(f)">{{ themeLabel(f) }}</button>
            <button type="button" class="fav-x" aria-label="Quitar" @click="removeFavorite(i)">×</button>
          </div>
        </div>
        <p v-else class="hint">Guardá tu combinación (formato, color, efectos) para reusarla en otra tarjeta.</p>
      </div>
    </div>

    <div class="actions">
      <AppButton size="lg" block variant="ghost" :disabled="busy" @press="onSave">Guardar</AppButton>
      <AppButton size="lg" block icon="export" :disabled="busy" @press="onShare">Compartir</AppButton>
    </div>
  </section>

  <MapEditor
    v-if="editingMap"
    :points="editorPoints"
    :map-style="editingStyle"
    :aspect-w="layout.w"
    :aspect-h="layout.h"
    :route-color="palette.route"
    :start-color="palette.startDot"
    :end-color="palette.endDot"
    :camera="editorCamera"
    @done="onMapDone"
    @cancel="editingMap = false"
  />
</template>

<style scoped>
.share {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: calc(var(--safe-t) + var(--sp-3)) var(--sp-4) calc(var(--safe-b) + var(--sp-3));
  gap: var(--sp-3);
}
.head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex: none;
}
.back {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-left: -8px;
  border-radius: var(--r-md);
  color: var(--ink);
}
.back:active {
  background: var(--surface-2);
}
.title {
  margin: 0;
  font-family: var(--font-cond);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}
.preview {
  flex: none;
  position: relative;
  display: flex;
  justify-content: center;
}
.preview img {
  max-width: 100%;
  max-height: 38vh;
  border-radius: var(--r-lg);
  border: 1px solid var(--line);
}
.prev-busy {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  border-radius: var(--r-lg);
}
.tabs {
  flex: none;
  display: flex;
  gap: var(--sp-2);
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}
.tabs::-webkit-scrollbar {
  display: none;
}
.tab {
  flex: none;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-pill);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}
.tab.on {
  border-color: var(--ink);
  color: var(--ink);
  background: var(--surface-2);
}
.panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.group {
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
.chip.on-accent {
  border-color: var(--accent);
  color: var(--accent);
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
  width: 48px;
  height: 48px;
  border-radius: var(--r-md);
  border: 2px solid var(--line);
  display: grid;
  place-items: center;
}
.swatch.on {
  border-color: var(--accent);
}
.swatch .line {
  width: 24px;
  height: 5px;
  border-radius: 999px;
}
.hint {
  margin: var(--sp-1) 0 0;
  font-size: 12px;
  color: var(--muted);
}
.rowline {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.colorpick {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: var(--r-md);
  border: 2px solid var(--line);
  overflow: hidden;
  flex: none;
}
.colorpick input {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  opacity: 0;
  cursor: pointer;
}
.hex {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
}
.favs {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.favitem {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.fav {
  flex: 1;
  text-align: left;
}
.fav-x {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 18px;
  display: grid;
  place-items: center;
}
.actions {
  flex: none;
  display: flex;
  gap: var(--sp-3);
}
</style>
