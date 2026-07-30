<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton, AppScreen } from "../../../shared/ui";
import { useRecorder } from "../../recording";
import type { MoveType } from "../domain/activity";
import { avgPaceSecPerKm, avgSpeedMps, distanceMeters } from "../domain/metrics";
import { distanceParts, formatDuration, formatPace, formatSpeed } from "./format";

/** Live recording screen — stats tick from the recorder while it captures GPS. */
const { status, activity, error, steps, cadence, elapsedMs, pause, resume, finish, discard } =
  useRecorder();

const LABEL: Record<MoveType, string> = { walk: "Caminar", jog: "Trotar", run: "Correr" };

const title = computed(() => (activity.value ? LABEL[activity.value.type] : "Actividad"));
const paused = computed(() => status.value === "paused");

const points = computed(() => activity.value?.points ?? []);
const distance = computed(() => distanceParts(distanceMeters(points.value)));
const pace = computed(() => formatPace(avgPaceSecPerKm(points.value)));
const speed = computed(() => formatSpeed(avgSpeedMps(points.value)));
const fixes = computed(() => points.value.length);

// A very short recording is usually a false start, so confirm before saving it.
const SHORT_MS = 10_000;
const confirming = ref(false);

function onFinish(): void {
  if (elapsedMs.value < SHORT_MS) confirming.value = true;
  else void finish();
}
function saveShort(): void {
  confirming.value = false;
  void finish();
}
function discardShort(): void {
  confirming.value = false;
  void discard();
}
</script>

<template>
  <AppScreen>
    <div class="live">
      <header class="live-head">
        <span class="live-type">{{ title }}</span>
        <span class="live-status" :class="{ paused }">
          <i class="dot" />{{ paused ? "En pausa" : "Registrando" }}
        </span>
      </header>

      <div class="clock">
        <div class="clock-time">{{ formatDuration(elapsedMs) }}</div>
        <div class="clock-label">Tiempo en movimiento</div>
      </div>

      <div class="grid">
        <div class="tile">
          <div class="tile-val">{{ distance.value }}</div>
          <div class="tile-unit">{{ distance.unit }}</div>
        </div>
        <div class="tile">
          <div class="tile-val">{{ pace }}</div>
          <div class="tile-unit">/km</div>
        </div>
        <div class="tile">
          <div class="tile-val">{{ speed }}</div>
          <div class="tile-unit">km/h</div>
        </div>
        <div class="tile">
          <div class="tile-val">{{ steps }}</div>
          <div class="tile-unit">pasos</div>
        </div>
        <div class="tile">
          <div class="tile-val">{{ cadence }}</div>
          <div class="tile-unit">p/min</div>
        </div>
        <div class="tile">
          <div class="tile-val">{{ fixes }}</div>
          <div class="tile-unit">puntos</div>
        </div>
      </div>

      <p v-if="error" class="err">
        Problema con el GPS: {{ error.message }}. Seguí registrando; se reanuda solo cuando vuelve
        la señal.
      </p>

      <div class="controls">
        <AppButton v-if="paused" size="lg" block @press="resume()">Reanudar</AppButton>
        <AppButton v-else size="lg" block variant="ghost" @press="pause()">Pausar</AppButton>
        <AppButton size="lg" block variant="danger" @press="onFinish">Finalizar</AppButton>
      </div>
    </div>

    <div v-if="confirming" class="sheet-backdrop" @click.self="confirming = false">
      <div class="sheet" role="alertdialog" aria-label="Recorrido muy corto">
        <div class="sheet-title">Recorrido muy corto</div>
        <p class="sheet-text">
          Este recorrido dura menos de 10 segundos. ¿Querés guardarlo igual o descartarlo?
        </p>
        <div class="sheet-actions">
          <AppButton block variant="danger" @press="discardShort">Descartar</AppButton>
          <AppButton block @press="saveShort">Guardar igual</AppButton>
        </div>
      </div>
    </div>
  </AppScreen>
</template>

<style scoped>
.live {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  min-height: 100%;
}
.live-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.live-type {
  font-family: var(--font-cond);
  font-size: 22px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
.live-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}
.live-status.paused {
  color: var(--muted);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.clock {
  text-align: center;
  padding: var(--sp-4) 0;
}
.clock-time {
  font-family: var(--font-mono);
  font-size: 56px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.clock-label {
  margin-top: var(--sp-2);
  font-size: 12px;
  color: var(--muted);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}
.tile {
  padding: var(--sp-4);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  text-align: center;
}
.tile-val {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.tile-unit {
  margin-top: 2px;
  font-size: 12px;
  color: var(--muted);
}
.err {
  margin: 0;
  font-size: 12px;
  color: var(--danger);
  line-height: 1.45;
}
.controls {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding-top: var(--sp-4);
}
.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: flex-end;
  background: color-mix(in srgb, black 45%, transparent);
  padding: var(--sp-4);
  padding-bottom: calc(var(--safe-b) + var(--sp-4));
}
.sheet {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
}
.sheet-title {
  font-family: var(--font-cond);
  font-size: 20px;
  font-weight: 600;
  text-transform: uppercase;
}
.sheet-text {
  margin: var(--sp-2) 0 var(--sp-4);
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
.sheet-actions {
  display: flex;
  gap: var(--sp-3);
}
</style>
