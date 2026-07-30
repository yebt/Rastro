/**
 * Permission registry.
 *
 * One place describing the permissions Rastro asks for and how to check/request
 * each. The setup screen and the app-entry flow render/prompt whatever is
 * registered here. Non-native platforms report "unsupported" so the app still
 * works on the web — the prompts just don't apply.
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { CapacitorPedometer } from "@capgo/capacitor-pedometer";
import {
  geolocation,
  type PermissionState,
  requestLocationOn,
} from "../geolocation";
import type { IconName } from "../../shared/ui";

export type PermissionId = "location" | "notifications" | "activity";

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
  {
    id: "notifications",
    title: "Notificaciones",
    why: "Para mostrar el estado del registro mientras rastreás, incluso con la pantalla apagada.",
    icon: "bell",
  },
  {
    id: "activity",
    title: "Actividad física",
    why: "Para contar tus pasos con el sensor de movimiento del teléfono.",
    icon: "steps",
  },
];

function norm(state: string): PermissionState {
  if (state === "granted") return "granted";
  if (state === "denied") return "denied";
  if (state === "unsupported") return "unsupported";
  return "prompt"; // includes prompt-with-rationale
}

async function checkNotifications(mode: "check" | "request"): Promise<PermissionState> {
  if (!Capacitor.isNativePlatform()) return "unsupported";
  try {
    const status =
      mode === "check"
        ? await LocalNotifications.checkPermissions()
        : await LocalNotifications.requestPermissions();
    return norm(status.display);
  } catch {
    return "unsupported";
  }
}

async function checkActivity(mode: "check" | "request"): Promise<PermissionState> {
  if (!Capacitor.isNativePlatform()) return "unsupported";
  try {
    const status =
      mode === "check"
        ? await CapacitorPedometer.checkPermissions()
        : await CapacitorPedometer.requestPermissions();
    return norm(status.activityRecognition);
  } catch {
    return "unsupported";
  }
}

export function checkPermission(id: PermissionId): Promise<PermissionState> {
  switch (id) {
    case "location":
      return geolocation().checkPermission();
    case "notifications":
      return checkNotifications("check");
    case "activity":
      return checkActivity("check");
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
    case "notifications":
      return checkNotifications("request");
    case "activity":
      return checkActivity("request");
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
