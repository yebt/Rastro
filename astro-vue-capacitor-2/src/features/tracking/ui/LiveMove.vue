<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, ref, watch } from "vue";
import { AppButton, AppIcon, SegmentedControl } from "../../../shared/ui";
import { $backArmed, $finishRequested, clearFinishRequest, useRecorder } from "../../recording";
import { applyFilter, TRACK_FILTERS } from "../domain/filters";
import { avgPaceSecPerKm, avgSpeedMps, distanceMeters } from "../domain/metrics";
import type { TrackPoint } from "../domain/track-point";
import { $trackFilter, setTrackFilter } from "../track-filter.store";
import { distanceParts, formatDuration, formatPace, formatSpeed } from "./format";
import { MOVE_LABEL } from "./labels";
import RouteMap from "./RouteMap.vue";

/**
 * Immersive recording screen: a full-bleed route map with the stats in a
 * toggleable blur panel (hide it for a compact time+distance readout and a clear
 * view of the map), and pause/finish pinned to the bottom — no scrolling.
 */
const { status, activity, error, steps, cadence, elapsedMs, requestFinish, cancelFinish, pause, resume, finish, discard } =
  useRecorder();

const backArmed = useStore($backArmed);
const finishRequested = useStore($finishRequested);

const paused = computed(() => status.value === "paused");
const type = computed(() => activity.value?.type ?? "walk");
const title = computed(() => (activity.value ? MOVE_LABEL[activity.value.type] : "Actividad"));

const trackFilter = useStore($trackFilter);
const filterOptions = TRACK_FILTERS.map((f) => ({ value: f.id, label: f.label }));

const rawPoints = computed(() => activity.value?.points ?? []);

// While the confirm sheet is open, show a snapshot from the finish instant even
// though recording keeps running behind it — so "keep going" loses nothing.
const frozen = ref<{ points: TrackPoint[]; elapsed: number; steps: number; cadence: number } | null>(
  null,
);

const points = computed(() => frozen.value?.points ?? rawPoints.value);
const elapsed = computed(() => frozen.value?.elapsed ?? elapsedMs.value);
const liveSteps = computed(() => frozen.value?.steps ?? steps.value);
const liveCadence = computed(() => frozen.value?.cadence ?? cadence.value);

const clean = computed(() => applyFilter(trackFilter.value, points.value));
const distance = computed(() => distanceParts(distanceMeters(clean.value)));
const pace = computed(() => formatPace(avgPaceSecPerKm(clean.value)));
const speed = computed(() => formatSpeed(avgSpeedMps(clean.value)));

const showStats = ref(true);
const confirming = ref(false);
const isShort = computed(() => elapsed.value < 10_000);

function openFinishConfirm(): void {
  if (status.value === "recording") {
    frozen.value = {
      points: rawPoints.value.slice(),
      elapsed: elapsedMs.value,
      steps: steps.value,
      cadence: cadence.value,
    };
    requestFinish(); // mark the instant; recording keeps running behind the sheet
  }
  confirming.value = true;
}
function keepGoing(): void {
  confirming.value = false;
  frozen.value = null;
  cancelFinish(); // nothing was paused, so nothing is lost
}
function confirmFinish(): void {
  confirming.value = false;
  frozen.value = null;
  void finish();
}
function confirmDiscard(): void {
  confirming.value = false;
  frozen.value = null;
  void discard();
}

