(function () {
  "use strict";

  let frame = 0;
  const stats = { schedules: 0, restores: 0, screenSignals: 0, appSignals: 0 };

  function restorePersistedCameraWhileMenuIsOpen() {
    frame = 0;
    const app = document.getElementById("gameApp");
    if (!app || !app.classList.contains("is-hidden")) return;
    if (!window.EpohiCameraStorage || typeof window.EpohiCameraStorage.loadCamera !== "function") return;
    if (typeof window.__epohiDebug !== "function") return;
    const stored = window.EpohiCameraStorage.loadCamera();
    const debug = window.__epohiDebug();
    if (!stored || !debug || typeof debug.getCamera !== "function") return;
    const camera = debug.getCamera();
    camera.x = stored.x;
    camera.y = stored.y;
    camera.scale = stored.scale;
    stats.restores += 1;
  }

  function scheduleRestore() {
    stats.schedules += 1;
    if (frame) return;
    frame = window.requestAnimationFrame(restorePersistedCameraWhileMenuIsOpen);
  }

  function install() {
    const screen = document.getElementById("screenRoot");
    const app = document.getElementById("gameApp");

    // Screen changes can reset menu camera state, but observing every descendant caused
    // a callback for ordinary game/context/map renders. Direct screen children are the
    // semantic boundary needed here, so keep the observer narrow and non-subtree.
    if (screen) {
      new MutationObserver(function () {
        stats.screenSignals += 1;
        scheduleRestore();
      }).observe(screen, { childList: true });
    }

    if (app) {
      new MutationObserver(function () {
        stats.appSignals += 1;
        scheduleRestore();
      }).observe(app, { attributes: true, attributeFilter: ["class"] });
    }

    window.addEventListener("pageshow", scheduleRestore);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) scheduleRestore();
    });
    scheduleRestore();
  }

  window.EpohiCameraLayoutGuard = {
    version: 2,
    restore: restorePersistedCameraWhileMenuIsOpen,
    stats: function () { return Object.assign({}, stats, { scheduled: !!frame }); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
