/**
 * GPS tracking engine (store, not component).
 *
 * Owns the geolocation watch, timers and live metrics at MODULE level, so the
 * session survives tab switches and component churn — the core reason the app
 * is a persistent shell and not an MPA. Components only read these atoms and
 * call the actions; Leaflet objects live in the component.
 *
 * Parity scope: mirrors v1 exactly. Wake Lock (F1), samples/cadence (F2/F3)
 * come AFTER parity, as separate layers.
 */

import { atom } from "nanostores";
import { genId } from "../lib/id";
import { evaluatePoint } from "../lib/track";
import type { GpsActivity, GpsType, RoutePoint } from "../lib/types";
import { addActivity } from "./activities";
import { showToast } from "./ui";

export type TrackState = "idle" | "running" | "paused";

export const $trackState = atom<TrackState>("idle");
export const $curType = atom<GpsType>("Caminata");
export const $distance = atom<number>(0); // meters
export const $elapsed = atom<number>(0); // seconds (live)
export const $speed = atom<number>(0); // km/h (instantaneous)

/** Newest ACCEPTED point — component appends it to the route polyline. */
export const $lastPoint = atom<RoutePoint | null>(null);
/** Raw fix on every callback — marker follows even on weak GPS (v1 behavior). */
export const $rawPos = atom<{ lat: number; lng: number } | null>(null);
/** Bumped on each new session start — component clears the polyline. */
export const $sessionStart = atom<number>(0);

let route: RoutePoint[] = [];
let watchId: number | null = null;
let tick: ReturnType<typeof setInterval> | null = null;
let startTs = 0; // start of the current running segment
let originalStart = 0; // activity start (survives pause/resume)
let accMs = 0; // accumulated ms across previous segments

function elapsedSec(): number {
  const state = $trackState.get();
  if (state === "idle") return 0;
  const running = state === "running";
  return (accMs + (running ? Date.now() - startTs : 0)) / 1000;
}

export function setType(type: GpsType): void {
  if ($trackState.get() !== "idle") return; // locked while tracking
  $curType.set(type);
}

export function start(): void {
  if (!("geolocation" in navigator)) {
    showToast("Este dispositivo no tiene GPS disponible");
    return;
  }
  route = [];
  accMs = 0;
  startTs = Date.now();
  originalStart = startTs;
  $distance.set(0);
  $speed.set(0);
  $elapsed.set(0);
  $lastPoint.set(null);
  $sessionStart.set(startTs);
  $trackState.set("running");
  watchId = navigator.geolocation.watchPosition(onPos, onPosErr, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 15000,
  });
  tick = setInterval(() => $elapsed.set(elapsedSec()), 250);
}

function onPosErr(err: GeolocationPositionError): void {
  if (err.code === err.PERMISSION_DENIED) {
    showToast("Permití el acceso a la ubicación para registrar");
  }
}

function onPos(p: GeolocationPosition): void {
  if ($trackState.get() !== "running") return;
  const next: RoutePoint = { lat: p.coords.latitude, lng: p.coords.longitude, t: Date.now() };
  $rawPos.set({ lat: next.lat, lng: next.lng }); // marker follows always
  const accuracy = p.coords.accuracy ?? 999;
  const last = route.length ? route[route.length - 1]! : null;
  const decision = evaluatePoint(last, next, accuracy);

  switch (decision.kind) {
    case "reject-accuracy":
    case "jitter":
      return;
    case "first":
    case "jump":
      route.push(next);
      $lastPoint.set(next);
      return;
    case "move":
      $distance.set($distance.get() + decision.meters);
      $speed.set(decision.speedKmh);
      route.push(next);
      $lastPoint.set(next);
      $elapsed.set(elapsedSec());
      return;
  }
}

export function pause(): void {
  if ($trackState.get() !== "running") return;
  accMs += Date.now() - startTs;
  $trackState.set("paused");
  $speed.set(0);
  $elapsed.set(elapsedSec());
}

export function resume(): void {
  if ($trackState.get() !== "paused") return;
  startTs = Date.now();
  $trackState.set("running");
}

export async function stop(): Promise<void> {
  if ($trackState.get() === "idle") return;
  const sec = elapsedSec();
  const meters = $distance.get();
  const km = meters / 1000;
  const type = $curType.get();

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (tick) {
    clearInterval(tick);
    tick = null;
  }
  $trackState.set("idle");

  if (km < 0.01 && sec < 10) {
    showToast("Actividad muy corta, no se guardó");
    reset();
    return;
  }

  const activity: GpsActivity = {
    id: genId("a"),
    kind: "gps",
    type,
    date: originalStart,
    distance: Math.round(meters),
    duration: Math.round(sec),
    route: route.map((pt) => [Number(pt.lat.toFixed(5)), Number(pt.lng.toFixed(5))]),
    source: { gps: true },
  };
  await addActivity(activity);
  showToast(`¡Guardado! ${km.toFixed(2)} km`);
  reset();
}

function reset(): void {
  route = [];
  $distance.set(0);
  $speed.set(0);
  $elapsed.set(0);
  $lastPoint.set(null);
  $rawPos.set(null);
}
