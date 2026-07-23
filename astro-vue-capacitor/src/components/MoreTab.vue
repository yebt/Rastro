<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconCheck from '~icons/lucide/check';
import IconDownload from '~icons/lucide/download';
import IconEraser from '~icons/lucide/eraser';
import IconShare from '~icons/lucide/share-2';
import IconShield from '~icons/lucide/shield';
import IconTrash from '~icons/lucide/trash-2';
import IconUpload from '~icons/lucide/upload';
import { onMounted, ref } from 'vue';
import { cleanOldBackups, saveBackup, shareBackup } from '../backup';
import { type Accent, ACCENT_ORDER, ACCENTS } from '../lib/accent';
import { backupStamp } from '../lib/date';
import type { ImportMode } from '../lib/db';
import { hardwareAvailable } from '../motion/hardware';
import { $activities, clearAllActivities, importActivities } from '../stores/activities';
import {
  $accent,
  $mapStyle,
  $name,
  $stepSource,
  $theme,
  MAP_STYLES,
  setAccent,
  setMapStyle,
  setName,
  setStepSource,
  setTheme,
  type StepSource,
  type Theme,
} from '../stores/settings';
import { openSetup, showToast } from '../stores/ui';

defineProps<{ active: boolean }>();

const theme = useStore($theme);
const accent = useStore($accent);
const stepSource = useStore($stepSource);
const mapStyle = useStore($mapStyle);
const activities = useStore($activities);
const name = useStore($name);
const hwReady = ref<boolean | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  hwReady.value = await hardwareAvailable();
});

const THEMES: { key: Theme; label: string }[] = [
  { key: 'auto', label: 'Auto' },
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
];

const ACCENT_LABELS: Record<Accent, string> = {
  green: 'Verde',
  orange: 'Naranja',
  purple: 'Violeta',
  blue: 'Azul',
  mono: 'Monocromo',
};
const accentSwatch = (a: Accent): string => ACCENTS[a].light.accent;
const accentSwatchInk = (a: Accent): string => ACCENTS[a].light.contrast;

const SOURCES: { key: StepSource; label: string; desc: string }[] = [
  {
    key: 'hardware',
    label: 'Contador de hardware',
    desc: 'Sensor de pasos del teléfono. Más preciso y de bajo consumo.',
  },
  {
    key: 'accelerometer',
    label: 'Acelerómetro',
    desc: 'Estimación por movimiento. Funciona en cualquier equipo.',
  },
];

function onName(event: Event): void {
  setName((event.target as HTMLInputElement).value);
}

// ---- Backup / data (same lib calls as the old Datos tab) ----
function backupJson(): { json: string; filename: string } {
  const payload = {
    app: 'Rastro',
    version: 1,
    exportedAt: new Date().toISOString(),
    units: 'km',
    activities: activities.value,
  };
  return {
    json: JSON.stringify(payload, null, 2),
    filename: `rastro-${backupStamp(Date.now())}.json`,
  };
}

async function saveCopy(): Promise<void> {
  const { json, filename } = backupJson();
  try {
    const where = await saveBackup(json, filename);
    showToast(where ? `Copia guardada en ${where}` : 'No se pudo guardar la copia');
  } catch {
    showToast('No se pudo guardar la copia');
  }
}

async function shareCopy(): Promise<void> {
  const { json, filename } = backupJson();
  try {
    if (await shareBackup(json, filename)) showToast('Respaldo compartido');
  } catch {
    showToast('No se pudo compartir el respaldo');
  }
}

async function cleanBackups(): Promise<void> {
  if (!globalThis.confirm('Conserva solo la copia más reciente en Documentos/Rastro.\n\n¿Seguir?')) {
    return;
  }
  const deleted = await cleanOldBackups(1);
  if (deleted < 0) showToast('Disponible solo en la app');
  else showToast(deleted ? `Se borraron ${deleted} copias viejas` : 'No había copias viejas');
}

function pickFile(): void {
  fileInput.value?.click();
}

async function onFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const data: unknown = JSON.parse(await file.text());
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
  if (!globalThis.confirm('Esto borra TODOS tus datos de este dispositivo y no se puede deshacer.\n\n¿Seguro?')) {
    return;
  }
  if (!globalThis.confirm('Última confirmación: ¿borrar todo?')) return;
  await clearAllActivities();
  showToast('Todos los datos fueron borrados');
}
</script>

