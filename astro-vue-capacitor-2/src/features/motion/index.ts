/**
 * Motion feature — public surface.
 */

export { createFakePedometer, type FakePedometer } from "./adapters/fake-pedometer";
export { pedometer } from "./pedometer";
export type { Pedometer } from "./ports/pedometer";
export {
  cadenceFromSteps,
  DEFAULT_STEP_CONFIG,
  magnitude,
  type StepConfig,
  StepDetector,
} from "./steps";
