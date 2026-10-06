/**
 * Track-point ordering. The GPS plugin can deliver fixes late and out of order:
 * while the app is backgrounded it buffers locations, then flushes the backlog
 * all at once when it comes back, interleaved with new live fixes. Appended in
 * arrival order, that draws straight "chords" across the route (a jump to the
 * present and back to the past). Points must be kept in time order.
 */

import type { Activity } from "./activity";
import type { TrackPoint } from "./track-point";

/**
 * Index at which a point with time `t` belongs in a time-ordered array (after
 * any equal times, so arrival order breaks ties). Binary search.
 */
export function insertionIndex(points: TrackPoint[], t: number): number {
  let lo = 0;
  let hi = points.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (points[mid]!.t <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Make the cumulative step stamps monotone. A late-delivered fix gets stamped
 * with the step count at ARRIVAL, which is ahead of the fixes after it in time.
 * A backward running minimum pulls those back to the next real stamp.
 */
function monotoneSteps(points: TrackPoint[]): TrackPoint[] {
  let min = Infinity;
  let changed = false;
  const out = points.slice();
  for (let i = out.length - 1; i >= 0; i--) {
    const st = out[i]!.st;
    if (st == null) continue;
    if (st > min) {
      out[i] = { ...out[i]!, st: min };
      changed = true;
    } else {
      min = st;
    }
  }
  return changed ? out : points;
}

/**
 * Points sorted by time (stable), with same-instant duplicates dropped and step
 * stamps made monotone. Returns the input untouched when it's already clean, so
 * it's cheap to apply on every load.
 */
export function orderTrackPoints(points: TrackPoint[]): TrackPoint[] {
  let ordered = true;
  for (let i = 1; i < points.length; i++) {
    if (points[i]!.t <= points[i - 1]!.t) {
      ordered = false;
      break;
    }
  }
  let out = points;
  if (!ordered) {
    const sorted = points
      .map((p, i) => ({ p, i }))
      .sort((a, b) => a.p.t - b.p.t || a.i - b.i)
      .map((x) => x.p);
    out = sorted.filter((p, i) => i === 0 || p.t !== sorted[i - 1]!.t);
  }
  return monotoneSteps(out);
}

/** An activity with its track (if any) in time order; untouched when already clean. */
export function withOrderedPoints(a: Activity): Activity {
  if (a.kind !== "move") return a;
  const points = orderTrackPoints(a.points);
  return points === a.points ? a : { ...a, points };
}