// Second hardware-back press asks to finish (freezing the display too).
watch(finishRequested, (requested) => {
  if (requested) {
    openFinishConfirm();
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
          <AppIcon :name="type" size="20px" class="type-ic" />
          <span class="type">{{ title }}</span>
          <span class="status" :class="{ paused }">
            <i class="dot" />{{ paused ? "En pausa" : "Registrando" }}
          </span>
        </span>
        <button
          type="button"
          class="toggle"
          :aria-label="showStats ? 'Modo compacto' : 'Ver datos'"
          @click="showStats = !showStats"
        >
          <AppIcon :name="showStats ? 'eyeOff' : 'eye'" size="20px" />
        </button>
      </header>

      <div v-if="showStats" class="clock">
        <div class="clock-time">{{ formatDuration(elapsed) }}</div>
        <div class="clock-label">Tiempo en movimiento</div>
      </div>
      <div v-else class="clock-compact">
        <span class="ct-time">{{ formatDuration(elapsed) }}</span>
        <span class="ct-sep">·</span>
        <span class="ct-dist">{{ distance.value }} {{ distance.unit }}</span>
      </div>

      <div class="spacer" />

      <transition name="rise">
        <div v-if="showStats" class="stats">
          <div class="grid">
            <div class="tile">
              <b>{{ distance.value }}</b><small>{{ distance.unit }}</small>
            </div>
            <div class="tile"><b>{{ pace }}</b><small>/km</small></div>
            <div class="tile"><b>{{ speed }}</b><small>km/h</small></div>
            <div class="tile"><b>{{ liveSteps }}</b><small>pasos</small></div>
            <div class="tile"><b>{{ liveCadence }}</b><small>p/min</small></div>
            <div class="tile"><b>{{ points.length }}</b><small>puntos</small></div>
          </div>
          <SegmentedControl
            :options="filterOptions"
            :model-value="trackFilter"
            @update:model-value="setTrackFilter"
          />
        </div>
      </transition>

      <p v-if="error" class="err">GPS: {{ error.message }}</p>

      <transition name="fade">
        <div v-if="backArmed" class="hint">Tocá atrás otra vez para finalizar</div>
      </transition>

      <div class="actions">
        <div class="act">
          <AppButton v-if="paused" size="lg" block icon="play" @press="resume()">Reanudar</AppButton>
          <AppButton v-else size="lg" block variant="ghost" icon="pause" @press="pause()">
            Pausar
          </AppButton>
        </div>
        <div class="act">
          <AppButton size="lg" block variant="danger" icon="stop" @press="openFinishConfirm">
            Finalizar
          </AppButton>
        </div>
      </div>
    </div>

    <div v-if="confirming" class="sheet-backdrop" @click.self="keepGoing">
      <div class="sheet" role="alertdialog" aria-label="Finalizar actividad">
        <div class="sheet-title">¿Finalizar la actividad?</div>
        <p class="sheet-text">
          <template v-if="isShort">
            Es muy corta (menos de 10 segundos). Quizá fue un arranque en falso.
          </template>
          <template v-else>Guardás tu recorrido y ves el resumen.</template>
        </p>
        <div class="sheet-actions">
          <AppButton size="lg" block variant="danger" icon="stop" @press="confirmFinish">
            Finalizar
          </AppButton>
          <AppButton v-if="isShort" size="lg" block variant="ghost" icon="trash" @press="confirmDiscard">
            Descartar
          </AppButton>
          <AppButton size="lg" block variant="ghost" @press="keepGoing">Seguir grabando</AppButton>
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
  z-index: 0;
}
.overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
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
  align-items: center;
  flex-wrap: wrap;
  gap: 6px var(--sp-2);
}
.type-ic {
  color: var(--accent);
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
  flex: none;
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
.clock-compact {
  margin-top: var(--sp-3);
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  font-family: var(--font-mono);
  font-size: 30px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  text-shadow: 0 1px 12px var(--bg);
}
.ct-sep {
  color: var(--muted);
}
.ct-dist {
  color: var(--accent);
}
.stats {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-3);
  margin-bottom: var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: color-mix(in srgb, var(--bg) 62%, transparent);
  backdrop-filter: blur(16px);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--sp-2);
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
  gap: var(--sp-3);
}
.act {
  flex: 1;
  min-width: 0;
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
.sheet-title {
  font-family: var(--font-cond);
  font-size: 22px;
  font-weight: 600;
  text-transform: uppercase;
}
.sheet-text {
  margin: var(--sp-2) 0 var(--sp-5);
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
</style>
