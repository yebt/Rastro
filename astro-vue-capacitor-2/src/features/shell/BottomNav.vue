<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { AppIcon } from "../../shared/ui";
import { $activeTab, setTab, TABS, type TabId } from "./nav.store";

/**
 * Fixed bottom tab bar. Reads the active tab from the shell store and writes
 * back through setTab — the store is the single source of truth, both this bar
 * and AppRoot derive from it.
 */
const active = useStore($activeTab);

function select(id: TabId): void {
  setTab(id);
}
</script>

<template>
  <nav class="nav" aria-label="Navegación principal">
    <button
      v-for="tab in TABS"
      :key="tab.id"
      type="button"
      class="tab"
      :class="{ on: active === tab.id }"
      :aria-current="active === tab.id ? 'page' : undefined"
      @click="select(tab.id)"
    >
      <AppIcon :name="tab.icon" size="21px" />
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.nav {
  flex: none;
  height: var(--nav-h);
  padding-bottom: var(--safe-b);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--line);
  background: var(--bg);
}
.tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--faint);
  min-width: 0;
}
.tab-label {
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.tab.on {
  color: var(--accent);
}
.tab.on::before {
  content: "";
  position: absolute;
  top: -1px;
  width: 22px;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
}
</style>
