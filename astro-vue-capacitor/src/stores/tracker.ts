/**
 * GPS tracking engine (store, not component).
 *
 * Owns the geolocation watch, timers and live metrics at MODULE level, so the
 * session survives tab switches and component churn — the core reason the app
 * is a persistent shell and not an MPA. Components only read these atoms and
 * call the actions; Leaflet objects live in the component.
 *
 * Adds F1 (Wake Lock) and F3 (time-series samples) on top of v1 parity, as
 * separate layers. Cadence (F2) and native background (F5) come later.
 */

import { atom } from "nanostores";
import { genId } from "../lib/id";
import { evaluatePoint, shouldSample } from "../lib/track";
import type { GpsActivity, GpsType, RoutePoint, Sample } from "../lib/types";
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
/** Whether the screen Wake Lock is held (F1) — drives a UI indicator. */
export const $wakeLockActive = atom<boolean>(false);

let route: RoutePoint[] = [];
let samples: Sample[] = []; // F3 time-series
let lastSampleT = -Infinity;
let watchId: number | null = null;
let tick: ReturnType<typeof setInterval> | null = null;
let startTs = 0; // start of the current running segment
let originalStart = 0; // activity start (survives pause/resume)
let accMs = 0; // accumulated ms across previous segments
let wakeLock: WakeLockSentinel | null = null;

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

// --- Wake Lock (F1): keep the screen awake so the browser doesn't suspend the
// timers / geolocation watch. Foreground-only; real background = Capacitor (F5).
async function requestWakeLock(): Promise<void> {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      $wakeLockActive.set(true);
      wakeLock.addEventListener("release", () => $wakeLockActive.set(false));
    }
  } catch {
    $wakeLockActive.set(false); // silent fallback if denied/unsupported
  }
}

async function releaseWakeLock(): Promise<void> {
  try {
    await wakeLock?.release();
  } catch {
    // ignore
  }
  wakeLock = null;
  $wakeLockActive.set(false);
}

// The lock drops when the tab is hidden; re-acquire on return if still running.
function onVisibility(): void {
  if (document.visibilityState === "visible" && $trackState.get() === "running") {
    void requestWakeLock();
  }
}

export function start(): void {
  if (!("geolocation" in navigator)) {
    showToast("Este dispositivo no tiene GPS disponible");
    return;
  }
  route = [];
  samples = [];
  lastSampleT = -Infinity;
  accMs = 0;
  startTs = Date.now();
  originalStart = startTs;
  $distance.set(0);
  $speed.set(0);
  $elapsed.set(0);
  $lastPoint.set(null);
  $sessionStart.set(startTs);
  $trackState.set("running");
  void requestWakeLock();
  document.addEventListener("visibilitychange", onVisibility);
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
    case "move": {
      $distance.set($distance.get() + decision.meters);
      $speed.set(decision.speedKmh);
      route.push(next);
      $lastPoint.set(next);
      const t = elapsedSec();
      $elapsed.set(t);
      if (shouldSample(t, lastSampleT)) {
        samples.push({
          t: Math.round(t),
          d: Math.round($distance.get()),
          v: Number((decision.speedKmh / 3.6).toFixed(2)), // m/s
          acc: Math.round(accuracy),
        });
        lastSampleT = t;
      }
      return;
    }
  }
}

export function pause(): void {
  if ($trackState.get() !== "running") return;
  accMs += Date.now() - startTs;
  $trackState.set("paused");
  $speed.set(0);
  $elapsed.set(elapsedSec());
  void releaseWakeLock(); // SPECS F1: release on pause
}

export function resume(): void {
  if ($trackState.get() !== "paused") return;
  startTs = Date.now();
  $trackState.set("running");
  void requestWakeLock();
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
  void releaseWakeLock();
  document.removeEventListener("visibilitychange", onVisibility);
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
    samples: samples.length ? samples : undefined,
    source: { gps: true },
  };
  await addActivity(activity);
  showToast(`¡Guardado! ${km.toFixed(2)} km`);
  reset();
}

function reset(): void {
  route = [];
  samples = [];
  lastSampleT = -Infinity;
  $distance.set(0);
  $speed.set(0);
  $elapsed.set(0);
  $lastPoint.set(null);
  $rawPos.set(null);
}
