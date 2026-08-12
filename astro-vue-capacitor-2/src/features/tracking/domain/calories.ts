/**
 * Estimated calories — a rough MET-based figure (always labelled "estimado"):
 * kcal ≈ MET × weight(kg) × hours. MET by movement intensity. Needs the user's
 * weight (optional profile field); returns null without it.
 */

import type { MoveType } from "./activity";

const MET: Record<MoveType, number> = { walk: 3.5, jog: 7.0, run: 9.8 };

export function estimateCalories(type: MoveType, movingMs: number, weightKg: number | null): number | null {
  if (weightKg == null || weightKg <= 0 || movingMs <= 0) return null;
  return Math.round(MET[type] * weightKg * (movingMs / 3_600_000));
}
