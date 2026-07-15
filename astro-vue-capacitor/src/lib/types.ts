/**
 * Rastro data model (SPECS §6).
 * Local-first: these shapes are what we persist and export/import as JSON.
 */

export type GpsType = 'Caminata' | 'Trote' | 'Carrera';
export type ActivityKind = 'gps' | 'dominadas';

/** A raw GPS reading captured while tracking (in-memory, main thread). */
export interface RoutePoint {
  lat: number;
  lng: number;
  /** epoch ms when the point was recorded */
  t: number;
}

/** Simplified route point persisted with an activity: [lat, lng]. */
export type RouteTuple = [number, number];

/** Time-series sample for analysis (SPECS §6.1, Phase 1.1+). */
export interface Sample {
  /** seconds since activity start */
  t: number;
  /** accumulated meters */
  d: number;
  /** speed in m/s */
  v: number;
  /** cadence in steps/min */
  cad?: number;
  /** accuracy in meters */
  acc?: number;
}

export interface GpsActivity {
  id: string;
  kind: 'gps';
  type: GpsType;
  /** epoch ms, activity start */
  date: number;
  /** meters */
  distance: number;
  /** seconds, excluding pauses */
  duration: number;
  route: RouteTuple[];
  /** NEW (Phase 1.1+): time series for reports */
  samples?: Sample[];
  /** NEW (Phase 2): total steps */
  steps?: number;
  /** provenance of the data */
  source?: {
    gps?: boolean;
    pedometer?: 'hardware' | 'accelerometer' | null;
  };
}

export interface DominadasSession {
  id: string;
  kind: 'dominadas';
  type: 'dominadas';
  date: number;
  sets: number[];
  total: number;
  notes?: string;
}

export type Activity = GpsActivity | DominadasSession;

/** Records / goals (SPECS §6.3, Phase 3). */
export interface Goals {
  pullupsDaily?: number;
  kmWeekly?: number;
}

export interface Prs {
  fastest1k?: number;
  fastest5k?: number;
  longestRun?: number;
  bestPullSession?: number;
  bestPullSet?: number;
}

export interface Database {
  activities: Activity[];
  goals?: Goals;
  prs?: Prs;
}

export function isGps(a: Activity): a is GpsActivity {
  return a.kind === 'gps';
}

export function isDominadas(a: Activity): a is DominadasSession {
  return a.kind === 'dominadas';
}
