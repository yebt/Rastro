/**
 * Personal-record badges. An activity earns a badge when it holds a record among
 * all activities of its kind — longest distance, fastest pace/km, most steps for
 * moves; best session/set for exercises; best routine. Derived (records aren't
 * stored), so they recompute against the full history.
 */

import { splits } from "./analytics";
import type { Activity, ExerciseActivity, MoveActivity, RoutineActivity } from "./activity";
import { cleanTrack } from "./clean";
import { avgPaceSecPerKm, distanceMeters } from "./metrics";
import { totalReps } from "./exercises";
import { routineEntriesReps } from "./routine-run";

function bestSplit(m: MoveActivity): number | null {
  const ps = splits(cleanTrack(m.points))
    .map((s) => s.paceSecPerKm)
    .filter((x): x is number => x != null);
  return ps.length ? Math.min(...ps) : null;
}

export function activityBadges(activity: Activity, all: Activity[]): string[] {
  const out: string[] = [];

  if (activity.kind === "move") {
    const moves = all.filter((a): a is MoveActivity => a.kind === "move");
    const clean = cleanTrack(activity.points);

    const dist = distanceMeters(clean);
    if (dist > 0 && dist >= Math.max(...moves.map((m) => distanceMeters(cleanTrack(m.points))))) {
      out.push("Distancia récord");
    }
    const pace = avgPaceSecPerKm(clean);
    const paces = moves.map((m) => avgPaceSecPerKm(cleanTrack(m.points))).filter((x): x is number => x != null);
    if (pace != null && paces.length && pace <= Math.min(...paces)) out.push("Ritmo récord");

    const bk = bestSplit(activity);
    const bks = moves.map(bestSplit).filter((x): x is number => x != null);
    if (bk != null && bks.length && bk <= Math.min(...bks)) out.push("Mejor km");

    const steps = activity.steps ?? 0;
    if (steps > 0 && steps >= Math.max(...moves.map((m) => m.steps ?? 0))) out.push("Más pasos");
    return out;
  }

  if (activity.kind === "exercise") {
    const exs = all.filter((a): a is ExerciseActivity => a.kind === "exercise");
    const session = totalReps(activity.sets);
    if (session > 0 && session >= Math.max(...exs.map((a) => totalReps(a.sets)))) out.push("Mejor sesión");
    const set = Math.max(0, ...activity.sets.map((s) => s.reps));
    if (set > 0 && set >= Math.max(0, ...exs.flatMap((a) => a.sets.map((s) => s.reps)))) out.push("Mejor serie");
    return out;
  }

  const rts = all.filter((a): a is RoutineActivity => a.kind === "routine");
  const reps = routineEntriesReps(activity.entries);
  if (reps > 0 && reps >= Math.max(...rts.map((a) => routineEntriesReps(a.entries)))) out.push("Mejor rutina");
  return out;
}

/**
 * The ids of every activity that holds at least one record — computed in a
 * single pass over the history (maxima once, then flag), so a list can show a
 * medal per row without the O(n²) cost of badging each row separately.
 */
export function recordActivityIds(all: Activity[]): Set<string> {
  const ids = new Set<string>();

  const moves = all
    .filter((a): a is MoveActivity => a.kind === "move")
    .map((m) => {
      const clean = cleanTrack(m.points);
      return { id: m.id, dist: distanceMeters(clean), pace: avgPaceSecPerKm(clean), bs: bestSplit(m), steps: m.steps ?? 0 };
    });
  if (moves.length) {
    const maxDist = Math.max(...moves.map((m) => m.dist));
    const paces = moves.map((m) => m.pace).filter((x): x is number => x != null);
    const minPace = paces.length ? Math.min(...paces) : Infinity;
    const bss = moves.map((m) => m.bs).filter((x): x is number => x != null);
    const minBs = bss.length ? Math.min(...bss) : Infinity;
    const maxSteps = Math.max(...moves.map((m) => m.steps));
    for (const m of moves) {
      if (
        (m.dist > 0 && m.dist >= maxDist) ||
        (m.pace != null && m.pace <= minPace) ||
        (m.bs != null && m.bs <= minBs) ||
        (m.steps > 0 && m.steps >= maxSteps)
      ) {
        ids.add(m.id);
      }
    }
  }

  const exs = all.filter((a): a is ExerciseActivity => a.kind === "exercise");
  if (exs.length) {
    const maxSession = Math.max(...exs.map((a) => totalReps(a.sets)));
    const maxSet = Math.max(0, ...exs.flatMap((a) => a.sets.map((s) => s.reps)));
    for (const a of exs) {
      const set = Math.max(0, ...a.sets.map((s) => s.reps));
      if ((totalReps(a.sets) > 0 && totalReps(a.sets) >= maxSession) || (set > 0 && set >= maxSet)) ids.add(a.id);
    }
  }

  const rts = all.filter((a): a is RoutineActivity => a.kind === "routine");
  if (rts.length) {
    const maxReps = Math.max(...rts.map((a) => routineEntriesReps(a.entries)));
    for (const a of rts) {
      const reps = routineEntriesReps(a.entries);
      if (reps > 0 && reps >= maxReps) ids.add(a.id);
    }
  }

  return ids;
}
