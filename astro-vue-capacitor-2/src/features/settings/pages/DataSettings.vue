<script setup lang="ts">
import { ref } from "vue";
import { AppSubScreen, Label, Row, RowGroup } from "../../../shared/ui";
import { activityRepository } from "../../tracking";

defineEmits<{ back: [] }>();

const cleared = ref(false);

async function clearAll(): Promise<void> {
  const ok = globalThis.confirm?.("¿Borrar todas las actividades? No se puede deshacer.");
  if (!ok) return;
  await activityRepository().clear();
  cleared.value = true;
}
</script>

<template>
  <AppSubScreen title="Datos" @back="$emit('back')">
    <Label>Tus datos viven en este dispositivo</Label>
    <RowGroup>
      <Row
        icon="export"
        label="Exportar"
        value="Próximamente"
        :chevron="false"
        :interactive="false"
      />
      <Row
        icon="import"
        label="Importar"
        value="Próximamente"
        :chevron="false"
        :interactive="false"
      />
    </RowGroup>
    <RowGroup>
      <Row
        icon="trash"
        :label="cleared ? 'Actividades borradas' : 'Borrar actividades'"
        :chevron="false"
        @press="clearAll"
      />
    </RowGroup>
  </AppSubScreen>
</template>
