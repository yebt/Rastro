<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { AppIcon } from "../../shared/ui";
import type { PermissionState } from "../geolocation";
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

onMounted(async () => {
  await Promise.all(
    PERMISSIONS.map(async (p) => {
      state[p.id] = await checkPermission(p.id);
    }),
  );
});

async function ask(id: PermissionId): Promise<void> {
  busy[id] = true;
  state[id] = await requestPermission(id);
  busy[id] = false;
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
</style>
