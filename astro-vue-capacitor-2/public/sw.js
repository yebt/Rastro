/**
 * Tile cache service worker. Caches ONLY CARTO basemap tiles (cache-first) so
 * maps — the activity-detail RouteMap and the share map card — load instantly on
 * repeat views and keep working offline. Deliberately does NOT cache the app
 * shell, so there's no stale-app risk: app assets always come from the network.
 */

const TILE_CACHE = "rastro-tiles-v1";
const MAX_ENTRIES = 500;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

function isTile(url) {
  return /(^|\.)cartocdn\.com$/.test(url.hostname);
}

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;
  for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) {
    await cache.delete(key);
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(TILE_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) {
    cache.put(request, res.clone());
    void trim(cache);
  }
  return res;
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
