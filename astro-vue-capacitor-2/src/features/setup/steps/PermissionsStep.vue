<script setup lang="ts">
import { Logo } from "../../../shared/ui";
import PermissionList from "../../permissions/PermissionList.vue";

/** Step 1 — explain and grant the permissions Rastro needs to record. */
</script>

<template>
  <div class="step">
    <div class="hero">
      <div class="badge"><Logo size="36px" /></div>
      <h2>Bienvenido a Rastro</h2>
      <p>
        Rastro funciona en tu dispositivo, sin cuenta. Para registrar bien tus salidas necesita
        esto. Podés concederlo ahora o después desde Más.
      </p>
    </div>
    <PermissionList auto-request />
  </div>
</template>

<style scoped>
.step {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
.hero {
  text-align: center;
}
.badge {
  width: 56px;
  height: 56px;
  border-radius: var(--r-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  margin: 0 auto var(--sp-3);
}
.hero h2 {
  margin: 0;
  font-family: var(--font-cond);
  font-size: 26px;
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
</style>
