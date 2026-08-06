(function () {
  "use strict";

  function restorePersistedCameraWhileMenuIsOpen() {
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
  }

  function scheduleRestore() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(restorePersistedCameraWhileMenuIsOpen);
    });
  }

  function install() {
    const screen = document.getElementById("screenRoot");
    const app = document.getElementById("gameApp");
    if (screen) new MutationObserver(scheduleRestore).observe(screen, { childList: true, subtree: true });
    if (app) new MutationObserver(scheduleRestore).observe(app, { attributes: true, attributeFilter: ["class"] });
    scheduleRestore();
  }

  window.EpohiCameraLayoutGuard = { version: 1, restore: restorePersistedCameraWhileMenuIsOpen };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();