<script setup lang="ts">
import { computed } from "vue";
import { AppButton, AppScreen, Card } from "../../../shared/ui";
import { useRecorder } from "../../recording";
import type { MoveType } from "../domain/activity";
import { avgPaceSecPerKm, avgSpeedMps, distanceMeters } from "../domain/metrics";
import { distanceParts, formatDuration, formatPace, formatSpeed } from "./format";

/** Post-finish summary. The activity is already saved; "Listo" clears the
 *  recorder back to idle. */
const { activity, elapsedMs, discard } = useRecorder();

const VERB: Record<MoveType, string> = {
  walk: "Caminaste",
  jog: "Trotaste",
  run: "Corriste",
};

const points = computed(() => activity.value?.points ?? []);
const verb = computed(() => (activity.value ? VERB[activity.value.type] : "Registraste"));
const distance = computed(() => distanceParts(distanceMeters(points.value)));
const duration = computed(() => formatDuration(elapsedMs.value));
const pace = computed(() => formatPace(avgPaceSecPerKm(points.value)));
const speed = computed(() => formatSpeed(avgSpeedMps(points.value)));

function done(): void {
  void discard();
}
</script>

<template>
  <AppScreen title="Resumen">
    <Card>
      <div class="headline">
        <span class="hl-verb">{{ verb }}</span>
        <span class="hl-dist">{{ distance.value }} <small>{{ distance.unit }}</small></span>
      </div>
    </Card>

    <Card>
      <dl class="stats">
        <div class="row">
          <dt>Tiempo</dt>
          <dd>{{ duration }}</dd>
        </div>
        <div class="row">
          <dt>Ritmo medio</dt>
          <dd>{{ pace }} /km</dd>
        </div>
        <div class="row">
          <dt>Velocidad media</dt>
          <dd>{{ speed }} km/h</dd>
        </div>
        <div class="row">
          <dt>Puntos GPS</dt>
          <dd>{{ points.length }}</dd>
        </div>
      </dl>
    </Card>

    <AppButton size="lg" block @press="done">Listo</AppButton>
  </AppScreen>
</template>

<style scoped>
.headline {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
.hl-verb {
  font-size: 13px;
  color: var(--muted);
}
.hl-dist {
  font-family: var(--font-mono);
  font-size: 40px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.hl-dist small {
  font-size: 16px;
  color: var(--muted);
}
.stats {
  margin: 0;
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-2) 0;
}
.row + .row {
  border-top: 1px solid var(--line);
}
.stats dt {
  font-size: 13px;
  color: var(--muted);
}
.stats dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
