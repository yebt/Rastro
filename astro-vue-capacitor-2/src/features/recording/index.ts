/**
 * Recording feature — public surface.
 */

export {
  $backArmed,
  $finishRequested,
  clearFinishRequest,
  handleRecordingBack,
} from "./back-to-finish";
export { createRecorder, type Recorder, type RecorderDeps, type RecordingStatus } from "./recorder";
export { recorder } from "./singleton";
export { useRecorder } from "./useRecorder";
