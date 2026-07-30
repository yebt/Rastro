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
  avgPaceSecPerKm,
  avgSpeedMps,
  distanceMeters,
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
