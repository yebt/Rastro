/**
 * Permission registry.
 *
 * A single place that describes the permissions Rastro asks for and how to
 * check/request each. Today only location is live — wired straight to the
 * geolocation port, so there's no second source of truth. Notifications and
 * physical-activity join this list when their plugins land; the setup screen
 * and settings render whatever is registered here.
 */

import { geolocation, type PermissionState } from "../geolocation";
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

export function requestPermission(id: PermissionId): Promise<PermissionState> {
  switch (id) {
    case "location":
      return geolocation().requestPermission();
  }
}
