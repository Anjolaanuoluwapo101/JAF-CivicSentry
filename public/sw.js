const CACHE_NAME = "civicsentry-tiles-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only cache OSM tiles
  if (
    url.hostname.includes("tile.openstreetmap.org") ||
    url.hostname.includes("tileernetstreetmap.org")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;

          return fetch(event.request)
            .then((response) => {
              // Only cache successful responses
              if (response.ok) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Return a transparent pixel for failed tile requests
              return new Response(
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==",
                { headers: { "Content-Type": "image/png" } }
              );
            });
        })
      )
    );
    return;
  }

  // Everything else: network only
  event.respondWith(fetch(event.request));
});
