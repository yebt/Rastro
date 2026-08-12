/**
 * Backup / export / import — durable, portable copies of everything the user
 * would hate to lose. Ported from v1's folder-based approach: a single JSON with
 * all activities, routines, the exercise catalog and the profile, written to
 * Documents/Rastro on device (web falls back to a download). IndexedDB alone
 * doesn't survive an uninstall and isn't portable; a file in Documents is.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { loadActivities } from "../history/history.store";
import { $heightCm, $name, $weights, setHeight, setName, setWeights, type WeightEntry } from "../profile/profile.store";
import {
  type Activity,
  activityRepository,
  $exercises,
  $routines,
  type ExerciseDef,
  type Routine,
  setExercises,
  setRoutines,
} from "../tracking";

const MIME = "application/json";
const BACKUP_DIR = "Rastro";
export const BACKUP_VERSION = 1;

export interface BackupPayload {
  app: "rastro";
  version: number;
  exportedAt: number;
  activities: Activity[];
  routines: Routine[];
  exercises: ExerciseDef[];
  profile: {
    name: string;
    heightCm: number | null;
    weights: WeightEntry[];
  };
}

export type ImportMode = "merge" | "replace";

/** Collect every store into one payload. `now` is injected for testability. */
export async function buildBackup(now: number): Promise<BackupPayload> {
  return {
    app: "rastro",
    version: BACKUP_VERSION,
    exportedAt: now,
    activities: await activityRepository().list(),
    routines: $routines.get(),
    exercises: $exercises.get(),
    profile: {
      name: $name.get(),
      heightCm: $heightCm.get(),
      weights: $weights.get(),
    },
  };
}

/** Serialize a payload to pretty JSON plus a chronological, FS-safe filename. */
export function serializeBackup(payload: BackupPayload): { json: string; filename: string } {
  const stamp = new Date(payload.exportedAt).toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return { json: JSON.stringify(payload, null, 2), filename: `rastro-${stamp}.json` };
}

/** Parse and validate an imported file. Throws on anything that isn't ours. */
export function parseBackup(text: string): BackupPayload {
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("Archivo inválido");
  const d = data as Partial<BackupPayload>;
  if (d.app !== "rastro" || !Array.isArray(d.activities)) {
    throw new Error("No parece un respaldo de Rastro");
  }
  return {
    app: "rastro",
    version: typeof d.version === "number" ? d.version : 1,
    exportedAt: typeof d.exportedAt === "number" ? d.exportedAt : Date.now(),
    activities: d.activities,
    routines: Array.isArray(d.routines) ? d.routines : [],
    exercises: Array.isArray(d.exercises) ? d.exercises : [],
    profile: {
      name: d.profile?.name ?? "",
      heightCm: d.profile?.heightCm ?? null,
      weights: Array.isArray(d.profile?.weights) ? d.profile!.weights : [],
    },
  };
}

/**
 * Load a payload into the app. "replace" wipes first; "merge" keeps existing
 * activities (deduping by id) and prefers the imported profile/catalog only when
 * the current one is empty. Returns how many activities were added.
 */
export async function applyBackup(payload: BackupPayload, mode: ImportMode): Promise<{ added: number }> {
  const repo = activityRepository();

  if (mode === "replace") {
    await repo.clear();
    for (const a of payload.activities) await repo.save(a);
    setRoutines(payload.routines);
    setExercises(payload.exercises);
    setName(payload.profile.name);
    setHeight(payload.profile.heightCm);
    setWeights(payload.profile.weights);
    await loadActivities();
    return { added: payload.activities.length };
  }

  // merge
  const existing = new Set((await repo.list()).map((a) => a.id));
  let added = 0;
  for (const a of payload.activities) {
    if (!existing.has(a.id)) {
      await repo.save(a);
      added++;
    }
  }
  // Routines / exercises: union by id.
  const routineIds = new Set($routines.get().map((r) => r.id));
  setRoutines([...$routines.get(), ...payload.routines.filter((r) => !routineIds.has(r.id))]);
  const exIds = new Set($exercises.get().map((e) => e.id));
  setExercises([...$exercises.get(), ...payload.exercises.filter((e) => !exIds.has(e.id))]);
  // Profile: only fill blanks so a merge never clobbers current identity.
  if (!$name.get() && payload.profile.name) setName(payload.profile.name);
  if ($heightCm.get() === null && payload.profile.heightCm !== null) setHeight(payload.profile.heightCm);
  if ($weights.get().length === 0 && payload.profile.weights.length) setWeights(payload.profile.weights);

  await loadActivities();
  return { added };
}

function webDownload(json: string, filename: string): void {
  const blob = new Blob([json], { type: MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Save a local copy. Returns a short human location for the toast (e.g.
 * "Documentos/Rastro", "Descargas") or null if it couldn't be saved.
 */
export async function saveBackupFile(json: string, filename: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    webDownload(json, filename);
    return "Descargas";
  }
  try {
    await Filesystem.writeFile({
      path: `${BACKUP_DIR}/${filename}`,
      data: json,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    return `Documentos/${BACKUP_DIR}`;
  } catch {
    try {
      await Filesystem.writeFile({
        path: `${BACKUP_DIR}/${filename}`,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      return "almacenamiento de la app";
    } catch {
      return null;
    }
  }
}

/** Share any text file (e.g. a GPX export) via the OS sheet / web download. */
export async function shareTextFile(content: string, filename: string, title = "Rastro"): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    webDownload(content, filename);
    return true;
  }
  await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
  try {
    await Share.share({ title, url: uri });
    return true;
  } catch (e) {
    if (/cancel/i.test(String(e))) return false;
    throw e;
  }
}

/** Hand the backup to another app. Returns false when the user cancels. */
export async function shareBackupFile(json: string, filename: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    webDownload(json, filename);
    return true;
  }
  await Filesystem.writeFile({
    path: filename,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
  try {
    await Share.share({ title: "Respaldo de Rastro", text: "Respaldo de tus actividades", url: uri });
    return true;
  } catch (e) {
    if (/cancel/i.test(String(e))) return false;
    throw e;
  }
}

/** Keep the `keep` most recent local copies (filenames sort chronologically). */
export async function cleanOldBackups(keep = 5): Promise<number> {
  if (!Capacitor.isNativePlatform()) return -1;
  let files: string[];
  try {
    const res = await Filesystem.readdir({ path: BACKUP_DIR, directory: Directory.Documents });
    files = res.files.map((f) => f.name).filter((n) => n.endsWith(".json"));
  } catch {
    return 0;
  }
  const old = files.toSorted().toReversed().slice(keep);
  const results = await Promise.all(
    old.map((name) =>
      Filesystem.deleteFile({ path: `${BACKUP_DIR}/${name}`, directory: Directory.Documents })
        .then(() => true)
        .catch(() => false),
    ),
  );
  return results.filter(Boolean).length;
}
