/**
 * Simple GPS Kalman smoothing — the well-known constant-position/velocity filter
 * (a scalar variance with reported accuracy as measurement noise, `q` metres/s of
 * process noise). It doesn't drop points; it pulls each fix toward the estimate,
 * so a jittery track comes out smoother and its distance closer to reality.
 *
 * Pure: the whole state lives in the closure, so it's deterministic and testable.
 */

import type { TrackPoint } from "./track-point";

/** Smooth a track. `q` ~ expected speed in m/s (3 ≈ a brisk walk). */
export function kalmanFilter(points: TrackPoint[], q = 3): TrackPoint[] {
  let variance = -1; // negative = uninitialised
  let lat = 0;
  let lng = 0;
  let tsMs = 0;

  return points.map((p) => {
    const accuracy = Math.max(1, p.acc ?? 1);
    if (variance < 0) {
      tsMs = p.t;
      lat = p.lat;
      lng = p.lng;
      variance = accuracy * accuracy;
    } else {
      const dt = p.t - tsMs;
      if (dt > 0) {
        variance += (dt * q * q) / 1000; // predict: grow uncertainty over time
        tsMs = p.t;
      }
      const k = variance / (variance + accuracy * accuracy); // Kalman gain
      lat += k * (p.lat - lat);
      lng += k * (p.lng - lng);
      variance = (1 - k) * variance;
    }
    return { ...p, lat, lng };
  });
}
