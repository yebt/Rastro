<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed } from "vue";
import { AppIcon, AppScreen, Card, Row, RowGroup } from "../../shared/ui";
import { $name, $nickname } from "../profile/profile.store";
import { SETTINGS_CATEGORIES, type SettingsPage } from "./settings.nav";

const emit = defineEmits<{ open: [page: SettingsPage] }>();

const name = useStore($name);
const nickname = useStore($nickname);

const displayName = computed(() => nickname.value || name.value);
const initial = computed(() => displayName.value.trim().charAt(0).toUpperCase() || "·");
</script>

<template>
  <AppScreen title="Más">
    <Card>
      <button type="button" class="identity" @click="emit('open', 'profile')">
        <span class="badge">{{ initial }}</span>
        <span class="id-text">
          <b v-if="displayName">{{ displayName }}</b>
          <b v-else class="id-empty">Configurá tu perfil</b>
          <small>Local · sin cuenta</small>
        </span>
        <AppIcon name="chevron" size="16px" class="id-chev" />
      </button>
    </Card>

    <RowGroup>
      <Row
        v-for="cat in SETTINGS_CATEGORIES"
        :key="cat.id"
        :icon="cat.icon"
        :label="cat.label"
        :value="cat.hint"
        @press="emit('open', cat.id)"
      />
    </RowGroup>
  </AppScreen>
</template>

<style scoped>
.identity {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  text-align: left;
  color: var(--ink);
}
.badge {
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-2);
  display: grid;
  place-items: center;
  font-size: 19px;
  font-weight: 600;
}
.id-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.id-text b {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.id-empty {
  color: var(--muted);
}
.id-text small {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin-top: 2px;
}
.id-chev {
  margin-left: auto;
  color: var(--faint);
}
</style>
