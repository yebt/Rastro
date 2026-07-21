/**
 * Data export/backup (SPECS §4.4). Two explicit actions:
 *  - saveBackup:  keep a local copy (web download / native file in Documents).
 *  - shareBackup: hand it to another app (Web Share / native share sheet).
 *
 * An `<a download>` blob does not work in the Android WebView, so native paths
 * go through @capacitor/filesystem + @capacitor/share instead.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const MIME = "application/json";
/** Sub-folder under Documents where local copies live (native). */
const BACKUP_DIR = "Rastro";

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
 * "Documentos", "Descargas") or null if it couldn't be saved.
 */
export async function saveBackup(json: string, filename: string): Promise<string | null> {
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
      recursive: true, // create Documents/Rastro if missing
    });
    return `Documentos/${BACKUP_DIR}`;
  } catch {
    // Documents not writable on this device — fall back to app storage.
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

/**
 * Delete old local copies, keeping the `keep` most recent (filenames sort
 * chronologically). Returns the number deleted, or -1 when not on native.
 */
export async function cleanOldBackups(keep = 1): Promise<number> {
  if (!Capacitor.isNativePlatform()) return -1;
  let files: string[];
  try {
    const res = await Filesystem.readdir({ path: BACKUP_DIR, directory: Directory.Documents });
    files = res.files.map((f) => f.name).filter((n) => n.endsWith(".json"));
  } catch {
    return 0; // folder doesn't exist yet → nothing to clean
  }
  const old = files.toSorted().toReversed().slice(keep); // newest first, drop the kept ones
  const results = await Promise.all(
    old.map((name) =>
      Filesystem.deleteFile({ path: `${BACKUP_DIR}/${name}`, directory: Directory.Documents })
        .then(() => true)
        .catch(() => false),
    ),
  );
  return results.filter(Boolean).length;
}

/**
 * Share the backup with another app. Returns false when the user cancels the
 * sheet (nothing to report); throws on real failures.
 */
export async function shareBackup(json: string, filename: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    const file = new File([json], filename, { type: MIME });
    const nav = navigator as Navigator & {
      canShare?: (data?: unknown) => boolean;
      share?: (data?: unknown) => Promise<void>;
    };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: "Respaldo de Rastro" });
        return true;
      } catch (e) {
        if (/abort/i.test(String(e))) return false; // user dismissed
        // otherwise fall through to a plain download
      }
    }
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
