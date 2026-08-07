<script setup lang="ts">
import { AppButton, AppScreen } from "../../../shared/ui";
import type { MoveType } from "../domain/activity";

/** Armed state: an activity is chosen but the clock hasn't started. Recording —
 *  and the timer — begin only when the user taps Iniciar. */
defineProps<{ type: MoveType }>();
defineEmits<{ start: []; cancel: [] }>();

const LABEL: Record<MoveType, string> = { walk: "Caminar", jog: "Trotar", run: "Correr" };
</script>

<template>
  <AppScreen>
    <div class="ready">
      <div class="head">
        <span class="type">{{ LABEL[type] }}</span>
        <span class="hint">Todo listo. Tocá Iniciar cuando arranques.</span>
      </div>

      <div class="clock">
        <div class="clock-time">0:00</div>
        <div class="clock-label">Tiempo</div>
      </div>

      <div class="controls">
        <AppButton size="lg" block @press="$emit('start')">Iniciar</AppButton>
        <AppButton size="lg" block variant="ghost" @press="$emit('cancel')">
          Cambiar actividad
        </AppButton>
      </div>
    </div>
  </AppScreen>
</template>

<style scoped>
.ready {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  min-height: 100%;
}
.head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
.type {
  font-family: var(--font-cond);
  font-size: 26px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
.hint {
  font-size: 13px;
  color: var(--muted);
}
.clock {
  text-align: center;
  padding: var(--sp-5) 0;
}
.clock-time {
  font-family: var(--font-mono);
  font-size: 56px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: var(--muted);
}
.clock-label {
  margin-top: var(--sp-2);
  font-size: 12px;
  color: var(--muted);
}
.controls {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding-top: var(--sp-4);
}
</style>
