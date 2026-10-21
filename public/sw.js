/* Logic Clothes — lightweight service worker */
const STATIC_CACHE = "lc-static-v1";
const IMAGE_CACHE = "lc-images-v1";
const API_CACHE = "lc-api-v1";

const PRECACHE = [
  "/assets/logo-header.png",
  "/assets/hero.png",
  "/site.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key !== STATIC_CACHE && key !== IMAGE_CACHE && key !== API_CACHE
          )
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache admin or mutating APIs
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/auth")) {
    return;
  }

  // Public product API — network first, short cache fallback
  if (url.pathname.startsWith("/api/products")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Images / assets — cache first
  if (
    url.pathname.startsWith("/assets/") ||
    /\.(?:png|jpe?g|webp|avif|svg|gif)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
