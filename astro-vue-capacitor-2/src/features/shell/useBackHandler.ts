/**
 * Register a back handler while `active` is true, so the hardware/on-screen back
 * pops this overlay first. Auto-disposes on unmount.
 */

import { onUnmounted, type Ref, watch } from "vue";
import { pushBack } from "./backstack";

export function useBackHandler(active: Ref<boolean>, handler: () => void): void {
  let dispose: (() => void) | null = null;
  watch(
    active,
    (on) => {
      if (on && !dispose) dispose = pushBack(handler);
      else if (!on && dispose) {
        dispose();
        dispose = null;
      }
    },
    { immediate: true },
  );
  onUnmounted(() => dispose?.());
}
