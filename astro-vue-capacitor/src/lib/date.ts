/** Date helpers. `dayKey` is pure; `relDate` renders Spanish relative dates (UI language). */

import { pad } from './format';

/** Local calendar-day key `YYYY-MM-DD` for grouping (e.g. "today"). */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MONTHS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/**
 * Human-friendly relative date in Spanish (app UI language).
 * `now` is injectable for deterministic tests.
 */
export function relDate(ts: number, now: number = Date.now()): string {
  const d = new Date(ts);
  const nowD = new Date(now);
  const days = Math.floor(
    (new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86_400_000,
  );
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (days === 0) return `Hoy ${hm}`;
  if (days === 1) return `Ayer ${hm}`;
  const year = d.getFullYear() !== nowD.getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}${year} · ${hm}`;
}
