/**
 * Vue binding for the live recorder. Exposes reactive status/activity/error and
 * an `elapsedMs` ref that ticks (only while recording) for the timer display.
 * Methods are forwarded straight from the singleton.
 */

import { useStore } from "@nanostores/vue";
import { onUnmounted, ref } from "vue";
import { pedometer } from "../motion";
import { recorder } from "./singleton";

export function useRecorder() {
  const status = useStore(recorder.$status);
  const activity = useStore(recorder.$activity);
  const error = useStore(recorder.$error);
  const steps = useStore(pedometer().$steps);
  const cadence = useStore(pedometer().$cadence);
  const elapsedMs = ref(recorder.elapsedMs());

  let timer: ReturnType<typeof setInterval> | null = null;

  function tick(): void {
    elapsedMs.value = recorder.elapsedMs();
  }

  function stopTimer(): void {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Run the display timer only while recording; keep the value fresh otherwise.
  const unsubscribe = recorder.$status.subscribe((s) => {
    tick();
    if (s === "recording") timer ??= setInterval(tick, 250);
    else stopTimer();
  });

  onUnmounted(() => {
    stopTimer();
    unsubscribe();
  });

  return {
    status,
    activity,
    error,
    steps,
    cadence,
    elapsedMs,
    start: recorder.start,
    pause: recorder.pause,
    requestFinish: recorder.requestFinish,
    cancelFinish: recorder.cancelFinish,
    resume: recorder.resume,
    finish: recorder.finish,
    discard: recorder.discard,
  };
}
