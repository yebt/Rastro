/**
 * Image share/save for the F12 route card. Web uses the Web Share API (with a
 * download fallback); native writes the PNG and hands it to the Share plugin or
 * saves it under Documents/Rastro.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function base64Of(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Share a PNG (data URL). Returns false when the user cancels. */
export async function shareImage(dataUrl: string, filename: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    const nav = navigator as Navigator & {
      canShare?: (d?: unknown) => boolean;
      share?: (d?: unknown) => Promise<void>;
    };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: "Mi ruta en Rastro" });
        return true;
      } catch (e) {
        if (/abort/i.test(String(e))) return false;
      }
    }
    downloadDataUrl(dataUrl, filename);
    return true;
  }

  await Filesystem.writeFile({ path: filename, data: base64Of(dataUrl), directory: Directory.Cache });
  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
  try {
    await Share.share({ title: "Mi ruta en Rastro", files: [uri] });
    return true;
  } catch (e) {
    if (/cancel/i.test(String(e))) return false;
    throw e;
  }
}

/** Save a PNG (data URL) locally. Returns a human location, or null on failure. */
export async function saveImage(dataUrl: string, filename: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    downloadDataUrl(dataUrl, filename);
    return "Descargas";
  }
  try {
    await Filesystem.writeFile({
      path: `Rastro/${filename}`,
      data: base64Of(dataUrl),
      directory: Directory.Documents,
      recursive: true,
    });
    return "Documentos/Rastro";
  } catch {
    return null;
  }
}
