/**
 * Which sub-view the Info tab shows. A store (not local state) so other surfaces
 * — e.g. Home's streak jumping to History — can drive it.
 */

import { atom } from "nanostores";

export type InfoView = "menu" | "analytics" | "progress" | "calendar" | "history" | "shared";

export const $infoView = atom<InfoView>("menu");

export function setInfoView(view: InfoView): void {
  $infoView.set(view);
}
