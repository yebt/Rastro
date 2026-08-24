/**
 * Recording engine — the core that ties geolocation to persistence.
 *
 * One recorder owns one session at a time: it starts an activity, subscribes to
 * the GPS, appends every fix as a lossless TrackPoint, supports pause/resume,
 * and on finish stamps the end time and saves it through the repository.
 *
 * Dependencies (geo, repo, clock) are injected so the whole thing runs headless
 * in tests with the fake geolocation and in-memory repository — no real GPS, no
 * timers. State is exposed as nanostores for the UI to read reactively.
 *
 * Battery: the GPS watch is stopped while paused and restarted on resume, so a
 * paused activity costs nothing. Elapsed time excludes paused gaps.
 */

import { atom, type ReadableAtom } from "nanostores";
import type { GeoError, Geolocation, GeoWatch } from "../geolocation";
import type { Pedometer } from "../motion";
import type { ActivityRepository } from "../tracking";
import { type MoveActivity, type MoveType, startMove, toTrackPoint, type TrackPoint } from "../tracking";

export type RecordingStatus = "idle" | "recording" | "paused" | "finished";

export interface RecorderDeps {
  geo: Geolocation;
  repo: ActivityRepository;
  /** Step counter, driven in lockstep with the GPS watch. */
  pedometer: Pedometer;
  /** Injected clock — Date.now in production, controllable in tests. */
  now: () => number;
  /**
   * Throttle for autosaving the in-progress session to the repo (ms). The first
   * point is always saved immediately; after that, saves are spaced by this, so a
   * crash loses at most ~this much of the tail — never the whole session. Default 5s.
   */
  autosaveMs?: number;
}

export interface Recorder {
  readonly $status: ReadableAtom<RecordingStatus>;
  /** The live activity, its points growing as fixes arrive. */
  readonly $activity: ReadableAtom<MoveActivity | null>;
  /** Last geolocation error, if any (e.g. permission lost mid-run). */
  readonly $error: ReadableAtom<GeoError | null>;
  /** Milliseconds recorded, excluding paused time. */
  elapsedMs(): number;
  start(type: MoveType): Promise<void>;
  pause(): Promise<void>;
  /**
   * Mark the finish instant WITHOUT pausing: recording keeps running behind the
   * confirmation, so a later finish() ends exactly here (points after it dropped),
   * while cancelFinish() (keep going) loses nothing — the time and fixes during
   * the confirmation were still recorded. The UI freezes its own display.
   */
  requestFinish(): void;
  cancelFinish(): void;
  resume(): Promise<void>;
  /** Stop, stamp the end time, and persist. Returns the saved activity. */
  finish(): Promise<MoveActivity | null>;
  /** Stop and drop the session, deleting its autosaved draft. */
  discard(): Promise<void>;
  /**
   * Re-open an autosaved, still-in-progress session (recovered after the app was
   * killed) and keep recording. Points are preserved; elapsed time continues
   * from the captured span (exact paused gaps can't be recovered).
   */
  restore(activity: MoveActivity): Promise<void>;
  /** Force-persist the current in-progress session now (e.g. app going to background). */
  flush(): Promise<void>;
}

