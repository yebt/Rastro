/**
 * Split a track into continuous segments, breaking wherever a time gap exceeds
 * `maxGapMs` — i.e. a pause (the GPS watch stops while paused, leaving one big
 * gap between the last point before and the first after). Renderers draw each
 * segment on its own so a pause never draws a straight line across the map.
 *
 * The threshold matches movingDurationMs's gap: a gap that doesn't count as
 * moving time is exactly the gap the route shouldn't bridge.
 */

import type { TrackPoint } from "./track-point";

export function routeSegments(points: TrackPoint[], maxGapMs = 10_000): TrackPoint[][] {
  const segments: TrackPoint[][] = [];
  let current: TrackPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i > 0 && points[i]!.t - points[i - 1]!.t > maxGapMs) {
      if (current.length) segments.push(current);
      current = [];
    }
    current.push(points[i]!);
  }
  if (current.length) segments.push(current);
  return segments;
}
