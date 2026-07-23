/**
 * User settings persisted to localStorage. Kept tiny and synchronous so the UI
 * can read them without awaiting the activity repository.
 */

import { atom } from "nanostores";
import { type Accent, DEFAULT_ACCENT, isAccent } from "../lib/accent";

/** Which pedometer drives the primary steps/cadence: accelerometer (F2) or hardware (F6). */
export type StepSource = "accelerometer" | "hardware";

const STEP_KEY = "rastro.stepSource";
const MAP_KEY = "rastro.mapStyle";
const SETUP_KEY = "rastro.setupDone";
const THEME_KEY = "rastro.theme";
const ACCENT_KEY = "rastro.accent";
const NAME_KEY = "rastro.name";

function readStepSource(): StepSource {
  try {
    // Default to hardware: it measures better where available; falls back to the
    // accelerometer automatically when no hardware counter fired.
    return globalThis.localStorage?.getItem(STEP_KEY) === "accelerometer"
      ? "accelerometer"
      : "hardware";
  } catch {
    return "hardware";
  }
}

export const $stepSource = atom<StepSource>(readStepSource());

export function setStepSource(source: StepSource): void {
  $stepSource.set(source);
  try {
    globalThis.localStorage?.setItem(STEP_KEY, source);
  } catch {
    // ignore — private mode / SSR
  }
}

/** A selectable base-map tile layer (all free, no API key). */
export interface MapStyle {
  id: string;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
  /** true for dark-toned tiles — lets the UI hint contrast */
  dark?: boolean;
}

export const MAP_STYLES: MapStyle[] = [
  {
    id: "osm",
    label: "Estándar (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap",
    maxZoom: 19,
  },
  {
    id: "carto-voyager",
    label: "Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap · © CARTO",
    maxZoom: 20,
    subdomains: "abcd",
  },
  {
    id: "carto-light",
    label: "Claro",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap · © CARTO",
    maxZoom: 20,
    subdomains: "abcd",
  },
  {
    id: "carto-dark",
    label: "Oscuro",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap · © CARTO",
    maxZoom: 20,
    subdomains: "abcd",
    dark: true,
  },
  {
    id: "opentopo",
    label: "Topográfico",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap · © OpenTopoMap",
    maxZoom: 17,
  },
];

export function mapStyleById(id: string): MapStyle {
  return MAP_STYLES.find((s) => s.id === id) ?? MAP_STYLES[0]!;
}

function readMapStyle(): string {
  try {
    const id = globalThis.localStorage?.getItem(MAP_KEY);
    return id && MAP_STYLES.some((s) => s.id === id) ? id : "osm";
  } catch {
    return "osm";
  }
}

export const $mapStyle = atom<string>(readMapStyle());

export function setMapStyle(id: string): void {
  $mapStyle.set(id);
  try {
    globalThis.localStorage?.setItem(MAP_KEY, id);
  } catch {
    // ignore
  }
}

/** Whether the first-run permissions setup has been completed/dismissed. */
function readSetupDone(): boolean {
  try {
    return globalThis.localStorage?.getItem(SETUP_KEY) === "1";
  } catch {
    return false;
  }
}

export const $setupDone = atom<boolean>(readSetupDone());

export function completeSetup(): void {
  $setupDone.set(true);
  try {
    globalThis.localStorage?.setItem(SETUP_KEY, "1");
  } catch {
    // ignore
  }
}

/** Color theme: follow the system, or force light/dark. */
export type Theme = "auto" | "light" | "dark";

function readTheme(): Theme {
  try {
    const t = globalThis.localStorage?.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "auto";
  } catch {
    return "auto";
  }
}

export const $theme = atom<Theme>(readTheme());

export function setTheme(theme: Theme): void {
  $theme.set(theme);
  try {
    globalThis.localStorage?.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

/** Brand accent color (F18). Default green; drives the --accent* CSS variables. */
function readAccent(): Accent {
  try {
    const a = globalThis.localStorage?.getItem(ACCENT_KEY);
    return isAccent(a) ? a : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

export const $accent = atom<Accent>(readAccent());

export function setAccent(accent: Accent): void {
  $accent.set(accent);
  try {
    globalThis.localStorage?.setItem(ACCENT_KEY, accent);
  } catch {
    // ignore
  }
}

/** Optional display name for the Home greeting / Profile header. Empty by default. */
function readName(): string {
  try {
    return globalThis.localStorage?.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export const $name = atom<string>(readName());

export function setName(name: string): void {
  const trimmed = name.trim();
  $name.set(trimmed);
  try {
    globalThis.localStorage?.setItem(NAME_KEY, trimmed);
  } catch {
    // ignore
  }
}
