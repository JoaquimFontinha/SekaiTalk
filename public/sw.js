const CACHE = "mapbox-tiles-v1";

// Supprime les paramètres de session Mapbox (sku change à chaque session)
// sans normalisation, la même tuile aurait une clé différente à chaque refresh
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.searchParams.delete("sku");
    return u.toString();
  } catch {
    return url;
  }
}

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("events.mapbox.com")) return; // skip analytics
  if (!url.includes("mapbox.com")) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const key = new Request(normalizeUrl(url));
      const cached = await cache.match(key);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        if (response.ok) cache.put(key, response.clone());
        return response;
      } catch {
        return cached ?? new Response("Offline", { status: 503 });
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});
