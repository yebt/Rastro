<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, ref } from "vue";
import { AppButton, AppIcon } from "../../shared/ui";
import { addWeight, setHeight, setName } from "../profile/profile.store";
import { $setupStep, completeSetup, nextStep, prevStep, SETUP_STEPS } from "./setup.store";
import IdentityStep from "./steps/IdentityStep.vue";
import MeasuresStep from "./steps/MeasuresStep.vue";
import PermissionsStep from "./steps/PermissionsStep.vue";

/**
 * First-run wizard. Owns the form state (props down to each step, events up) and
 * the step chrome; steps stay presentational. Nothing here blocks finishing —
 * only permissions matter, and even those can be granted later from settings.
 */
const step = useStore($setupStep);

const name = ref("");
const weight = ref("");
const height = ref("");

const first = computed(() => step.value === 0);
const last = computed(() => step.value === SETUP_STEPS.length - 1);

// The name (step 1) is required — can't advance past it while empty.
const canAdvance = computed(() => step.value !== 1 || name.value.trim().length > 0);

function finish(): void {
  const trimmed = name.value.trim();
  if (trimmed) setName(trimmed);

  const h = Number(height.value);
  if (Number.isFinite(h) && h > 0) setHeight(h);

  const w = Number(weight.value.replace(",", "."));
  if (Number.isFinite(w) && w > 0) addWeight(w, Date.now());

  completeSetup();
}
</script>

<template>
  <div class="setup">
    <div class="inner">
      <div
        class="progress"
        role="progressbar"
        :aria-valuenow="step + 1"
        :aria-valuemax="SETUP_STEPS.length"
      >
        <span v-for="(_, i) in SETUP_STEPS" :key="i" class="bar" :class="{ on: i <= step }" />
      </div>

      <div class="content">
        <PermissionsStep v-if="step === 0" />
        <IdentityStep v-else-if="step === 1" v-model:name="name" />
        <MeasuresStep v-else v-model:weight="weight" v-model:height="height" />
      </div>

      <div class="nav">
        <button v-if="!first" type="button" class="back" @click="prevStep()">
          <AppIcon name="back" size="20px" /> Atrás
        </button>
        <div class="spacer" />
        <AppButton v-if="!last" size="lg" :disabled="!canAdvance" @press="nextStep()">
          Siguiente
        </AppButton>
        <AppButton v-else size="lg" @press="finish">Empezar</AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: var(--bg);
}
.inner {
  max-width: 520px;
  height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: calc(var(--safe-t) + var(--sp-5)) var(--sp-5) calc(var(--safe-b) + var(--sp-4));
}
.progress {
  display: flex;
  gap: 6px;
  margin-bottom: var(--sp-5);
}
.bar {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: var(--line);
  transition: background 0.2s ease;
}
.bar.on {
  background: var(--accent);
}
.content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.nav {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding-top: var(--sp-4);
}
.spacer {
  flex: 1;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 52px;
  padding: 0 var(--sp-2);
  color: var(--muted);
  font-size: 15px;
  font-weight: 600;
}
</style>
