/**
 * Permission registry.
 *
 * A single place that describes the permissions Rastro asks for and how to
 * check/request each. Today only location is live — wired straight to the
 * geolocation port, so there's no second source of truth. Notifications and
 * physical-activity join this list when their plugins land; the setup screen
 * and settings render whatever is registered here.
 */

import { geolocation, type PermissionState, requestLocationOn } from "../geolocation";
import type { IconName } from "../../shared/ui";

export type PermissionId = "location";

export interface PermissionDescriptor {
  id: PermissionId;
  title: string;
  /** Why Rastro needs it — shown to the user before asking. */
  why: string;
  icon: IconName;
}

export const PERMISSIONS: PermissionDescriptor[] = [
  {
    id: "location",
    title: "Ubicación",
    why: 'Para registrar tu recorrido con GPS. Elegí "Permitir siempre" para que siga con la pantalla apagada.',
    icon: "location",
  },
];

export function checkPermission(id: PermissionId): Promise<PermissionState> {
  switch (id) {
    case "location":
      return geolocation().checkPermission();
  }
}

export async function requestPermission(id: PermissionId): Promise<PermissionState> {
  switch (id) {
    case "location": {
      // The geolocation plugin THROWS instead of prompting while the OS location
      // toggle is off, so turn services on first via Play Services — which needs
      // no permission, shows a dialog only when off, and is an instant no-op when
      // already on. We deliberately do NOT probe with getCurrentPosition here:
      // that call auto-requests the permission itself, which made it prompt twice.
      await requestLocationOn();
      return geolocation().requestPermission();
    }
  }
}

/**
 * Prompt for every registered permission that's still undecided ('prompt').
 * Called on app entry so a returning user is asked just like on first run — the
 * v1 behaviour. Already-decided permissions (granted/denied) are left untouched,
 * so this never nags. Sequential so the native dialogs queue instead of racing.
 */
export async function requestPendingPermissions(): Promise<void> {
  for (const p of PERMISSIONS) {
    if ((await checkPermission(p.id)) === "prompt") await requestPermission(p.id);
  }
}
