const TILE_CACHE = "civicsentry-tiles-v2";

self.addEventListener("install", (e) => {
  console.log("[SW] install");
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("[SW] activate");
  e.waitUntil(
    caches
      .keys()
      .then((k) =>
        Promise.all(k.filter((k) => k !== TILE_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);

  // Only cache OSM tiles
  if (!u.hostname.endsWith("tile.openstreetmap.org")) return;

  e.respondWith(
    caches.open(TILE_CACHE).then(async (cache) => {
      const hit = await cache.match(e.request);
      if (hit) {
        console.log("[SW] cache HIT", u.pathname);
        return hit;
      }

      try {
        const res = await fetch(e.request);
        if (res.ok) {
          // clone before putting — body can only be consumed once
          await cache.put(e.request, res.clone());
          console.log("[SW] cached", u.pathname);
        }
        return res;
      } catch (err) {
        console.warn("[SW] fetch failed, returning blank tile", err);
        return new Response(
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==",
          { headers: { "Content-Type": "image/png" } }
        );
      }
    })
  );
});
