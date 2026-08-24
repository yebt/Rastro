<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed } from "vue";
import { AppButton, AppIcon } from "../../shared/ui";
import { distanceMeters } from "../tracking/domain/metrics";
import { distanceParts, formatDuration } from "../tracking/ui/format";
import { MOVE_LABEL } from "../tracking/ui/labels";
import { $draft, discardDraft, resumeDraft, saveDraft } from "./recovery.store";

/**
 * Recovery prompt for an autosaved, unfinished session. Shows a quick summary of
 * what was already tracked and the three exits — resume, save as is, discard —
 * so nothing is ever lost silently after a crash or force-close.
 */
const draft = useStore($draft);

const type = computed(() => draft.value?.type ?? "walk");
const title = computed(() => (draft.value ? MOVE_LABEL[draft.value.type] : ""));
const points = computed(() => draft.value?.points ?? []);
const distance = computed(() => distanceParts(distanceMeters(points.value)));
const duration = computed(() => {
  const p = points.value;
  return formatDuration(p.length > 1 ? p.at(-1)!.t - p[0]!.t : 0);
});
const when = computed(() => {
  if (!draft.value) return "";
  return new Date(draft.value.startedAt).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
});
</script>

<template>
  <div v-if="draft" class="sheet-backdrop">
    <div class="sheet" role="alertdialog" aria-label="Sesión sin terminar">
      <div class="sheet-head">
        <AppIcon :name="type" size="22px" class="head-ic" />
        <div>
          <div class="sheet-title">Sesión sin terminar</div>
          <div class="sheet-when">{{ title }} · {{ when }}</div>
        </div>
      </div>

      <p class="sheet-text">
        Se cerró la app antes de finalizar, pero guardamos lo que llevabas. ¿Qué querés hacer?
      </p>

      <div class="recap">
        <div class="tile">
          <b>{{ distance.value }}</b><small>{{ distance.unit }}</small>
        </div>
        <div class="tile"><b>{{ duration }}</b><small>tiempo</small></div>
        <div class="tile"><b>{{ points.length }}</b><small>puntos</small></div>
      </div>

      <div class="sheet-actions">
        <AppButton size="lg" block icon="play" @press="resumeDraft()">Retomar</AppButton>
        <AppButton size="lg" block variant="ghost" icon="check" @press="saveDraft()">
          Guardar así
        </AppButton>
        <AppButton size="lg" block variant="ghost" icon="trash" @press="discardDraft()">
          Descartar
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: flex;
  align-items: flex-end;
  background: color-mix(in srgb, black 55%, transparent);
  padding: var(--sp-4);
  padding-bottom: calc(var(--safe-b) + var(--sp-4));
  backdrop-filter: blur(2px);
}
.sheet {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
}
.sheet-head {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.head-ic {
  color: var(--accent);
}
.sheet-title {
  font-family: var(--font-cond);
  font-size: 22px;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 1.1;
}
.sheet-when {
  font-size: 12px;
  color: var(--muted);
  text-transform: capitalize;
}
.sheet-text {
  margin: var(--sp-3) 0 var(--sp-4);
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
.recap {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--sp-2);
  margin-bottom: var(--sp-5);
  padding: var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--bg) 40%, transparent);
}
.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  text-align: center;
}
.tile b {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.tile small {
  font-size: 10px;
  color: var(--muted);
}
.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
</style>
