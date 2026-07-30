import type { MoveType } from "../domain/activity";

/** Spanish labels for movement types, shared across the tracking UI. */
export const MOVE_LABEL: Record<MoveType, string> = {
  walk: "Caminar",
  jog: "Trotar",
  run: "Correr",
};
