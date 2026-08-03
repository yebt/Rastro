/**
 * Share feature — public surface. The route card renderer, the theme registry,
 * the persisted gallery, and the share/save actions.
 */

export { renderRouteCard } from "./route-card";
export { shareImage, shareRoute } from "./share-route";
export { type GalleryStore, shareGallery, type SharedImage } from "./gallery-store";
export {
  DEFAULT_THEME,
  getLayout,
  getPalette,
  type SharePalette,
  type ShareLayout,
  SHARE_LAYOUTS,
  SHARE_PALETTES,
  type ShareTheme,
  themeKey,
  themeLabel,
} from "./themes";
export { default as ShareScreen } from "./ShareScreen.vue";
