/**
 * Dev-only tracking diagnostics (visible in eruda on the phone).
 *
 * Answers "did the app keep tracking while I wasn't looking?" by:
 *  - a heartbeat every 5s with timestamp + live metrics,
 *  - detecting suspension gaps (if the page is frozen, setInterval stops firing;
 *    on resume the next beat sees the wall-clock jump and reports it),
 *  - logging GPS fixes, state/wakeLock transitions, and page-lifecycle events.
 *
 * Loaded only under `import.meta.env.DEV`, so it never ships to production.
 */

import { $distance, $elapsed, $rawPos, $trackState, $wakeLockActive } from "../stores/tracker";

const HEARTBEAT_MS = 5000;
const TAG = "color:#1B4DFF;font-weight:bold";

let started = false;
let lastFixTs = 0;
let lastBeatTs = 0;

function stamp(): string {
  return new Date().toTimeString().slice(0, 8); // HH:MM:SS
}

function log(msg: string, data?: unknown): void {
  if (data === undefined) console.log(`%c[track ${stamp()}] ${msg}`, TAG);
  else console.log(`%c[track ${stamp()}] ${msg}`, TAG, data);
}

export function initTrackerDiagnostics(): void {
  if (started) return;
  started = true;
  log("diagnostics ON");

  // GPS fixes (every callback) with the gap since the previous one.
  $rawPos.subscribe((pos) => {
    if (!pos) return;
    const now = Date.now();
    const gap = lastFixTs ? ((now - lastFixTs) / 1000).toFixed(1) : "0";
    lastFixTs = now;
    log(`gps fix +${gap}s`, `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
  });

  // State + wake lock transitions (subscribe fires with the current value too).
  $trackState.subscribe((s) => log(`state → ${s}`));
  $wakeLockActive.subscribe((held) => log(`wakeLock ${held ? "HELD ✅" : "released"}`));

  // Heartbeat — the suspension detector.
  lastBeatTs = Date.now();
  setInterval(() => {
    const now = Date.now();
    const drift = now - lastBeatTs - HEARTBEAT_MS;
    lastBeatTs = now;

    if ($trackState.get() === "idle") return;

    if (drift > HEARTBEAT_MS) {
      log(
        `⚠️ RESUMED after ~${Math.round((drift + HEARTBEAT_MS) / 1000)}s gap — page was SUSPENDED`,
      );
    }

    const sinceFix = lastFixTs ? Math.round((now - lastFixTs) / 1000) : -1;
    log("♥ heartbeat", {
      state: $trackState.get(),
      elapsed: `${Math.round($elapsed.get())}s`,
      dist: `${($distance.get() / 1000).toFixed(2)}km`,
      sinceLastFix: `${sinceFix}s`,
      wakeLock: $wakeLockActive.get(),
      visible: document.visibilityState,
    });
  }, HEARTBEAT_MS);

  // Page-lifecycle + network events — these mark when the app "lost" context.
  document.addEventListener("visibilitychange", () =>
    log(`visibility → ${document.visibilityState}`),
  );
  document.addEventListener("freeze", () => log("⚠️ page FROZEN (suspended by OS/browser)"));
  document.addEventListener("resume", () => log("page RESUMED"));
  window.addEventListener("pagehide", (e) => log(`pagehide (persisted=${e.persisted})`));
  window.addEventListener("pageshow", (e) => log(`pageshow (persisted=${e.persisted})`));
  window.addEventListener("online", () => log("network: online"));
  window.addEventListener("offline", () => log("network: offline"));
}
