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
import { type MoveActivity, type MoveType, startMove, toTrackPoint } from "../tracking";

export type RecordingStatus = "idle" | "recording" | "paused" | "finished";

export interface RecorderDeps {
  geo: Geolocation;
  repo: ActivityRepository;
  /** Step counter, driven in lockstep with the GPS watch. */
  pedometer: Pedometer;
  /** Injected clock — Date.now in production, controllable in tests. */
  now: () => number;
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
   * Freeze for a finish decision: like pause but it doesn't count as a pause and
   * it stamps the finish instant, so a slow confirmation keeps the stats as they
   * were when the user hit finish. resume() undoes it if they keep going.
   */
  pauseForFinish(): Promise<void>;
  resume(): Promise<void>;
  /** Stop, stamp the end time, and persist. Returns the saved activity. */
  finish(): Promise<MoveActivity | null>;
  /** Stop and drop the session without saving. */
  discard(): Promise<void>;
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

  async function startWatch(): Promise<void> {
    watch = await deps.geo.watch(
      (sample) => {
        const act = $activity.get();
        if (!act || $status.get() !== "recording") return;
        $activity.set({ ...act, points: [...act.points, toTrackPoint(sample)] });
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
            $activity.set({ ...a, points: [toTrackPoint(sample)] });
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
    },

    async pauseForFinish() {
      if ($status.get() !== "recording") return;
      if (movingSince !== null) {
        accumulatedMs += deps.now() - movingSince;
        movingSince = null;
      }
      finishAt = deps.now(); // the stats freeze at this instant
      $status.set("paused");
      deps.pedometer.pause();
      await stopWatch();
    },

    async resume() {
      if ($status.get() !== "paused") return;
      finishAt = null; // kept going — drop the pending finish instant
      movingSince = deps.now();
      $status.set("recording");
      deps.pedometer.resume();
      await startWatch();
    },

    async finish() {
      const status = $status.get();
      if (status !== "recording" && status !== "paused") return null;
      if (status === "recording" && movingSince !== null) {
        accumulatedMs += deps.now() - movingSince;
      }
      movingSince = null;
      const movingMs = accumulatedMs;
      await stopWatch();
      const steps = await deps.pedometer.stop();

      const act = $activity.get();
      if (!act) return null;
      const finished: MoveActivity = {
        ...act,
        endedAt: finishAt ?? deps.now(),
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
      await stopWatch();
      await deps.pedometer.stop();
      accumulatedMs = 0;
      movingSince = null;
      pauseCount = 0;
      finishAt = null;
      $activity.set(null);
      $error.set(null);
      $status.set("idle");
    },
  };
}
