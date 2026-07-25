/**
 * The app's single live recorder, wired to the real platform adapters. Kept in
 * its own module so `useRecorder` and the barrel avoid an import cycle.
 */

import { geolocation } from "../geolocation";
import { activityRepository } from "../tracking";
import { createRecorder } from "./recorder";

export const recorder = createRecorder({
  geo: geolocation(),
  repo: activityRepository(),
  now: () => Date.now(),
});