export function createRecorder(deps: RecorderDeps): Recorder {
  const $status = atom<RecordingStatus>("idle");
  const $activity = atom<MoveActivity | null>(null);
  const $error = atom<GeoError | null>(null);

  let watch: GeoWatch | null = null;
  // Elapsed = accumulated (from finished moving spans) + current span if moving.
  let accumulatedMs = 0;
  let movingSince: number | null = null;
  let pauseCount = 0;
  // Set when finishing was requested, so finish() stamps that instant, not the
  // (possibly later) moment the user confirms.
  let finishAt: number | null = null;
  const autosaveMs = deps.autosaveMs ?? 5000;
  // Wall-clock (injected) of the last autosave, to throttle disk writes.
  let lastSavedAt = 0;

  /** Persist the in-progress session, throttled — but always on its first point,
   *  so even a short session that produced one fix survives a crash. */
  function autosave(act: MoveActivity): void {
    const at = deps.now();
    if (act.points.length <= 1 || at - lastSavedAt >= autosaveMs) {
      lastSavedAt = at;
      void deps.repo.save(act);
    }
  }

  /** Append a fix and autosave. Shared by the live watch and the start seed. */
  function appendPoint(point: TrackPoint): void {
    const act = $activity.get();
    if (!act) return;
    const next: MoveActivity = { ...act, points: [...act.points, point] };
    $activity.set(next);
    autosave(next);
  }

  async function startWatch(): Promise<void> {
    watch = await deps.geo.watch(
      (sample) => {
        const act = $activity.get();
        if (!act || $status.get() !== "recording") return;
        // Stamp the live cumulative step count so stride/cadence can be derived
        // over time, not just as a session total.
        appendPoint({ ...toTrackPoint(sample), st: deps.pedometer.$steps.get() });
      },
      (error) => $error.set(error),
    );
  }

  async function stopWatch(): Promise<void> {
    await watch?.stop();
    watch = null;
  }

  function elapsedMs(): number {
    const running = movingSince === null ? 0 : deps.now() - movingSince;
    return accumulatedMs + running;
  }

  return {
    $status,
    $activity,
    $error,
    elapsedMs,

    async start(type) {
      if ($status.get() === "recording" || $status.get() === "paused") return;
      const at = deps.now();
      accumulatedMs = 0;
      movingSince = at;
      pauseCount = 0;
      finishAt = null;
      lastSavedAt = at;
      $error.set(null);
      $activity.set(startMove(type, at));
      $status.set("recording");
      // Seed the first fix so the map shows the start point right away instead of
      // "waiting for signal". Non-blocking; ignored if it fails or arrives after
      // the watch already delivered a point.
      void deps.geo
        .getCurrentPosition()
        .then((sample) => {
          const a = $activity.get();
          if (a && $status.get() === "recording" && a.points.length === 0) {
            appendPoint({ ...toTrackPoint(sample), st: deps.pedometer.$steps.get() });
          }
        })
        .catch(() => {});
      await deps.pedometer.start();
      await startWatch();
    },

    async pause() {
      if ($status.get() !== "recording") return;
      pauseCount++;
      if (movingSince !== null) {
        accumulatedMs += deps.now() - movingSince;
        movingSince = null;
      }
      $status.set("paused");
      deps.pedometer.pause();
      await stopWatch();
      // A pause is a natural checkpoint — persist the draft immediately.
      const act = $activity.get();
      if (act) {
        lastSavedAt = deps.now();
        await deps.repo.save(act);
      }
    },

    requestFinish() {
      if ($status.get() !== "recording") return;
      finishAt = deps.now(); // finish() will end here; recording keeps running
    },

    cancelFinish() {
      finishAt = null; // kept going — nothing was paused, so nothing is lost
    },

    async resume() {
      if ($status.get() !== "paused") return;
      finishAt = null;
      movingSince = deps.now();
      $status.set("recording");
      deps.pedometer.resume();
      await startWatch();
    },

    async finish() {
      const status = $status.get();
      if (status !== "recording" && status !== "paused") return null;
      // End at the requested finish instant (if any), so points captured while
      // the user weighed the confirmation don't count once they confirm.
      const end = finishAt ?? deps.now();
      if (status === "recording" && movingSince !== null) {
        accumulatedMs += Math.max(0, end - movingSince);
      }
      movingSince = null;
      const movingMs = accumulatedMs;
      await stopWatch();
      const steps = await deps.pedometer.stop();

      const act = $activity.get();
      if (!act) return null;
      const finished: MoveActivity = {
        ...act,
        points: act.points.filter((p) => p.t <= end),
        endedAt: end,
        steps,
        movingMs,
        pauses: pauseCount,
      };
      finishAt = null;
      await deps.repo.save(finished);
      $activity.set(finished);
      $status.set("finished");
      return finished;
    },

    async discard() {
      // finish() sets "finished" and has already saved the real record — never
      // delete that. Only an in-progress draft (endedAt null) gets removed here.
      const act = $activity.get();
      const wasFinished = $status.get() === "finished";
      await stopWatch();
      await deps.pedometer.stop();
      if (act && !wasFinished && act.endedAt === null) {
        await deps.repo.remove(act.id);
      }
      accumulatedMs = 0;
      movingSince = null;
      pauseCount = 0;
      finishAt = null;
      lastSavedAt = 0;
      $activity.set(null);
      $error.set(null);
      $status.set("idle");
    },

    async restore(activity) {
      if ($status.get() === "recording" || $status.get() === "paused") return;
      const at = deps.now();
      const pts = activity.points;
      // Continue elapsed from the recovered span; exact paused gaps are unknown.
      accumulatedMs = activity.movingMs ?? (pts.length > 1 ? pts.at(-1)!.t - pts[0]!.t : 0);
      movingSince = at;
      pauseCount = activity.pauses ?? 0;
      finishAt = null;
      lastSavedAt = at;
      $error.set(null);
      $activity.set(activity);
      $status.set("recording");
      await deps.pedometer.start();
      await startWatch();
    },

    async flush() {
      const act = $activity.get();
      const status = $status.get();
      if (act && act.endedAt === null && (status === "recording" || status === "paused")) {
        lastSavedAt = deps.now();
        await deps.repo.save(act);
      }
    },
  };
}
