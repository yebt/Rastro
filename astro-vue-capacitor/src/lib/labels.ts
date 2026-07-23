/** Shared display labels/colors for activity types. */

import type { ExerciseKind } from "./types";

export const TYPE_COLOR: Record<string, string> = {
  Caminata: "#12A150",
  Trote: "#1B4DFF",
  Carrera: "#FF5A1F",
};

export const TYPE_LABEL: Record<string, string> = {
  Caminata: "Caminata",
  Trote: "Trote",
  Carrera: "Carrera",
};

/** User-facing (Spanish) labels for each bodyweight exercise. */
export const EXERCISE_LABEL: Record<ExerciseKind, string> = {
  dominadas: "Dominadas",
  burpees: "Burpees",
  abdominales: "Abdominales",
  flexiones: "Flexiones",
};
