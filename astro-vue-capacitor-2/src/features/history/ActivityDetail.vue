<script setup lang="ts">
import { useStore } from "@nanostores/vue";
import { computed, ref } from "vue";
import { AppButton, AppSubScreen, Card, Field, Label, SegmentedControl } from "../../shared/ui";
import {
  type Activity,
  applyFilter,
  avgPaceSecPerKm,
  avgSpeedMps,
  distanceMeters,
  distanceParts,
  elevationGainM,
  elevationLossM,
  exerciseLabel,
  formatActivityDate,
  formatDuration,
  formatPace,
  formatSpeed,
  hasElevation,
  MOVE_LABEL,
  newId,
  pausedMs,
  saveSegment,
  segmentFromActivity,
  setTrackFilter,
  splits,
  $trackFilter,
  totalReps,
  TRACK_FILTERS,
} from "../tracking";
import { ShareScreen } from "../share";
import RouteMap from "../tracking/ui/RouteMap.vue";
import { deleteActivity } from "./history.store";
import StatsPanel from "./StatsPanel.vue";

const props = defineProps<{ activity: Activity }>();
const emit = defineEmits<{ back: [] }>();

const move = computed(() => (props.activity.kind === "move" ? props.activity : null));
const ex = computed(() => (props.activity.kind === "exercise" ? props.activity : null));
const rt = computed(() => (props.activity.kind === "routine" ? props.activity : null));

const title = computed(() => {
  const a = props.activity;
  if (a.kind === "move") return MOVE_LABEL[a.type];
  if (a.kind === "routine") return a.name || "Rutina";
  return exerciseLabel(a.exercise);
});

// Routine: reps totalled per exercise, in first-seen order.
const rtBreakdown = computed(() => {
  const a = rt.value;
  if (!a) return [] as { exerciseId: string; reps: number }[];
  const order: string[] = [];
  const byId = new Map<string, number>();
  for (const e of a.entries) {
    if (!byId.has(e.exerciseId)) order.push(e.exerciseId);
    byId.set(e.exerciseId, (byId.get(e.exerciseId) ?? 0) + e.reps);
  }
  return order.map((id) => ({ exerciseId: id, reps: byId.get(id) ?? 0 }));
});
const rtTotal = computed(() => rtBreakdown.value.reduce((s, e) => s + e.reps, 0));

// Movement stats (empty/zero for exercises).
const trackFilter = useStore($trackFilter);
const filterOptions = TRACK_FILTERS.map((f) => ({ value: f.id, label: f.label }));
const points = computed(() => move.value?.points ?? []);
const clean = computed(() => applyFilter(trackFilter.value, points.value));
const dist = computed(() => distanceParts(distanceMeters(clean.value)));
const duration = computed(() => formatDuration(move.value?.movingMs ?? 0));
const paused = computed(() =>
  move.value
    ? formatDuration(pausedMs(move.value.startedAt, move.value.endedAt, move.value.movingMs ?? 0))
    : "0:00",
);
const pace = computed(() => formatPace(avgPaceSecPerKm(clean.value)));
const speed = computed(() => formatSpeed(avgSpeedMps(clean.value)));
const elevation = computed(() =>
  hasElevation(points.value) ? `+${Math.round(elevationGainM(points.value))} m` : "—",
);

const exReps = computed(() => (ex.value ? totalReps(ex.value.sets) : 0));

// Resumen / Análisis tabs.
type Tab = "resumen" | "analisis";
const tab = ref<Tab>("resumen");
const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: "resumen", label: "Resumen" },
  { value: "analisis", label: "Análisis" },
];

const splitData = computed(() => splits(clean.value));

// Richer derived metrics (summary card).
const bestKm = computed(() => {
  const paces = splitData.value.map((s) => s.paceSecPerKm).filter((p): p is number => p != null);
  return paces.length ? formatPace(Math.min(...paces)) : null;
});
const cadence = computed(() => {
  const m = move.value;
  return m?.steps && m.movingMs ? Math.round(m.steps / (m.movingMs / 60_000)) : null;
});
const stride = computed(() => {
  const m = move.value;
  return m?.steps ? distanceMeters(clean.value) / m.steps : null; // metres per step
});
const elevLoss = computed(() =>
  hasElevation(points.value) ? `−${Math.round(elevationLossM(points.value))} m` : "—",
);

const showShare = ref(false);
const segmentSaved = ref(false);
const segForm = ref(false);
const segName = ref("");
const segFrom = ref("0");
const segTo = ref("0");

const totalKm = computed(() => distanceMeters(clean.value) / 1000);

function openSegForm(): void {
  if (!move.value) return;
  segName.value = MOVE_LABEL[move.value.type];
  segFrom.value = "0";
  segTo.value = totalKm.value.toFixed(2);
  segForm.value = true;
}
function saveSeg(): void {
  const m = move.value;
  if (!m || !segName.value.trim()) return;
  const fromM = Math.max(0, (Number(segFrom.value) || 0) * 1000);
  const toM = (Number(segTo.value) || totalKm.value) * 1000;
  const seg = segmentFromActivity(newId(), segName.value.trim(), m, Date.now(), fromM, toM);
  if (seg) {
    saveSegment(seg);
    segmentSaved.value = true;
    segForm.value = false;
  }
}

