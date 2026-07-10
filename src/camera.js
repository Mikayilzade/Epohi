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

  function tileCenter(mapEl, mapSizeCellsFn, x, y) {
    const firstTile = mapEl.querySelector(".tile");
    const mapStyle = getComputedStyle(mapEl);
    const gap = parseFloat(mapStyle.columnGap) || 0;
    const size = mapSize(mapEl);
    const tileWidth = firstTile ? firstTile.offsetWidth : size.width / mapSizeCellsFn();
    const tileHeight = firstTile ? firstTile.offsetHeight : size.height / mapSizeCellsFn();
    return {
      x: x * (tileWidth + gap) + tileWidth / 2,
      y: y * (tileHeight + gap) + tileHeight / 2
    };
  }

  function centerCameraOnTile(camera, mapViewport, mapEl, mapSizeCellsFn, x, y) {
    const viewport = viewportMetrics(mapViewport);
    const center = tileCenter(mapEl, mapSizeCellsFn, x, y);
    camera.x = viewport.width / 2 - center.x * camera.scale;
    camera.y = viewport.height / 2 - center.y * camera.scale;
  }

  function setCameraScale(camera, mapViewport, nextScale, originX, originY) {
    const viewport = viewportMetrics(mapViewport);
    const anchorX = originX == null ? viewport.width / 2 : originX;
    const anchorY = originY == null ? viewport.height / 2 : originY;
    const mapX = (anchorX - camera.x) / camera.scale;
    const mapY = (anchorY - camera.y) / camera.scale;
    camera.scale = clamp(nextScale, CAMERA_MIN_SCALE, CAMERA_MAX_SCALE);
    camera.x = anchorX - mapX * camera.scale;
    camera.y = anchorY - mapY * camera.scale;
  }

  function applyCamera(camera, mapViewport, mapEl, zoomValue) {
    clampCamera(camera, mapViewport, mapEl);
    mapEl.style.transform = "translate3d(" + camera.x + "px, " + camera.y + "px, 0) scale(" + camera.scale + ")";
    zoomValue.value = String(Math.round(camera.scale * 100));
    zoomValue.textContent = Math.round(camera.scale * 100) + "%";
  }

  function focusCameraTarget(unit, city) {
    if (unit) return { x: unit.x, y: unit.y };
    return { x: city.x, y: city.y };
  }

  window.EpohiCamera = {
    viewportMetrics,
    pointerPoint,
    mapSize,
    clampCamera,
    tileCenter,
    centerCameraOnTile,
    setCameraScale,
    applyCamera,
    focusCameraTarget
  };
})();
