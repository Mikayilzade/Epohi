(function () {
  "use strict";

  if (!window.EpohiConfig) {
    throw new Error("EpohiConfig must be loaded before camera-storage.js");
  }

  if (!window.EpohiUtils) {
    throw new Error("EpohiUtils must be loaded before camera-storage.js");
  }

  if (!window.EpohiStorage) {
    throw new Error("EpohiStorage must be loaded before camera-storage.js");
  }

  const {
    CAMERA_KEY,
    CAMERA_MIN_SCALE,
    CAMERA_MAX_SCALE
  } = window.EpohiConfig;

  const {
    clamp
  } = window.EpohiUtils;

  const {
    safeGet,
    safeSet
  } = window.EpohiStorage;

  function loadCamera() {
    const raw = safeGet(CAMERA_KEY);
    if (!raw) return null;
    try {
      const candidate = JSON.parse(raw);
      if (!candidate || typeof candidate.x !== "number" ||
          typeof candidate.y !== "number" || typeof candidate.scale !== "number") return null;
      return {
        x: candidate.x,
        y: candidate.y,
        scale: clamp(candidate.scale, CAMERA_MIN_SCALE, CAMERA_MAX_SCALE)
      };
    } catch (error) {
      return null;
    }
  }

  function saveCamera(camera) {
    safeSet(CAMERA_KEY, JSON.stringify({
      x: Math.round(camera.x),
      y: Math.round(camera.y),
      scale: Math.round(camera.scale * 1000) / 1000
    }));
  }

  function scheduleCameraSave(currentTimer, saveFn) {
    clearTimeout(currentTimer);
    return setTimeout(saveFn, 180);
  }

  window.EpohiCameraStorage = {
    loadCamera,
    saveCamera,
    scheduleCameraSave
  };
})();
