/**
 * Saved segments — a reusable stretch to compare across outings ("did I run this
 * same bit faster today?"). A segment stores its start/end coordinates and
 * length; an activity "matches" it when its track passes near the start and then
 * near the end (start before end in time). Pure and testable.
 */

import type { MoveActivity } from "./activity";
import { cleanTrack } from "./clean";
import { distanceMeters, haversineMeters } from "./metrics";
import type { TrackPoint } from "./track-point";

export interface LngLat {
  lat: number;
  lng: number;
}

export interface Segment {
  id: string;
  name: string;
  start: LngLat;
  end: LngLat;
  distanceM: number;
  /** Activity it was created from. */
  fromActivityId: string;
  createdAt: number;
}

export interface SegmentEffort {
  activityId: string;
  startedAt: number;
  elapsedMs: number;
  distanceM: number;
  paceSecPerKm: number | null;
}

/** The point reached at cumulative distance `target` along the route. */
function pointAtDistance(pts: TrackPoint[], target: number): TrackPoint {
  if (target <= 0) return pts[0]!;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = haversineMeters(pts[i - 1]!, pts[i]!);
    if (acc + d >= target) return pts[i]!;
    acc += d;
  }
  return pts[pts.length - 1]!;
}

/**
 * Build a segment from a cleaned activity route. Without a range it's the whole
 * route; with `fromM`/`toM` (metres) it's the sub-stretch between those distances
 * — so you can save just the hill or the last km and compare only that.
 */
export function segmentFromActivity(
  id: string,
  name: string,
  act: MoveActivity,
  createdAt: number,
  fromM?: number,
  toM?: number,
): Segment | null {
  const pts = cleanTrack(act.points);
  if (pts.length < 2) return null;
  const total = distanceMeters(pts);
  const from = fromM == null ? 0 : Math.max(0, Math.min(fromM, total));
  const to = toM == null ? total : Math.max(from, Math.min(toM, total));
  if (to - from < 1) return null;
  const start = pointAtDistance(pts, from);
  const end = pointAtDistance(pts, to);
  return {
    id,
    name,
    start: { lat: start.lat, lng: start.lng },
    end: { lat: end.lat, lng: end.lng },
    distanceM: to - from,
    fromActivityId: act.id,
    createdAt,
  };
}

function asPoint(ll: LngLat): TrackPoint {
  return { lat: ll.lat, lng: ll.lng, t: 0, alt: null, acc: null, altAcc: null, spd: null };
}

/**
 * The effort this activity made over the segment, or null if it doesn't match
 * (never came within `threshold` metres of both the start and the end, in order).
 */
export function matchSegment(seg: Segment, act: MoveActivity, threshold = 40): SegmentEffort | null {
  const pts = cleanTrack(act.points);
  if (pts.length < 2) return null;
  const startLL = asPoint(seg.start);
  const endLL = asPoint(seg.end);

  let si = -1;
  let sd = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const d = haversineMeters(pts[i]!, startLL);
    if (d < sd) {
      sd = d;
      si = i;
    }
  }
  if (si < 0 || sd > threshold) return null;

  let ei = -1;
  let ed = Infinity;
  for (let i = si + 1; i < pts.length; i++) {
    const d = haversineMeters(pts[i]!, endLL);
    if (d < ed) {
      ed = d;
      ei = i;
    }
  }
  if (ei < 0 || ed > threshold) return null;

  const elapsedMs = pts[ei]!.t - pts[si]!.t;
  if (elapsedMs <= 0) return null;
  const km = seg.distanceM / 1000;
  return {
    activityId: act.id,
    startedAt: act.startedAt,
    elapsedMs,
    distanceM: seg.distanceM,
    paceSecPerKm: km > 0 ? elapsedMs / 1000 / km : null,
  };
}

/** All matching efforts across activities, fastest first. */
export function segmentEfforts(seg: Segment, activities: MoveActivity[], threshold = 40): SegmentEffort[] {
  return activities
    .map((a) => matchSegment(seg, a, threshold))
    .filter((e): e is SegmentEffort => e != null)
    .sort((x, y) => (x.paceSecPerKm ?? Infinity) - (y.paceSecPerKm ?? Infinity));
}
