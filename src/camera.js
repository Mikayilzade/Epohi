(function () {
  "use strict";

  if (!window.EpohiConfig) {
    throw new Error("EpohiConfig must be loaded before camera.js");
  }

  if (!window.EpohiUtils) {
    throw new Error("EpohiUtils must be loaded before camera.js");
  }

  const {
    CAMERA_MIN_SCALE,
    CAMERA_MAX_SCALE
  } = window.EpohiConfig;

  const {
    clamp
  } = window.EpohiUtils;

  function viewportMetrics(mapViewport) {
    const shellStyle = getComputedStyle(mapViewport);
    const padLeft = parseFloat(shellStyle.paddingLeft) || 0;
    const padRight = parseFloat(shellStyle.paddingRight) || 0;
    const padTop = parseFloat(shellStyle.paddingTop) || 0;
    const padBottom = parseFloat(shellStyle.paddingBottom) || 0;
    return {
      padLeft: padLeft,
      padTop: padTop,
      width: Math.max(1, mapViewport.clientWidth - padLeft - padRight),
      height: Math.max(1, mapViewport.clientHeight - padTop - padBottom)
    };
  }

  function pointerPoint(event, mapViewport) {
    const rect = mapViewport.getBoundingClientRect();
    const viewport = viewportMetrics(mapViewport);
    return {
      x: event.clientX - rect.left - viewport.padLeft,
      y: event.clientY - rect.top - viewport.padTop
    };
  }

  function mapSize(mapEl) {
    return {
      width: Math.max(1, mapEl.offsetWidth),
      height: Math.max(1, mapEl.offsetHeight)
    };
  }

  function clampCamera(camera, mapViewport, mapEl) {
    camera.scale = clamp(camera.scale, CAMERA_MIN_SCALE, CAMERA_MAX_SCALE);
    const viewport = viewportMetrics(mapViewport);
    const size = mapSize(mapEl);
    const scaledWidth = size.width * camera.scale;
    const scaledHeight = size.height * camera.scale;

    if (scaledWidth <= viewport.width) {
      camera.x = (viewport.width - scaledWidth) / 2;
    } else {
      camera.x = clamp(camera.x, viewport.width - scaledWidth, 0);
    }

    if (scaledHeight <= viewport.height) {
      camera.y = (viewport.height - scaledHeight) / 2;
    } else {
      camera.y = clamp(camera.y, viewport.height - scaledHeight, 0);
    }
  }

  window.EpohiCamera = {
    viewportMetrics,
    pointerPoint,
    mapSize,
    clampCamera
  };
})();
