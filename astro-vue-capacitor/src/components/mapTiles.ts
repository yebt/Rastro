/**
 * Shared base-map tile helper. Creates (and swaps) the Leaflet tile layer for
 * the user's chosen map style (stores/settings), so TrackerTab and
 * ActivityDetail don't duplicate provider URLs and both react to changes.
 */

import L from "leaflet";
import { mapStyleById } from "../stores/settings";

/**
 * Apply the given style to `map`, removing `current` first. Returns the new
 * layer so the caller can keep the reference for the next swap.
 */
export function applyTileLayer(
  map: L.Map,
  current: L.TileLayer | null,
  styleId: string,
): L.TileLayer {
  current?.remove();
  const style = mapStyleById(styleId);
  const layer = L.tileLayer(style.url, {
    maxZoom: style.maxZoom,
    subdomains: style.subdomains ?? "abc",
    attribution: style.attribution,
  });
  layer.addTo(map);
  return layer;
}
