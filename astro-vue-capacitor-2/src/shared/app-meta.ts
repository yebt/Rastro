/** App-wide constants surfaced in the UI (e.g. the About page). */

// Injected by Vite `define` (see astro.config.mjs) from git at build time.
// `typeof` guards keep this safe in contexts without the define (e.g. Vitest).
declare const __APP_BUILD__: string;
declare const __APP_COMMIT__: string;
declare const __APP_RELEASE_TAG__: string;

const BUILD = typeof __APP_BUILD__ !== "undefined" ? __APP_BUILD__ : "0";
const COMMIT = typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "dev";
const RELEASE_TAG = typeof __APP_RELEASE_TAG__ !== "undefined" ? __APP_RELEASE_TAG__ : "";

export const APP_NAME = "Rastro";

/** Marketing release line, bumped by hand with the codebase. */
export const APP_RELEASE = "2.0";

/** Full version: the tagged release (e.g. 2.1.0) for release builds, otherwise
 *  release line + git commit count, which changes on every new commit. */
export const APP_VERSION = RELEASE_TAG || `${APP_RELEASE}.${BUILD}`;

/** Short hash of the commit this build was cut from. */
export const APP_COMMIT = COMMIT;

export const APP_TAGLINE = "Local-first · sin cuenta · tus datos son tuyos";