async function onDelete(): Promise<void> {
  await deleteActivity(props.activity.id);
  emit("back");
}
</script>

<template>
  <ShareScreen v-if="showShare && move" :activity="move" @back="showShare = false" />

  <AppSubScreen v-else :title="title" @back="emit('back')">
    <template v-if="move">
      <RouteMap :points="clean" />

      <div class="filter">
        <Label>Filtro de traza (test)</Label>
        <SegmentedControl
          :options="filterOptions"
          :model-value="trackFilter"
          @update:model-value="setTrackFilter"
        />
      </div>

      <Card>
        <div class="headline">
          <span class="hl-dist">{{ dist.value }} <small>{{ dist.unit }}</small></span>
          <span class="hl-date">{{ formatActivityDate(move.startedAt) }}</span>
        </div>
      </Card>

      <SegmentedControl :options="TAB_OPTIONS" :model-value="tab" @update:model-value="(v) => (tab = v)" />

      <Card v-if="tab === 'resumen'">
        <dl class="stats">
          <div class="row"><dt>Tiempo</dt><dd>{{ duration }}</dd></div>
          <div class="row"><dt>En pausa</dt><dd>{{ paused }} · {{ move.pauses ?? 0 }}×</dd></div>
          <div class="row"><dt>Ritmo medio</dt><dd>{{ pace }} /km</dd></div>
          <div v-if="bestKm" class="row"><dt>Mejor km</dt><dd>{{ bestKm }} /km</dd></div>
          <div class="row"><dt>Velocidad media</dt><dd>{{ speed }} km/h</dd></div>
          <div class="row"><dt>Desnivel +</dt><dd>{{ elevation }}</dd></div>
          <div class="row"><dt>Desnivel −</dt><dd>{{ elevLoss }}</dd></div>
          <div class="row"><dt>Pasos</dt><dd>{{ move.steps ?? "—" }}</dd></div>
          <div v-if="cadence" class="row"><dt>Cadencia media</dt><dd>{{ cadence }} p/min</dd></div>
          <div v-if="stride" class="row"><dt>Zancada media</dt><dd>{{ stride.toFixed(2) }} m</dd></div>
          <div class="row"><dt>Puntos GPS</dt><dd>{{ points.length }}</dd></div>
        </dl>
      </Card>

      <StatsPanel v-else :points="clean" :move="move" />

      <AppButton block variant="ghost" icon="export" @press="showShare = true">Compartir</AppButton>

      <Card v-if="segForm">
        <Field v-model="segName" label="Nombre del tramo" placeholder="Ej. Subida al mirador" />
        <div class="seg-range">
          <Field v-model="segFrom" label="Desde (km)" type="number" inputmode="decimal" />
          <Field v-model="segTo" label="Hasta (km)" type="number" inputmode="decimal" />
        </div>
        <div class="seg-actions">
          <AppButton block variant="ghost" @press="segForm = false">Cancelar</AppButton>
          <AppButton block :disabled="!segName.trim()" @press="saveSeg">Guardar tramo</AppButton>
        </div>
      </Card>
      <AppButton v-else block variant="ghost" icon="list" :disabled="segmentSaved" @press="openSegForm">
        {{ segmentSaved ? "Tramo guardado" : "Guardar como tramo" }}
      </AppButton>
    </template>

    <template v-else-if="rt">
      <Card>
        <div class="headline">
          <span class="hl-dist">{{ rtTotal }} <small>reps</small></span>
          <span class="hl-date">{{ formatActivityDate(rt.startedAt) }}</span>
        </div>
      </Card>

      <Card>
        <dl class="stats">
          <div class="row"><dt>Vueltas</dt><dd>{{ rt.rounds }}</dd></div>
          <div v-for="e in rtBreakdown" :key="e.exerciseId" class="row">
            <dt>{{ exerciseLabel(e.exerciseId) }}</dt>
            <dd>{{ e.reps }}</dd>
          </div>
        </dl>
      </Card>
    </template>

    <template v-else-if="ex">
      <Card>
        <div class="headline">
          <span class="hl-dist">{{ exReps }} <small>reps</small></span>
          <span class="hl-date">{{ formatActivityDate(ex.startedAt) }}</span>
        </div>
      </Card>

      <Card>
        <dl class="stats">
          <div v-for="(s, i) in ex.sets" :key="i" class="row">
            <dt>Serie {{ i + 1 }}</dt>
            <dd>{{ s.reps }}</dd>
          </div>
          <div class="row"><dt>Series</dt><dd>{{ ex.sets.length }}</dd></div>
        </dl>
      </Card>
    </template>

    <AppButton block variant="danger" @press="onDelete">Borrar actividad</AppButton>
  </AppSubScreen>
</template>

<style scoped>
.filter {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.headline {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
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
.hl-date {
  font-size: 13px;
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
.seg-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
  margin-top: var(--sp-3);
}
.seg-actions {
  display: flex;
  gap: var(--sp-3);
  margin-top: var(--sp-4);
}
</style>
