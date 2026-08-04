<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { AppSubScreen, Label, SegmentedControl } from "../../../shared/ui";
import { $countdown, COUNTDOWN_OPTIONS, setCountdown } from "../../tracking";
import PermissionList from "../../permissions/PermissionList.vue";

defineEmits<{ back: [] }>();

const countdown = useStore($countdown);
const options = COUNTDOWN_OPTIONS.map((s) => ({ value: s, label: s === 0 ? "Sin" : `${s}s` }));
</script>

<template>
  <AppSubScreen title="Registro" @back="$emit('back')">
    <div class="block">
      <Label>Cuenta atrás antes de iniciar</Label>
      <SegmentedControl :options="options" :model-value="countdown" @update:model-value="setCountdown" />
      <p class="note">Un margen para guardar el teléfono antes de que arranque el conteo.</p>
    </div>

    <Label>Permisos</Label>
    <PermissionList />
  </AppSubScreen>
</template>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
}
.note {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
</style>
