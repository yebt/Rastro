/**
 * Tracking feature — public surface. Other features depend on this barrel, not
 * on internal file paths.
 */

export type {
  Activity,
  ActivityKind,
  ExerciseActivity,
  ExerciseSet,
  MoveActivity,
  MoveType,
} from "./domain/activity";
export { newId, startExercise, startMove } from "./domain/activity";
export {
  DEFAULT_EXERCISES,
  type ExerciseDef,
  exerciseStats,
  type ExerciseStats,
  slugifyExercise,
  totalReps,
} from "./domain/exercises";
export {
  $exercises,
  addExercise,
  exerciseLabel,
  removeExercise,
  renameExercise,
  routinesUsing,
} from "./exercise-catalog.store";
export {
  newRoutine,
  type Routine,
  type RoutineExercise,
  routineTotalReps,
} from "./domain/routine";
export { $routines, deleteRoutine, getRoutine, saveRoutine } from "./routines.store";
export { cleanTrack } from "./domain/clean";
export {
  applyFilter,
  type TrackFilterDef,
  type TrackFilterId,
  TRACK_FILTERS,
} from "./domain/filters";
export { kalmanFilter } from "./domain/kalman";
export { $trackFilter, setTrackFilter } from "./track-filter.store";
export {
  avgPaceSecPerKm,
  avgSpeedMps,
  distanceMeters,
  elevationGainM,
  elevationLossM,
  hasElevation,
  haversineMeters,
  movingDurationMs,
  pausedMs,
  spanMs,
} from "./domain/metrics";
export { CURRENT_SCHEMA_VERSION, migrate } from "./domain/schema";
export { toTrackPoint, type TrackPoint } from "./domain/track-point";
export type { ActivityRepository } from "./ports/activity-repository";
export { activityRepository } from "./repository";
export {
  distanceParts,
  formatActivityDate,
  formatDuration,
  formatPace,
  formatSpeed,
} from "./ui/format";
export { MOVE_LABEL } from "./ui/labels";
