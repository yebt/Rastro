/**
 * Display formatters for movement stats. Pure string helpers, kept out of the
 * domain (which deals in numbers) so the metrics layer stays UI-agnostic.
 */

/** Duration as M:SS, or H:MM:SS once it passes an hour. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/**
 * Distance split into value + unit for the UI: whole metres under a kilometre,
 * kilometres with two decimals above it. Keeps short distances readable ("820 m")
 * instead of "0.82 km".
 */
export function distanceParts(metres: number): { value: string; unit: string } {
  if (metres < 1000) return { value: String(Math.round(metres)), unit: "m" };
  return { value: (metres / 1000).toFixed(2), unit: "km" };
}

/** Pace seconds-per-km → M'SS", or "—" when there's no pace yet (null). */
export function formatPace(secPerKm: number | null): string {
  if (secPerKm === null || !Number.isFinite(secPerKm) || secPerKm <= 0) return "—";
  const total = Math.round(secPerKm);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}'${String(s).padStart(2, "0")}"`;
}

/** Metres-per-second → km/h with one decimal (unit shown separately). */
export function formatSpeed(mps: number): string {
  return (mps * 3.6).toFixed(1);
}

/** Friendly date+time for an activity: "Hoy 14:30", "Ayer 09:12", "12 jun 14:30". */
export function formatActivityDate(t: number, now: number = Date.now()): string {
  const d = new Date(t);
  const time = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(d);
  const startOfDay = (ms: number): number => {
    const x = new Date(ms);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const days = Math.round((startOfDay(now) - startOfDay(t)) / 86_400_000);
  if (days === 0) return `Hoy ${time}`;
  if (days === 1) return `Ayer ${time}`;
  const date = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(d);
  return `${date} ${time}`;
}
