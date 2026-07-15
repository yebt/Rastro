/** Number/time formatting helpers (SPECS §11). Pure. */

export function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

/** Format a duration in seconds as `h:mm:ss` (or `m:ss` under an hour). */
export function fmtTime(sec: number): string {
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Format pace (seconds per km) as `mm:ss`.
 * Returns an em dash for invalid, zero, or absurdly slow paces (> 1h/km).
 */
export function fmtPace(secPerKm: number): string {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0 || secPerKm > 3600) return "—";
  let m = Math.floor(secPerKm / 60);
  let s = Math.round(secPerKm % 60);
  if (s === 60) {
    m++;
    s = 0;
  }
  return `${m}:${pad(s)}`;
}

/** Pace in seconds/km from meters + seconds (0 when distance is negligible). */
export function paceSecPerKm(meters: number, seconds: number): number {
  const km = meters / 1000;
  return km > 0 ? seconds / km : 0;
}

/** Speed in km/h from meters + seconds. */
export function speedKmh(meters: number, seconds: number): number {
  return seconds > 0 ? meters / 1000 / (seconds / 3600) : 0;
}
