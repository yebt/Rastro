<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { $basemap, $basemapError, type BasemapProvider, setBasemap } from "../../../shared/basemap";
import { ref } from "vue";
import { AppSubScreen, ColorSheet, Label, SegmentedControl } from "../../../shared/ui";
import { ACCENTS } from "../accent";
import { $accent, $accentCustom, resolveAccent, setAccent, setCustomAccent } from "../accent.store";
import { $theme, setTheme, type Theme } from "../settings.store";

defineEmits<{ back: [] }>();

const theme = useStore($theme);
const accent = useStore($accent);
const accentCustom = useStore($accentCustom);
const customOpen = ref(false);
const ACCENT_PRESETS = ACCENTS.map((a) => a.dark.accent);
const basemap = useStore($basemap);
const basemapError = useStore($basemapError);

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

const BASEMAP_OPTIONS: { value: BasemapProvider; label: string }[] = [
  { value: "vector", label: "OpenFreeMap" },
  { value: "esri", label: "Esri" },
];
</script>

<template>
  <AppSubScreen title="Apariencia" @back="$emit('back')">
    <div class="block">
      <Label>Tema</Label>
      <SegmentedControl
        :options="THEME_OPTIONS"
        :model-value="theme"
        @update:model-value="setTheme"
      />
      <p class="note">Auto sigue la preferencia del sistema.</p>
    </div>

    <div class="block">
      <Label>Color de acento</Label>
      <div class="swatches">
        <button
          v-for="a in ACCENTS"
          :key="a.id"
          type="button"
          class="swatch"
          :class="{ on: accent === a.id }"
          :style="{ '--sw': a.dark.accent }"
          :aria-label="a.label"
          :aria-pressed="accent === a.id"
          @click="setAccent(a.id)"
        >
          <span class="dot"></span>
        </button>
        <button
          type="button"
          class="swatch custom"
          :class="{ on: accent === 'custom' }"
          :style="accent === 'custom' ? { '--sw': resolveAccent('custom').dark.accent } : {}"
          aria-label="Color personalizado"
          :aria-pressed="accent === 'custom'"
          @click="customOpen = true"
        >
          <span class="dot"></span>
        </button>
      </div>
      <ColorSheet
        :open="customOpen"
        :model-value="accentCustom"
        title="Color de acento"
        :presets="ACCENT_PRESETS"
        note="Se ajusta el brillo para que los textos sobre el color se lean bien en claro y oscuro."
        @update:model-value="setCustomAccent"
        @close="customOpen = false"
      />
      <p class="note">Contraste garantizado en claro y oscuro.</p>
    </div>

    <div class="block">
      <Label>Mapa</Label>
      <SegmentedControl
        :options="BASEMAP_OPTIONS"
        :model-value="basemap"
        @update:model-value="setBasemap"
      />
      <p class="note">
        OpenFreeMap: nítido, con nombres de calles. Esri: más liviano, para teléfonos
        lentos. También cambia los mapas al compartir.
      </p>
      <p v-if="basemap === 'vector' && basemapError" class="note warn">
        El mapa vectorial no cargó y se usó Esri. Motivo: {{ basemapError }}
      </p>
    </div>
  </AppSubScreen>
</template>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.note {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
.note.warn {
  color: var(--danger);
}
.swatches {
  display: flex;
  gap: var(--sp-3);
  flex-wrap: wrap;
}
.swatch {
  width: 44px;
  height: 44px;
  border-radius: var(--r-md);
  border: 2px solid var(--line);
  display: grid;
  place-items: center;
}
.swatch.on {
  border-color: var(--ink);
}
.swatch.custom .dot {
  background: conic-gradient(#f44, #fd4, #4d6, #4cf, #64f, #f4c, #f44);
}
.swatch.custom.on .dot {
  background: var(--sw);
  box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px transparent;
}
.swatch .dot {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--sw);
}
</style>
