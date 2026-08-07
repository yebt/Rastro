<script setup lang="ts">
import { ref } from "vue";
import { AppSubScreen, Label, Row, RowGroup, Spinner } from "../../../shared/ui";
import { activityRepository } from "../../tracking";
import {
  applyBackup,
  buildBackup,
  cleanOldBackups,
  type ImportMode,
  parseBackup,
  saveBackupFile,
  serializeBackup,
  shareBackupFile,
} from "../../data/backup";
import { loadActivities } from "../../history/history.store";

defineEmits<{ back: [] }>();

const busy = ref(false);
const busyMsg = ref("");
const result = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
const pendingMode = ref<ImportMode>("merge");

async function run(msg: string, fn: () => Promise<string>): Promise<void> {
  busy.value = true;
  busyMsg.value = msg;
  result.value = "";
  try {
    result.value = await fn();
  } catch (e) {
    result.value = `Error: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    busy.value = false;
  }
}

function onExport(): void {
  void run("Exportando…", async () => {
    const { json, filename } = serializeBackup(await buildBackup(Date.now()));
    const where = await saveBackupFile(json, filename);
    await cleanOldBackups(5);
    return where ? `Respaldo guardado en ${where}` : "No se pudo guardar el respaldo";
  });
}

function onShare(): void {
  void run("Preparando…", async () => {
    const { json, filename } = serializeBackup(await buildBackup(Date.now()));
    const shared = await shareBackupFile(json, filename);
    return shared ? "Respaldo compartido" : "Compartir cancelado";
  });
}

function startImport(mode: ImportMode): void {
  pendingMode.value = mode;
  result.value = "";
  fileInput.value?.click();
}

function onFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ""; // allow re-picking the same file
  if (!file) return;

  const mode = pendingMode.value;
  if (mode === "replace") {
    const ok = globalThis.confirm?.(
      "Reemplazar TODOS tus datos con los del respaldo? Se borra lo actual. No se puede deshacer.",
    );
    if (!ok) return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    void run(mode === "replace" ? "Reemplazando…" : "Combinando…", async () => {
      const payload = parseBackup(String(reader.result));
      const { added } = await applyBackup(payload, mode);
      return mode === "replace"
        ? `Datos reemplazados · ${payload.activities.length} actividades`
        : `${added} actividades nuevas importadas`;
    });
  };
  reader.readAsText(file);
}

async function clearAll(): Promise<void> {
  const ok = globalThis.confirm?.("¿Borrar todas las actividades? No se puede deshacer.");
  if (!ok) return;
  await run("Borrando…", async () => {
    await activityRepository().clear();
    await loadActivities();
    return "Actividades borradas";
  });
}
</script>

<template>
  <AppSubScreen title="Datos" @back="$emit('back')">
    <Label>Respaldá tus datos en un archivo para no perderlos</Label>

    <RowGroup>
      <Row icon="export" label="Exportar respaldo" :chevron="false" :interactive="!busy" @press="onExport" />
      <Row icon="export" label="Compartir respaldo" :chevron="false" :interactive="!busy" @press="onShare" />
    </RowGroup>

    <Label>Importar</Label>
    <RowGroup>
      <Row
        icon="import"
        label="Combinar respaldo"
        value="Suma lo que falte"
        :chevron="false"
        :interactive="!busy"
        @press="startImport('merge')"
      />
      <Row
        icon="import"
        label="Reemplazar con respaldo"
        value="Borra y restaura"
        :chevron="false"
        :interactive="!busy"
        @press="startImport('replace')"
      />
    </RowGroup>

    <div v-if="busy" class="status"><Spinner /> <span>{{ busyMsg }}</span></div>
    <p v-else-if="result" class="result">{{ result }}</p>

    <RowGroup>
      <Row icon="trash" label="Borrar actividades" :chevron="false" :interactive="!busy" @press="clearAll" />
    </RowGroup>

    <input
      ref="fileInput"
      type="file"
      accept="application/json,.json"
      class="hidden-file"
      @change="onFile"
    />
  </AppSubScreen>
</template>

<style scoped>
.status {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: 13px;
  color: var(--muted);
  padding: var(--sp-2) 0;
}
.result {
  font-size: 13px;
  color: var(--accent);
  margin: var(--sp-2) 0 0;
}
.hidden-file {
  display: none;
}
</style>
