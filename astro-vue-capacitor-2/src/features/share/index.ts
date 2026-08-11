/**
 * Share feature — public surface. The route card renderer, the theme registry,
 * the persisted gallery, and the share/save actions.
 */

export { renderRouteCard } from "./route-card";
export { shareImage, shareRoute } from "./share-route";
export { type GalleryStore, shareGallery, type SharedImage } from "./gallery-store";
export { $favorites, addFavorite, removeFavorite } from "./favorites.store";
export {
  DEFAULT_THEME,
  getLayout,
  getPalette,
  getTypography,
  type ShareBackground,
  type ShareEffect,
  type ShareGradient,
  SHARE_GRADIENTS,
  type MapCamera,
  type MapStyleDef,
  type MapStyleId,
  MAP_STYLES,
  type SharePalette,
  type ShareLayout,
  SHARE_LAYOUTS,
  SHARE_PALETTES,
  type ShareTheme,
  type ShareTypography,
  SHARE_TYPOGRAPHIES,
  themeKey,
  themeLabel,
} from "./themes";
export { default as ShareScreen } from "./ShareScreen.vue";
export { default as GalleryScreen } from "./GalleryScreen.vue";
