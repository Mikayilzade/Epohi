(function () {
  "use strict";

  const startedAt = Date.now();

  window.EpohiPerformance = {
    version: 2,
    mode: "static-visuals",
    snapshot: function () {
      return {
        mode: "static-visuals",
        uptimeMs: Date.now() - startedAt,
        waterTiles: document.querySelectorAll("#map .tile.water").length,
        routeBadges: document.querySelectorAll("#map .route-badge").length
      };
    }
  };
})();
