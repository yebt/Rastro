/**
 * A LIFO stack of "back" handlers for in-tab overlays (an open activity detail,
 * a settings-like sub-view). The hardware back button and on-screen back both
 * pop the top handler before the app falls back to tab/Home behaviour — so back
 * unwinds sub-views instead of jumping straight Home.
 */

const handlers: Array<() => void> = [];

/** Register a handler while an overlay is open; returns a disposer. */
export function pushBack(fn: () => void): () => void {
  handlers.push(fn);
  return () => {
    const i = handlers.lastIndexOf(fn);
    if (i >= 0) handlers.splice(i, 1);
  };
}

/** Run the top handler if any; returns whether one handled the press. */
export function popBack(): boolean {
  const fn = handlers.pop();
  if (!fn) return false;
  fn();
  return true;
}
