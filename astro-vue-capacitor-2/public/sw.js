/**
 * Tile cache service worker. Caches basemap tiles (cache-first) so maps —
 * the activity-detail RouteMap and the share map — load instantly on repeat
 * views instead of re-downloading. Caches ONLY tiles, never the app shell, so
 * there's no stale-app risk.
 *
 * (The earlier "maps don't load" was the deprecated {s}.basemaps.cartocdn.com
 * subdomains, not this worker — tiles now use the canonical host.)
 */

// v3: v2 holds CARTO "API KEY REQUIRED" watermark tiles — dropped on activate.
const TILE_CACHE = "rastro-tiles-v3";
const MAX_ENTRIES = 800;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("rastro-tiles-") && k !== TILE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);

function isTile(url) {
  return /(^|\.)arcgisonline\.com$/.test(url.hostname) || /(^|\.)opentopomap\.org$/.test(url.hostname);
}

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;
  for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) await cache.delete(key);
}

async function cacheFirst(request) {
  const cache = await caches.open(TILE_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    // Tiles are loaded no-cors (opaque, status 0) — cache those too.
    if (res && (res.ok || res.type === "opaque")) {
      cache.put(request, res.clone()).catch(() => {});
      void trim(cache);
    }
    return res;
  } catch {
    return hit ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }
  if (isTile(url)) event.respondWith(cacheFirst(event.request));
});
