const CACHE_NAME = "currency-converter-v2";
const STATIC_CACHE = "static-v2";
const API_CACHE = "api-v1";

const STATIC_ASSETS = [
  "/.",
  "/.index.html",
  "/.style.css",
  "/.script.js",
  "/.manifest.json",
  "/.icon-192.png",
  "/.icon-512.png",
  "/.favicon.ico"
];

// =======================
// INSTALL
// =======================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      return cache.addAll(STATIC_ASSETS)
    )
  );
  self.skipWaiting();
});

// =======================
// ACTIVATE
// =======================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (![STATIC_CACHE, API_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// =======================
// FETCH
// =======================
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // 🔹 API: Network-first, fallback to cache
  if (url.origin === "https://api.frankfurter.app") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const cloned = response.clone();
          caches.open(API_CACHE).then(cache =>
            cache.put(request, cloned)
          );
          return response;
        })
        .catch(() =>
          caches.match(request)
        )
    );
    return;
  }

  // 🔹 Static files: Cache-first
  event.respondWith(
    caches.match(request).then(cached =>
      cached ||
      fetch(request).catch(() =>
        caches.match("/index.html")
      )
    )
  );
});

