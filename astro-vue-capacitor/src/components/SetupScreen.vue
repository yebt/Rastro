<script setup lang="ts">
import IconMapPin from '~icons/lucide/map-pin';
import IconBell from '~icons/lucide/bell';
import IconFootprints from '~icons/lucide/footprints';
import IconCheck from '~icons/lucide/check';
import { onMounted, reactive } from 'vue';
import { checkPermission, type PermKey, type PermState, requestPermission } from '../permissions';
import { completeSetup } from '../stores/settings';
import { closeSetup } from '../stores/ui';

const ITEMS: { key: PermKey; icon: unknown; title: string; why: string }[] = [
  {
    key: 'location',
    icon: IconMapPin,
    title: 'Ubicación',
    why: 'Para registrar tu ruta con GPS. Para que siga con la pantalla apagada, elegí "Permitir siempre".',
  },
  {
    key: 'notifications',
    icon: IconBell,
    title: 'Notificaciones',
    why: 'Para mostrar el aviso de "registrando" mientras el GPS trabaja en segundo plano.',
  },
  {
    key: 'activity',
    icon: IconFootprints,
    title: 'Actividad física',
    why: 'Para contar tus pasos con el sensor de hardware del teléfono (más preciso, menos batería).',
  },
];

const states = reactive<Record<PermKey, PermState>>({
  location: 'prompt',
  notifications: 'prompt',
  activity: 'prompt',
});
const busy = reactive<Record<PermKey, boolean>>({
  location: false,
  notifications: false,
  activity: false,
});

onMounted(async () => {
  const results = await Promise.all(ITEMS.map((it) => checkPermission(it.key)));
  ITEMS.forEach((it, i) => {
    states[it.key] = results[i]!;
  });
});

async function ask(key: PermKey): Promise<void> {
  busy[key] = true;
  states[key] = await requestPermission(key);
  busy[key] = false;
}

function finish(): void {
  completeSetup();
  closeSetup();
}

const LABEL: Record<PermState, string> = {
  granted: 'Concedido',
  denied: 'Denegado',
  prompt: 'Permitir',
  unsupported: 'No aplica',
};
</script>

<template>
  <div class="setup">
    <div class="setup-inner">
      <div class="hero">
        <div class="hero-badge"><IconMapPin /></div>
        <h1>Permisos</h1>
        <p>Rastro funciona en tu dispositivo, sin cuenta. Para registrar bien tus salidas necesita estos permisos. Podés concederlos ahora o después desde Configuración.</p>
      </div>

      <div class="perm-list">
        <div v-for="it in ITEMS" :key="it.key" class="perm" :class="{ ok: states[it.key] === 'granted' }">
          <component :is="it.icon" class="perm-icon" />
          <div class="perm-body">
            <div class="perm-title">{{ it.title }}</div>
            <div class="perm-why">{{ it.why }}</div>
            <div v-if="states[it.key] === 'denied'" class="perm-denied">
              Denegado. Podés habilitarlo desde los ajustes del sistema.
            </div>
          </div>
          <button
            v-if="states[it.key] === 'granted'"
            class="perm-chip ok"
            type="button"
            disabled
          >
            <IconCheck />
          </button>
          <button
            v-else
            class="perm-chip"
            type="button"
            :disabled="busy[it.key] || states[it.key] === 'unsupported'"
            @click="ask(it.key)"
          >
            {{ busy[it.key] ? '…' : LABEL[states[it.key]] }}
          </button>
        </div>
      </div>

      <button class="btn-start" type="button" @click="finish">Empezar a usar Rastro</button>
    </div>
  </div>
</template>

<style scoped>
.setup {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: var(--paper);
  overflow-y: auto;
}
.setup-inner {
  max-width: 520px;
  margin: 0 auto;
  padding: calc(28px + var(--safe-t)) 22px calc(24px + var(--safe-b));
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.hero {
  text-align: center;
  margin-bottom: 24px;
}
.hero-badge {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--ink);
  color: var(--paper);
  display: grid;
  place-items: center;
  margin: 0 auto 14px;
}
.hero-badge svg {
  width: 30px;
  height: 30px;
}
.hero h1 {
  font-family: var(--cond);
  font-size: 28px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.hero p {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
  margin-top: 8px;
}
.perm-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.perm {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
}
.perm.ok {
  border-color: var(--green);
}
.perm-icon {
  width: 26px;
  height: 26px;
  color: var(--ink);
  flex: none;
  margin-top: 2px;
}
.perm-body {
  flex: 1;
}
.perm-title {
  font-weight: 600;
  font-size: 15px;
}
.perm-why {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.45;
  margin-top: 3px;
}
.perm-denied {
  font-size: 11px;
  color: #d4491f;
  margin-top: 6px;
}
.perm-chip {
  flex: none;
  min-width: 82px;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.perm-chip:disabled {
  cursor: default;
}
.perm-chip.ok {
  min-width: 36px;
  background: var(--green);
  border-color: var(--green);
}
.perm-chip.ok svg {
  width: 18px;
  height: 18px;
}
.btn-start {
  margin-top: 28px;
  height: 52px;
  border-radius: 14px;
  background: var(--ink);
  color: var(--paper);
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}
</style>
