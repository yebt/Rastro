/**
 * Hand a rendered card (PNG data URL) to the OS share sheet. On the web it
 * falls back to a download. Rendering and persistence live elsewhere; this
 * module only knows how to *send* an image.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { MoveActivity } from "../tracking";
import { renderRouteCard } from "./route-card";
import type { ShareTheme } from "./themes";

/** Send an already-rendered PNG data URL. `name` is the file stem. */
export async function shareImage(dataUrl: string, name: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${name}.png`;
    a.click();
    return;
  }

  const base64 = dataUrl.split(",")[1] ?? "";
  const { uri } = await Filesystem.writeFile({
    path: `${name}.png`,
    data: base64,
    directory: Directory.Cache,
  });
  await Share.share({ title: "Rastro", text: "Mi recorrido", files: [uri] });
}

/** Convenience: render a route with a theme and share it in one call. */
export async function shareRoute(activity: MoveActivity, theme?: ShareTheme): Promise<void> {
  await shareImage(await renderRouteCard(activity, theme), `rastro-${activity.id}`);
}
