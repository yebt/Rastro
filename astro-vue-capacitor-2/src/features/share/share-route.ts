/**
 * Render a route card and hand it to the OS share sheet. On the web it falls
 * back to a download.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { MoveActivity } from "../tracking";
import { renderRouteCard } from "./route-card";

export async function shareRoute(activity: MoveActivity): Promise<void> {
  const dataUrl = renderRouteCard(activity);

  if (!Capacitor.isNativePlatform()) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `rastro-${activity.id}.png`;
    a.click();
    return;
  }

  const base64 = dataUrl.split(",")[1] ?? "";
  const { uri } = await Filesystem.writeFile({
    path: `rastro-${activity.id}.png`,
    data: base64,
    directory: Directory.Cache,
  });
  await Share.share({ title: "Rastro", text: "Mi recorrido", files: [uri] });
}
