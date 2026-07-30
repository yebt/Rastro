<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, ref, watch } from "vue";
import { AppButton, AppIcon } from "../../../shared/ui";
import { $backArmed, $finishRequested, clearFinishRequest, useRecorder } from "../../recording";
import { cleanTrack } from "../domain/clean";
import { avgPaceSecPerKm, avgSpeedMps, distanceMeters } from "../domain/metrics";
import { distanceParts, formatDuration, formatPace, formatSpeed } from "./format";
import { MOVE_LABEL } from "./labels";
import RouteMap from "./RouteMap.vue";

/**
 * Immersive recording screen: a full-bleed route map with the stats as a
 * toggleable blur panel (hide it to watch the map and see if you're moving), and
 * the controls pinned to the bottom so they're always reachable — no scrolling.
 */
const { status, activity, error, steps, cadence, elapsedMs, pause, resume, finish, discard } =
  useRecorder();

const backArmed = useStore($backArmed);
const finishRequested = useStore($finishRequested);

const paused = computed(() => status.value === "paused");
const title = computed(() => (activity.value ? MOVE_LABEL[activity.value.type] : "Actividad"));

const points = computed(() => activity.value?.points ?? []);
const clean = computed(() => cleanTrack(points.value));
const distance = computed(() => distanceParts(distanceMeters(clean.value)));
const pace = computed(() => formatPace(avgPaceSecPerKm(clean.value)));
const speed = computed(() => formatSpeed(avgSpeedMps(clean.value)));

const showStats = ref(true);
const confirming = ref(false);
const isShort = computed(() => elapsedMs.value < 10_000);

function onFinish(): void {
  confirming.value = true;
}
function keepGoing(): void {
  confirming.value = false;
}
function confirmFinish(): void {
  confirming.value = false;
  void finish();
}
function confirmDiscard(): void {
  confirming.value = false;
  void discard();
}

// Second hardware-back press asks to finish.
watch(finishRequested, (requested) => {
  if (requested) {
    confirming.value = true;
    clearFinishRequest();
  }
});
</script>

<template>
  <div class="live">
    <RouteMap :points="clean" fill class="map-bg" />

    <div class="overlay">
      <header class="top">
        <span class="meta">
          <span class="type">{{ title }}</span>
          <span class="status" :class="{ paused }">
            <i class="dot" />{{ paused ? "En pausa" : "Registrando" }}
          </span>
        </span>
        <button
          type="button"
          class="toggle"
          :aria-label="showStats ? 'Ocultar datos' : 'Ver datos'"
          @click="showStats = !showStats"
        >
          <AppIcon :name="showStats ? 'eyeOff' : 'eye'" size="20px" />
        </button>
      </header>

      <div class="clock">
        <div class="clock-time">{{ formatDuration(elapsedMs) }}</div>
        <div class="clock-label">Tiempo en movimiento</div>
      </div>

      <div class="spacer" />

      <transition name="rise">
        <div v-if="showStats" class="stats">
          <div class="tile">
            <b>{{ distance.value }}</b><small>{{ distance.unit }}</small>
          </div>
          <div class="tile"><b>{{ pace }}</b><small>/km</small></div>
          <div class="tile"><b>{{ speed }}</b><small>km/h</small></div>
          <div class="tile"><b>{{ steps }}</b><small>pasos</small></div>
          <div class="tile"><b>{{ cadence }}</b><small>p/min</small></div>
          <div class="tile"><b>{{ points.length }}</b><small>puntos</small></div>
        </div>
      </transition>

      <p v-if="error" class="err">GPS: {{ error.message }}</p>

      <transition name="fade">
        <div v-if="backArmed" class="hint">Tocá atrás otra vez para finalizar</div>
      </transition>

      <div class="actions">
        <AppButton v-if="paused" size="lg" block @press="resume()">Reanudar</AppButton>
        <AppButton v-else size="lg" block variant="ghost" @press="pause()">Pausar</AppButton>
        <AppButton size="lg" block variant="danger" @press="onFinish">Finalizar</AppButton>
      </div>
    </div>

    <div v-if="confirming" class="sheet-backdrop" @click.self="keepGoing">
      <div class="sheet" role="alertdialog" aria-label="Finalizar actividad">
        <div class="sheet-title">¿Finalizar la actividad?</div>
        <p v-if="isShort" class="sheet-text">
          Es muy corta (menos de 10 segundos). Quizá fue un arranque en falso.
        </p>
        <div class="sheet-actions">
          <AppButton block variant="ghost" @press="keepGoing">Seguir</AppButton>
          <AppButton v-if="isShort" block variant="danger" @press="confirmDiscard">
            Descartar
          </AppButton>
          <AppButton block @press="confirmFinish">Finalizar</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.live {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: var(--bg);
}
.map-bg {
  position: absolute;
  inset: 0;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: calc(var(--safe-t) + var(--sp-4)) var(--sp-4) calc(var(--safe-b) + var(--sp-4));
  pointer-events: none;
}
.overlay > * {
  pointer-events: auto;
}
.spacer {
  flex: 1;
  pointer-events: none;
}
.top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.type {
  font-family: var(--font-cond);
  font-size: 22px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}
.status.paused {
  color: var(--muted);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.toggle {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  color: var(--ink);
  backdrop-filter: blur(8px);
}
.clock {
  margin-top: var(--sp-4);
  text-align: center;
  text-shadow: 0 1px 12px var(--bg);
}
.clock-time {
  font-family: var(--font-mono);
  font-size: 52px;
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
.stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--sp-2);
  padding: var(--sp-3);
  margin-bottom: var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: color-mix(in srgb, var(--bg) 62%, transparent);
  backdrop-filter: blur(16px);
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
.err {
  margin: 0 0 var(--sp-2);
  font-size: 12px;
  color: var(--danger);
}
.hint {
  align-self: center;
  margin-bottom: var(--sp-3);
  padding: var(--sp-2) var(--sp-4);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  border: 1px solid var(--line);
  backdrop-filter: blur(8px);
}
.actions {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.rise-enter-active,
.rise-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.rise-enter-from,
.rise-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
