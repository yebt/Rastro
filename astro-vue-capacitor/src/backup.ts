/**
 * Data export/backup (SPECS §4.4). Web downloads a .json; native writes the file
 * and opens the share sheet, because an `<a download>` blob does not work in the
 * Android WebView (it silently saves nowhere the user can reach).
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * Export a JSON string as `filename`. Returns false only when the user cancels
 * the native share sheet (nothing left to report); throws on real failures.
 */
export async function exportBackup(json: string, filename: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }

  // Native: write to the app cache, then let the OS share/save it anywhere.
  await Filesystem.writeFile({
    path: filename,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
  try {
    await Share.share({
      title: "Respaldo de Rastro",
      text: "Respaldo de tus actividades",
      url: uri,
    });
    return true;
  } catch (e) {
    if (/cancel/i.test(String(e))) return false; // user dismissed the sheet
    throw e;
  }
}
