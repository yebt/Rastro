<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { ref, watch } from "vue";
import { AppSubScreen, Field, Label } from "../../../shared/ui";
import { $goals, setGoals } from "../../history/goals.store";

/** Set the weekly distance and daily reps goals (0 turns a goal off). */
defineEmits<{ back: [] }>();

const goals = useStore($goals);
const km = ref(String(goals.value.kmWeekly || ""));
const reps = ref(String(goals.value.repsDaily || ""));

function commit(): void {
  setGoals({ kmWeekly: Number(km.value) || 0, repsDaily: Number(reps.value) || 0 });
}
watch([km, reps], commit);
</script>

<template>
  <AppSubScreen title="Metas" @back="$emit('back')">
    <Label>Se muestran con su progreso en Inicio. Dejá en 0 para desactivar.</Label>
    <Field v-model="km" label="Distancia por semana (km)" type="number" inputmode="decimal" placeholder="0" />
    <Field v-model="reps" label="Reps por día" type="number" inputmode="numeric" placeholder="0" />
  </AppSubScreen>
</template>
