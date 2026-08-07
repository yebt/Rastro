<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { AppSubScreen, Label, SegmentedControl } from "../../../shared/ui";
import { ACCENTS } from "../accent";
import { $accent, setAccent } from "../accent.store";
import { $theme, setTheme, type Theme } from "../settings.store";

defineEmits<{ back: [] }>();

const theme = useStore($theme);
const accent = useStore($accent);

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
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
      </div>
      <p class="note">Contraste garantizado en claro y oscuro.</p>
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
.swatch .dot {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--sw);
}
</style>
