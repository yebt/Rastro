<script setup lang="ts">
import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { AppButton, AppIcon } from "../../shared/ui";
import { isLocationEnabled, openLocationSettings, type PermissionState } from "../geolocation";
import { checkPermission, PERMISSIONS, type PermissionId, requestPermission } from "./permissions";

/**
 * Renders every registered permission with its live state and an ask button.
 * Self-contained (checks on mount, requests on tap) so both the first-run setup
 * and the settings page reuse it without wiring.
 */

const state = reactive<Record<PermissionId, PermissionState>>({ location: "prompt" });
const busy = reactive<Record<PermissionId, boolean>>({ location: false });

const LABEL: Record<PermissionState, string> = {
  granted: "Concedido",
  denied: "Denegado",
  prompt: "Permitir",
  unsupported: "No aplica",
};

// Location can be granted yet unusable when the OS location toggle is off.
const locationOff = ref(false);
const probing = ref(false);

async function probeLocation(): Promise<void> {
  probing.value = true;
  locationOff.value = !(await isLocationEnabled());
  probing.value = false;
}

/** Open the OS location settings; the resume listener re-probes on return. */
async function activateLocation(): Promise<void> {
  await openLocationSettings();
}

let resumeListener: PluginListenerHandle | null = null;

onMounted(async () => {
  await Promise.all(
    PERMISSIONS.map(async (p) => {
      state[p.id] = await checkPermission(p.id);
    }),
  );
  // Coming back from the settings screen: re-check only while we're waiting for
  // the user to switch the service on, so we don't probe on every app resume.
  resumeListener = await App.addListener("resume", () => {
    if (locationOff.value) void probeLocation();
  });
});

onUnmounted(() => {
  void resumeListener?.remove();
});

async function ask(id: PermissionId): Promise<void> {
  // Re-check live so we never prompt for something already granted.
  const current = await checkPermission(id);
  state[id] = current;
  if (current !== "granted" && current !== "unsupported") {
    busy[id] = true;
    state[id] = await requestPermission(id);
    busy[id] = false;
  }
  // A granted location permission still needs the system service on.
  if (id === "location" && state[id] === "granted") await probeLocation();
}
</script>

<template>
  <div class="perms">
    <div
      v-for="perm in PERMISSIONS"
      :key="perm.id"
      class="perm"
      :class="{ ok: state[perm.id] === 'granted' }"
    >
      <AppIcon :name="perm.icon" size="22px" class="perm-ic" />
      <div class="perm-body">
        <div class="perm-title">{{ perm.title }}</div>
        <p class="perm-why">{{ perm.why }}</p>
      </div>
      <button
        type="button"
        class="perm-chip"
        :class="{ granted: state[perm.id] === 'granted' }"
        :disabled="
          busy[perm.id] || state[perm.id] === 'granted' || state[perm.id] === 'unsupported'
        "
        @click="ask(perm.id)"
      >
        {{ busy[perm.id] ? "…" : LABEL[state[perm.id]] }}
      </button>
    </div>

    <div v-if="locationOff" class="warn">
      <AppIcon name="location" size="20px" class="warn-ic" />
      <div class="warn-body">
        <div class="warn-title">Encendé la ubicación</div>
        <p class="warn-why">
          El permiso está concedido, pero la ubicación del sistema está apagada. Activala para poder
          registrar tus salidas.
        </p>
        <div class="warn-actions">
          <AppButton :disabled="probing" @press="activateLocation">Activar ubicación</AppButton>
          <AppButton variant="ghost" :disabled="probing" @press="probeLocation">Reintentar</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perms {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.perm {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}
.perm.ok {
  border-color: var(--accent);
}
.perm-ic {
  color: var(--ink);
  margin-top: 2px;
}
.perm-body {
  flex: 1;
  min-width: 0;
}
.perm-title {
  font-size: 15px;
  font-weight: 600;
}
.perm-why {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.45;
}
.perm-chip {
  flex: none;
  min-width: 84px;
  height: 36px;
  padding: 0 var(--sp-3);
  border-radius: var(--r-md);
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--bg);
  font-size: 13px;
  font-weight: 600;
}
.perm-chip.granted {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}
.perm-chip:disabled {
  opacity: 0.9;
}
.warn {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-4);
  border: 1px solid var(--danger);
  border-radius: var(--r-lg);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
}
.warn-ic {
  color: var(--danger);
  margin-top: 2px;
}
.warn-body {
  flex: 1;
  min-width: 0;
}
.warn-title {
  font-size: 15px;
  font-weight: 600;
}
.warn-why {
  margin: 3px 0 var(--sp-3);
  font-size: 12px;
  color: var(--muted);
  line-height: 1.45;
}
.warn-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
</style>
