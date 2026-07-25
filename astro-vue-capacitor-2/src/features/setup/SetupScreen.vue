<script setup lang="ts">
import { ref } from "vue";
import { AppButton, AppIcon, Field, Label } from "../../shared/ui";
import PermissionList from "../permissions/PermissionList.vue";
import { addWeight, setHeight, setNickname } from "../profile/profile.store";
import { completeSetup } from "./setup.store";

/**
 * First-run screen: explain and grant permissions, optionally capture profile
 * basics, then enter the app. Nothing here blocks finishing — permissions and
 * profile can both be completed later from Settings.
 */

const nickname = ref("");
const weight = ref("");
const height = ref("");

function finish(): void {
  const nick = nickname.value.trim();
  if (nick) setNickname(nick);

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
      <header class="hero">
        <div class="badge"><AppIcon name="location" size="30px" /></div>
        <h1>Bienvenido a Rastro</h1>
        <p>
          Funciona en tu dispositivo, sin cuenta. Para registrar bien tus salidas necesita este
          permiso — podés concederlo ahora o después desde Más.
        </p>
      </header>

      <PermissionList />

      <section class="about">
        <Label>Sobre vos · opcional</Label>
        <Field v-model="nickname" label="Apodo" placeholder="Cómo te dicen" />
        <div class="pair">
          <Field
            v-model="weight"
            label="Peso (kg)"
            type="number"
            inputmode="decimal"
            placeholder="72"
          />
          <Field
            v-model="height"
            label="Altura (cm)"
            type="number"
            inputmode="numeric"
            placeholder="175"
          />
        </div>
      </section>

      <AppButton size="lg" block @press="finish">Empezar a usar Rastro</AppButton>
    </div>
  </div>
</template>

<style scoped>
.setup {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: var(--bg);
  overflow-y: auto;
}
.inner {
  max-width: 520px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  padding: calc(var(--safe-t) + var(--sp-6)) var(--sp-5) calc(var(--safe-b) + var(--sp-5));
}
.hero {
  text-align: center;
}
.badge {
  width: 56px;
  height: 56px;
  border-radius: var(--r-lg);
  background: var(--ink);
  color: var(--bg);
  display: grid;
  place-items: center;
  margin: 0 auto var(--sp-3);
}
.hero h1 {
  margin: 0;
  font-family: var(--font-cond);
  font-size: 28px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
.hero p {
  margin: var(--sp-2) 0 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
.about {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}
.pair {
  display: flex;
  gap: var(--sp-3);
}
.pair > * {
  flex: 1;
}
</style>
