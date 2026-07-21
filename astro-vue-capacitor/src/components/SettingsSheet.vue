<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconArrow from '~icons/lucide/arrow-left';
import IconCheck from '~icons/lucide/check';
import { onMounted, ref } from 'vue';
import { hardwareAvailable } from '../motion/hardware';
import {
  $mapStyle,
  $stepSource,
  MAP_STYLES,
  setMapStyle,
  setStepSource,
  type StepSource,
} from '../stores/settings';
import { closeSettings, openSetup } from '../stores/ui';

function reviewPermissions(): void {
  closeSettings();
  openSetup();
}

const stepSource = useStore($stepSource);
const mapStyle = useStore($mapStyle);
const hwReady = ref<boolean | null>(null);

onMounted(async () => {
  hwReady.value = await hardwareAvailable();
});

const SOURCES: { key: StepSource; label: string; desc: string }[] = [
  {
    key: 'hardware',
    label: 'Contador de hardware',
    desc: 'Sensor de pasos del teléfono. Más preciso y de bajo consumo; cuenta en segundo plano.',
  },
  {
    key: 'accelerometer',
    label: 'Acelerómetro',
    desc: 'Estimación por movimiento. Funciona en cualquier equipo, solo con la pantalla encendida.',
  },
];
</script>

<template>
  <div class="settings">
    <div class="s-top">
      <button class="back" type="button" aria-label="Cerrar" @click="closeSettings"><IconArrow /></button>
      <div class="s-ttl">Configuración</div>
    </div>

    <section class="s-block">
      <h3>Contador de pasos</h3>
      <p class="s-hint">Se elige antes de empezar la actividad, no durante.</p>
      <button
        v-for="s in SOURCES"
        :key="s.key"
        type="button"
        class="opt"
        :class="{ on: stepSource === s.key, disabled: s.key === 'hardware' && hwReady === false }"
        @click="setStepSource(s.key)"
      >
        <div class="opt-body">
          <div class="opt-label">{{ s.label }}</div>
          <div class="opt-desc">{{ s.desc }}</div>
        </div>
        <IconCheck v-if="stepSource === s.key" class="opt-check" />
      </button>
      <p v-if="hwReady === false" class="s-warn">
        Este dispositivo no reporta un contador de hardware; se usará el acelerómetro.
      </p>
    </section>

    <section class="s-block">
      <h3>Permisos</h3>
      <p class="s-hint">Ubicación, notificaciones y actividad física.</p>
      <button type="button" class="opt" @click="reviewPermissions">
        <div class="opt-body">
          <div class="opt-label">Revisar permisos</div>
          <div class="opt-desc">Volvé a ver y conceder los permisos que Rastro necesita.</div>
        </div>
      </button>
    </section>

    <section class="s-block">
      <h3>Mapa</h3>
      <p class="s-hint">Estilo del mapa base (OpenStreetMap y CARTO).</p>
      <div class="map-grid">
        <button
          v-for="m in MAP_STYLES"
          :key="m.id"
          type="button"
          class="map-opt"
          :class="{ on: mapStyle === m.id }"
          @click="setMapStyle(m.id)"
        >
          <span class="map-name">{{ m.label }}</span>
          <IconCheck v-if="mapStyle === m.id" class="opt-check" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: var(--paper);
  max-width: 520px;
  margin: 0 auto;
  overflow-y: auto;
  padding: 0 16px calc(24px + var(--safe-b));
}
.s-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(14px + var(--safe-t)) 2px 10px;
  position: sticky;
  top: 0;
  background: var(--paper);
  z-index: 5;
}
.back {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  color: var(--ink);
  flex: none;
}
.back svg {
  width: 22px;
  height: 22px;
}
.s-ttl {
  font-weight: 600;
  font-size: 18px;
}
.s-block {
  margin-top: 18px;
}
.s-block h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}
.s-hint {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
}
.s-warn {
  font-size: 12px;
  color: var(--muted);
  margin-top: 8px;
}
.opt {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 14px;
  margin-bottom: 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  cursor: pointer;
}
.opt.on {
  border-color: var(--ink);
}
.opt.disabled {
  opacity: 0.55;
}
.opt-body {
  flex: 1;
}
.opt-label {
  font-weight: 600;
  font-size: 15px;
}
.opt-desc {
  font-size: 12px;
  color: var(--muted);
  margin-top: 3px;
  line-height: 1.4;
}
.opt-check {
  width: 22px;
  height: 22px;
  color: var(--green);
  flex: none;
}
.map-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.map-opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
  cursor: pointer;
}
.map-opt.on {
  border-color: var(--ink);
}
</style>
