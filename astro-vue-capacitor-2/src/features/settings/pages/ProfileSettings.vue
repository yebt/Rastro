<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, ref } from "vue";
import { AppButton, AppSubScreen, Card, Field, Label } from "../../../shared/ui";
import {
  $heightCm,
  $name,
  $nickname,
  $weights,
  addWeight,
  setHeight,
  setName,
  setNickname,
} from "../../profile/profile.store";

defineEmits<{ back: [] }>();

const weights = useStore($weights);

// Local input mirrors; committed to the store on change / action.
const name = ref($name.get());
const nickname = ref($nickname.get());
const height = ref($heightCm.get() === null ? "" : String($heightCm.get()));
const weightDraft = ref("");

const latest = computed<number | null>(() => {
  const list = weights.value;
  return list.length ? list[list.length - 1]!.kg : null;
});

function commitName(value: string): void {
  name.value = value;
  setName(value.trim());
}

function commitNickname(value: string): void {
  nickname.value = value;
  setNickname(value.trim());
}

function commitHeight(value: string): void {
  height.value = value;
  const n = Number(value);
  setHeight(value.trim() && Number.isFinite(n) && n > 0 ? n : null);
}

function registerWeight(): void {
  const kg = Number(weightDraft.value.replace(",", "."));
  if (!Number.isFinite(kg) || kg <= 0) return;
  addWeight(kg, Date.now());
  weightDraft.value = "";
}
</script>

<template>
  <AppSubScreen title="Perfil" @back="$emit('back')">
    <Card>
      <div class="stack">
        <Field
          :model-value="name"
          label="Nombre"
          placeholder="Tu nombre"
          autocomplete="name"
          @update:model-value="commitName"
        />
        <Field
          :model-value="nickname"
          label="Apodo"
          placeholder="Cómo te dicen"
          @update:model-value="commitNickname"
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
          label="Peso (kg)"
          type="number"
          inputmode="decimal"
          placeholder="Registrar nuevo"
          :hint="latest !== null ? `actual ${latest} kg` : undefined"
          @keyup.enter="registerWeight"
        >
          <template #action>
            <AppButton icon="plus" square aria-label="Registrar peso" @press="registerWeight" />
          </template>
        </Field>
      </div>
    </Card>
    <Label>El peso se guarda como historial — volvé a pesarte para ver el cambio.</Label>
  </AppSubScreen>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
</style>
