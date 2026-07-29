<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, ref } from "vue";
import { AppButton, AppSubScreen, Card, Field, Label } from "../../../shared/ui";
import {
  $heightCm,
  $name,
  $weights,
  addWeight,
  removeWeight,
  setHeight,
  setName,
  updateWeight,
} from "../../profile/profile.store";

defineEmits<{ back: [] }>();

const weights = useStore($weights);

// Local input mirrors; committed to the store on change / action.
const name = ref($name.get());
const height = ref($heightCm.get() === null ? "" : String($heightCm.get()));
const weightDraft = ref("");

// Most recent first — the top row is the current weight.
const history = computed(() => [...weights.value].reverse());

const dateFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function commitName(value: string): void {
  name.value = value;
  setName(value.trim());
}

function commitHeight(value: string): void {
  height.value = value;
  const n = Number(value);
  setHeight(value.trim() && Number.isFinite(n) && n > 0 ? n : null);
}

function parseKg(value: string): number | null {
  const kg = Number(value.replace(",", "."));
  return Number.isFinite(kg) && kg > 0 ? kg : null;
}

function registerWeight(): void {
  const kg = parseKg(weightDraft.value);
  if (kg === null) return;
  addWeight(kg, Date.now());
  weightDraft.value = "";
}

function editWeight(t: number, value: string): void {
  const kg = parseKg(value);
  if (kg !== null) updateWeight(t, kg);
}
</script>

<template>
  <AppSubScreen title="Perfil" @back="$emit('back')">
    <Card>
      <div class="stack">
        <Field
          :model-value="name"
          label="Nombre o apodo"
          placeholder="Cómo te dicen"
          autocomplete="name"
          @update:model-value="commitName"
        />
        <Field
          :model-value="height"
          label="Altura (cm)"
          type="number"
          inputmode="numeric"
          placeholder="175"
          @update:model-value="commitHeight"
        />
        <Field
          v-model="weightDraft"
          label="Registrar peso (kg)"
          type="number"
          inputmode="decimal"
          placeholder="Nueva medición"
          @keyup.enter="registerWeight"
        >
          <template #action>
            <AppButton icon="plus" square aria-label="Registrar peso" @press="registerWeight" />
          </template>
        </Field>
      </div>
    </Card>

    <template v-if="history.length">
      <Label>Historial de peso</Label>
      <Card>
        <div class="stack">
          <Field
            v-for="w in history"
            :key="w.t"
            :model-value="String(w.kg)"
            :label="dateFmt.format(w.t)"
            type="number"
            inputmode="decimal"
            @update:model-value="editWeight(w.t, $event)"
          >
            <template #action>
              <AppButton
                icon="trash"
                square
                variant="ghost"
                aria-label="Borrar medición"
                @press="removeWeight(w.t)"
              />
            </template>
          </Field>
        </div>
      </Card>
      <Label>Tocá un valor para corregirlo. El más reciente es tu peso actual.</Label>
    </template>
  </AppSubScreen>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
</style>
