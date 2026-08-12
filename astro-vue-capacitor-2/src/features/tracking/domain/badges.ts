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
