/**
 * Recording feature — public surface.
 */

export { createRecorder, type Recorder, type RecorderDeps, type RecordingStatus } from "./recorder";
export { recorder } from "./singleton";
export { useRecorder } from "./useRecorder";
