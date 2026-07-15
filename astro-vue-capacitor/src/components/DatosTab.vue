<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconDownload from '~icons/lucide/download';
import IconTrash from '~icons/lucide/trash-2';
import IconUpload from '~icons/lucide/upload';
import { ref } from 'vue';
import { dayKey } from '../lib/date';
import type { ImportMode } from '../lib/db';
import {
  $activities,
  $summary,
  clearAllActivities,
  importActivities,
} from '../stores/activities';
import { showToast } from '../stores/ui';

defineProps<{ active: boolean }>();

const activities = useStore($activities);
const summary = useStore($summary);
const fileInput = ref<HTMLInputElement | null>(null);

function exportData(): void {
  const payload = {
    app: 'Rastro',
    version: 1,
    exportedAt: new Date().toISOString(),
    units: 'km',
    activities: activities.value,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rastro-${dayKey(Date.now())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Archivo exportado');
}

function pickFile(): void {
  fileInput.value?.click();
}

async function onFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data: unknown = JSON.parse(text);
    let mode: ImportMode = 'merge';
    if (activities.value.length) {
      mode = globalThis.confirm(
        'Ya tenés datos.\n\nAceptar = combinar con lo existente\nCancelar = reemplazar todo',
      )
        ? 'merge'
        : 'replace';
    }
    const added = await importActivities(data, mode);
    showToast(`Importadas ${added} actividades`);
  } catch {
    showToast('Archivo inválido. Usá uno exportado desde Rastro.');
  } finally {
    input.value = '';
  }
}

async function clearAll(): Promise<void> {
  if (!globalThis.confirm('Esto borra TODOS tus datos de este dispositivo y no se puede deshacer.\n\n¿Seguro?')) return;
  if (!globalThis.confirm('Última confirmación: ¿borrar todo?')) return;
  await clearAllActivities();
  showToast('Todos los datos fueron borrados');
}
</script>

<template>
  <section class="screen" :class="{ active }">
    <div class="section-h" style="margin-top: 12px">Respaldo</div>
    <button class="dbtn" @click="exportData">
      <IconDownload />
      <div><b>Exportar datos</b><div class="sub">Descarga un archivo .json con todo tu historial</div></div>
    </button>
    <button class="dbtn" @click="pickFile">
      <IconUpload />
      <div><b>Importar datos</b><div class="sub">Restaura desde un archivo .json exportado</div></div>
    </button>
    <input ref="fileInput" type="file" accept=".json,application/json" style="display: none" @change="onFile" />

    <div class="section-h">Resumen guardado</div>
    <div class="card" style="margin-top: 6px">
      <div style="display: flex; gap: 22px">
        <div>
          <div class="k" style="font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 600">Actividades</div>
          <div class="num" style="font-size: 34px; font-weight: 700">{{ summary.count }}</div>
        </div>
        <div>
          <div class="k" style="font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 600">Km totales</div>
          <div class="num" style="font-size: 34px; font-weight: 700">{{ summary.km.toFixed(1) }}</div>
        </div>
        <div>
          <div class="k" style="font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 600">Dominadas</div>
          <div class="num" style="font-size: 34px; font-weight: 700">{{ summary.pullups }}</div>
        </div>
      </div>
    </div>

    <div class="section-h">Zona de riesgo</div>
    <button class="dbtn danger" @click="clearAll">
      <IconTrash />
      <div><b>Borrar todo</b><div class="sub">Elimina todos los datos de este dispositivo</div></div>
    </button>
    <p class="hint" style="margin-top: 20px">
      Todo se guarda solo en este dispositivo, sin cuenta ni servidores. Hacé un respaldo de vez en cuando.
    </p>
  </section>
</template>
