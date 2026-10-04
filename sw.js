const CACHE_NAME =
  "epohi-world-profiles-v3-2026-10-04";
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
  "./src/combat-rules.js",
  "./src/ai-strategy.js",
  "./src/ai-actions.js",
  "./src/barbarian-targeting.js",
  "./src/barbarian-actions.js",
  "./src/stability-rules.js",
  "./src/player-production.js",
  "./src/player-combat.js",
  "./src/player-exploration.js",
  "./src/player-settlements.js",
  "./src/rival-turn.js",
  "./src/worker-projects.js",
  "./src/event-journal.js",
  "./src/world-stability-actions.js",
  "./src/state-schema.js",
  "./src/humans-content.js",
  "./src/utils.js",
  "./src/ai-production.js",
  "./src/rival-combat.js",
  "./src/storage.js",
  "./src/save-utils.js",
  "./src/production-experience.js",
  "./src/save-service.js",
  "./src/camera-storage.js",
  "./src/camera.js",
  "./src/selectors.js",
  "./src/territory.js",
  "./src/economy.js",
  "./src/progression.js",
  "./src/humans-world-generation.js",
  "./src/app.js",
  "./src/humans-performance.js",
  "./src/humans-turn-label-stability.js",
  "./src/humans-autonomy.js",
  "./src/humans-outcomes.js",
  "./src/humans-journey-data.js",
  "./src/humans-journey-core.js",
  "./src/humans-journey-ui.js",
  "./src/humans-observer.js",
  "./src/humans-canon-art.js",
  "./src/humans-visuals.js",
  "./src/humans-unit-atlas.js",
  "./assets/visual-canon-v1/plains-detail.png",
  "./assets/visual-canon-v1/forest-cluster.png",
  "./assets/visual-canon-v1/hill-relief.png",
  "./assets/visual-canon-v1/city-center.png",
  "./assets/visual-canon-v1/farm.png",
  "./assets/visual-canon-v1/worker.png",
  "./assets/visual-canon-v1/scout.png",
  "./assets/visual-canon-v1/warrior.png",
  "./assets/visual-canon-v2/plains-a.webp",
  "./assets/visual-canon-v2/plains-b.webp",
  "./assets/visual-canon-v2/plains-c.webp",
  "./assets/visual-canon-v2/swamp-a.webp",
  "./assets/visual-canon-v2/swamp-b.webp",
  "./assets/visual-canon-v2/depot.webp",
  "./assets/visual-canon-v2/grove.webp",
  "./assets/visual-canon-v2/old-mine.webp",
  "./assets/visual-canon-v2/caravan.webp",
  "./assets/visual-canon-v2/cave.webp",
  "./assets/visual-canon-v2/tower.webp",
  "./assets/visual-canon-v2/temple.webp",
  "./assets/visual-canon-v2/lumber.webp",
  "./assets/visual-canon-v2/mine-worked.webp",
  "./assets/visual-canon-v2/trading-post.webp",
  "./assets/visual-canon-v2/harbor.webp",
  "./assets/visual-canon-v3/forest-grove-b.webp",
  "./assets/visual-canon-v3/hill-ledges-b.webp",
  "./assets/visual-canon-v3/dead-ash-a.webp",
  "./assets/visual-canon-v3/swamp-pools-c.webp",
  "./src/humans-pathing-core.js",
  "./src/humans-pathing-ui.js",
  "./src/humans-strategy-ux.js",
  "./src/humans-camera-layout-guard.js",
  "./src/humans-living-civilizations.js",
  "./src/humans-player-feedback.js",
  "./src/humans-player-feedback-stabilization.js",
  "./src/humans-combat-world-stability.js",
  "./src/humans-population-workforce.js",
  "./src/humans-context-review-cleanup.js",
  "./src/humans-runtime-invalidation.js",
  "./src/humans-diplomacy-event-flow.js",
  "./src/humans-event-overlay-policy.js",
  "./src/humans-chronicle-ui.js",
  "./src/humans-worker-learning.js",
  "./src/humans-capture-state.js",
  "./src/humans-diplomacy-coherence-v2.js",
  "./src/humans-coherence-finalize.js",
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
    fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type !== "opaque") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return response;
      }).catch(function () {
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});
