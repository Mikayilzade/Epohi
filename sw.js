const CACHE_NAME =
  "epohi-v1-5-3-strategy-ux-3";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles/app.css",
  "./styles/humans.css",
  "./styles/humans-responsive.css",
  "./styles/humans-art.css",
  "./styles/humans-runtime.css",
  "./styles/humans-strategy.css",
  "./src/config.js",
  "./src/data.js",
  "./src/humans-content.js",
  "./src/utils.js",
  "./src/storage.js",
  "./src/save-utils.js",
  "./src/camera-storage.js",
  "./src/camera.js",
  "./src/selectors.js",
  "./src/territory.js",
  "./src/economy.js",
  "./src/progression.js",
  "./src/app.js",
  "./src/humans-performance.js",
  "./src/humans-autonomy.js",
  "./src/humans-outcomes.js",
  "./src/humans-journey-data.js",
  "./src/humans-journey-core.js",
  "./src/humans-journey-ui.js",
  "./src/humans-autonomy-fix.js",
  "./src/humans-observer.js",
  "./src/humans-visuals.js",
  "./src/humans-pathing-core.js",
  "./src/humans-pathing-ui.js",
  "./src/humans-strategy-ux.js",
  "./src/humans-camera-layout-guard.js",
  "./manifest.webmanifest",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(APP_FILES);
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE_NAME;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
      const network = fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type !== "opaque") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return response;
      }).catch(function () {
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return cached;
      });
      return cached || network;
    })
  );
});