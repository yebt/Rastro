<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { AppSubScreen, Card, Label, SegmentedControl } from "../../../shared/ui";
import { $theme, setTheme, type Theme } from "../settings.store";

defineEmits<{ back: [] }>();

const theme = useStore($theme);

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
      <Card>
        <p class="soon">Próximamente — con contraste garantizado en claro y oscuro.</p>
      </Card>
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
.soon {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
</style>
