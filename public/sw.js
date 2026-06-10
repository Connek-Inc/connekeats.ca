// Service worker MÍNIMO para poder instalar la PWA, pero SIN caché de la app:
// nunca sirve una versión vieja tras un deploy. Limpia cualquier caché previa.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Borra TODAS las cachés (incluida la antigua connek-rt-v1 que cacheaba).
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  // Las navegaciones (documentos HTML) SIEMPRE por red → contenido fresco.
  // Los assets con hash (JS/CSS) se sirven normal (son inmutables por su hash).
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => fetch(event.request)));
  }
});
