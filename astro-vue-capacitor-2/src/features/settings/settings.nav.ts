/**
 * Which settings sub-page is open, or null for the category menu.
 *
 * A tiny store instead of a router: the app is a single island, and settings is
 * a shallow menu → page stack. Each category is its own dedicated page so it can
 * grow without crowding the others.
 */

import { atom } from "nanostores";
import type { IconName } from "../../shared/ui";

export type SettingsPage = "profile" | "appearance" | "recording" | "data" | "about";

export interface SettingsCategory {
  id: SettingsPage;
  label: string;
  hint: string;
  icon: IconName;
}

/** Menu order and copy. Each entry maps to a dedicated page component. */
export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  { id: "profile", label: "Perfil", hint: "Nombre, apodo, peso y altura", icon: "profile" },
  { id: "appearance", label: "Apariencia", hint: "Tema y color de acento", icon: "theme" },
  { id: "recording", label: "Registro", hint: "Permisos y captura", icon: "location" },
  { id: "data", label: "Datos", hint: "Exportar, importar y borrar", icon: "data" },
  { id: "about", label: "Acerca de", hint: "Versión e información", icon: "info" },
];

export const $settingsPage = atom<SettingsPage | null>(null);

export function openSettingsPage(page: SettingsPage): void {
  $settingsPage.set(page);
}

export function closeSettingsPage(): void {
  $settingsPage.set(null);
}