<template>
  <section class="screen more" :class="{ active }">
    <div class="lbl grp">Perfil</div>
    <label class="field">
      <span class="field-lbl">Tu nombre</span>
      <input
        type="text"
        :value="name"
        placeholder="Opcional"
        autocomplete="name"
        @input="onName"
      />
    </label>

    <div class="lbl grp">Apariencia</div>
    <div class="seg3">
      <button v-for="t in THEMES" :key="t.key" type="button" :class="{ on: theme === t.key }" @click="setTheme(t.key)">
        {{ t.label }}
      </button>
    </div>
    <div class="accent-grid">
      <button
        v-for="a in ACCENT_ORDER"
        :key="a"
        type="button"
        class="accent-opt"
        :class="{ on: accent === a }"
        :aria-label="ACCENT_LABELS[a]"
        :aria-pressed="accent === a"
        @click="setAccent(a)"
      >
        <span class="accent-swatch" :style="{ background: accentSwatch(a) }">
          <IconCheck v-if="accent === a" class="accent-check" :style="{ color: accentSwatchInk(a) }" />
        </span>
        <span class="accent-name">{{ ACCENT_LABELS[a] }}</span>
      </button>
    </div>

    <div class="lbl grp">Contador de pasos</div>
    <div class="hlist">
      <button
        v-for="s in SOURCES"
        :key="s.key"
        type="button"
        class="hrow"
        :class="{ dim: s.key === 'hardware' && hwReady === false }"
        @click="setStepSource(s.key)"
      >
        <div class="hbody">
          {{ s.label }}
          <div class="hsub">{{ s.desc }}</div>
        </div>
        <IconCheck v-if="stepSource === s.key" class="hchev on-check" />
      </button>
    </div>

    <div class="lbl grp">Mapa</div>
    <div class="hlist">
      <button
        v-for="m in MAP_STYLES"
        :key="m.id"
        type="button"
        class="hrow"
        @click="setMapStyle(m.id)"
      >
        <div class="hbody">{{ m.label }}</div>
        <IconCheck v-if="mapStyle === m.id" class="hchev on-check" />
      </button>
    </div>

    <div class="lbl grp">Permisos</div>
    <div class="hlist">
      <button type="button" class="hrow" @click="openSetup">
        <IconShield />
        <div class="hbody">
          Revisar permisos
          <div class="hsub">Ubicación, notificaciones y actividad física.</div>
        </div>
      </button>
    </div>

    <div class="lbl grp">Datos</div>
    <div class="hlist">
      <button type="button" class="hrow" @click="saveCopy">
        <IconDownload />
        <div class="hbody">Guardar copia<div class="hsub">Un archivo .json en el dispositivo</div></div>
      </button>
      <button type="button" class="hrow" @click="shareCopy">
        <IconShare />
        <div class="hbody">Compartir respaldo<div class="hsub">Enviar a otra app (Drive, correo…)</div></div>
      </button>
      <button type="button" class="hrow" @click="cleanBackups">
        <IconEraser />
        <div class="hbody">Limpiar copias viejas<div class="hsub">Conserva la más reciente</div></div>
      </button>
      <button type="button" class="hrow" @click="pickFile">
        <IconUpload />
        <div class="hbody">Importar datos<div class="hsub">Restaurar desde un .json exportado</div></div>
      </button>
    </div>
    <input ref="fileInput" type="file" accept=".json,application/json" style="display: none" @change="onFile" />

    <div class="lbl grp">Zona de riesgo</div>
    <div class="hlist">
      <button type="button" class="hrow danger" @click="clearAll">
        <IconTrash />
        <div class="hbody">Borrar todo<div class="hsub">Elimina todos los datos de este dispositivo</div></div>
      </button>
    </div>

    <div class="foot">Local-first · sin cuenta · v2.0</div>
  </section>
</template>

<style scoped>
.grp {
  margin: 24px 0 10px;
}
.field {
  display: block;
}
.field-lbl {
  display: block;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  background: var(--surface);
  color: var(--ink);
  font-size: 15px;
}
.field input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
.seg3 {
  display: flex;
  gap: 6px;
  padding: 4px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  margin-bottom: 14px;
}
.seg3 button {
  flex: 1;
  padding: 10px;
  border-radius: var(--r-1);
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}
.seg3 button.on {
  background: var(--ink);
  color: var(--paper);
}
.accent-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.accent-opt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
}
.accent-swatch {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 2px solid var(--line);
}
.accent-opt.on .accent-swatch {
  border-color: var(--ink);
}
.accent-check {
  width: 20px;
  height: 20px;
}
.accent-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}
.accent-opt.on .accent-name {
  color: var(--ink);
}
.hrow.dim {
  opacity: 0.55;
}
.hrow.danger,
.hrow.danger > svg {
  color: var(--red);
}
.hchev.on-check {
  color: var(--accent);
}
.foot {
  margin: 28px 0 8px;
  text-align: center;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
}
</style>
