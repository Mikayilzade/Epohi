(function () {
  "use strict";

  if (!window.EpohiConfig) {
    throw new Error("EpohiConfig must be loaded before camera.js");
  }

  if (!window.EpohiUtils) {
    throw new Error("EpohiUtils must be loaded before camera.js");
  }

  const {
    CAMERA_MAX_SCALE
  } = window.EpohiConfig;

  const CAMERA_SCALE_SAFETY_MIN = 0.001;

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

  function tileMetrics(mapEl, mapSizeCellsFn) {
    mapSizeCellsFn = mapSizeCellsFn || function () { return Math.max(1, Math.round(Math.sqrt(mapEl.querySelectorAll(".tile").length)) || 1); };
    const firstTile = mapEl.querySelector(".tile");
    const mapStyle = getComputedStyle(mapEl);
    const gap = parseFloat(mapStyle.columnGap) || 0;
    const size = mapSize(mapEl);
    const cells = Math.max(1, mapSizeCellsFn());
    const tileWidth = firstTile ? firstTile.offsetWidth : (size.width - gap * (cells - 1)) / cells;
    const tileHeight = firstTile ? firstTile.offsetHeight : (size.height - gap * (cells - 1)) / cells;
    return { width: Math.max(1, tileWidth), height: Math.max(1, tileHeight), gap: gap };
  }

  function fitScale(mapViewport, mapEl) {
    const viewport = viewportMetrics(mapViewport);
    const size = mapSize(mapEl);
    const requiredScale = Math.min(viewport.width / size.width, viewport.height / size.height);
    return Math.max(CAMERA_SCALE_SAFETY_MIN, Math.min(CAMERA_MAX_SCALE, requiredScale));
  }

  function maxScale(mapViewport, mapEl, mapSizeCellsFn) {
    const viewport = viewportMetrics(mapViewport);
    const tile = tileMetrics(mapEl, mapSizeCellsFn);
    const tileFillScale = Math.min(viewport.width / tile.width, viewport.height / tile.height) * 0.82;
    return Math.max(fitScale(mapViewport, mapEl), Math.min(CAMERA_MAX_SCALE, Math.max(2.2, tileFillScale)));
  }

  function scaleBounds(mapViewport, mapEl, mapSizeCellsFn) {
    return {
      min: fitScale(mapViewport, mapEl),
      max: maxScale(mapViewport, mapEl, mapSizeCellsFn)
    };
  }

  function clampCamera(camera, mapViewport, mapEl, mapSizeCellsFn) {
    const bounds = scaleBounds(mapViewport, mapEl, mapSizeCellsFn);
    camera.scale = clamp(camera.scale, bounds.min, bounds.max);
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
    return bounds;
  }

  function tileCenter(mapEl, mapSizeCellsFn, x, y) {
    const renderedTile = mapEl.querySelector('.tile[data-x="' + x + '"][data-y="' + y + '"]');
    if (renderedTile) {
      // Grid tracks can be fractional. WebKit distributes their rounding across
      // the row, so multiplying the first tile width drifts several pixels by
      // the time a tile near the middle of the map is reached. Offset geometry
      // is the browser's authoritative laid-out position in map coordinates.
      return {
        x: renderedTile.offsetLeft + renderedTile.offsetWidth / 2,
        y: renderedTile.offsetTop + renderedTile.offsetHeight / 2
      };
    }
    const tile = tileMetrics(mapEl, mapSizeCellsFn);
    return {
      x: x * (tile.width + tile.gap) + tile.width / 2,
      y: y * (tile.height + tile.gap) + tile.height / 2
    };
  }

  function centerCameraOnTile(camera, mapViewport, mapEl, mapSizeCellsFn, x, y) {
    const viewport = viewportMetrics(mapViewport);
    const center = tileCenter(mapEl, mapSizeCellsFn, x, y);
    camera.x = viewport.width / 2 - center.x * camera.scale;
    camera.y = viewport.height / 2 - center.y * camera.scale;
  }

  function centerCameraOnFocus(camera, mapViewport, mapEl, mapSizeCellsFn, target) {
    centerCameraOnTile(camera, mapViewport, mapEl, mapSizeCellsFn, target.x, target.y);
  }

  function showEntireMap(camera, mapViewport, mapEl, mapSizeCellsFn) {
    camera.scale = fitScale(mapViewport, mapEl);
    const viewport = viewportMetrics(mapViewport);
    const size = mapSize(mapEl);
    camera.x = (viewport.width - size.width * camera.scale) / 2;
    camera.y = (viewport.height - size.height * camera.scale) / 2;
    clampCamera(camera, mapViewport, mapEl, mapSizeCellsFn);
  }

  function setCameraScale(camera, mapViewport, mapEl, mapSizeCellsFn, nextScale, originX, originY) {
    const viewport = viewportMetrics(mapViewport);
    const anchorX = originX == null ? viewport.width / 2 : originX;
    const anchorY = originY == null ? viewport.height / 2 : originY;
    const mapX = (anchorX - camera.x) / camera.scale;
    const mapY = (anchorY - camera.y) / camera.scale;
    const bounds = scaleBounds(mapViewport, mapEl, mapSizeCellsFn);
    camera.scale = clamp(nextScale, bounds.min, bounds.max);
    camera.x = anchorX - mapX * camera.scale;
    camera.y = anchorY - mapY * camera.scale;
  }

  function applyCamera(camera, mapViewport, mapEl, zoomValue, mapSizeCellsFn, controls) {
    const bounds = clampCamera(camera, mapViewport, mapEl, mapSizeCellsFn);
    mapEl.style.transform = "translate3d(" + camera.x + "px, " + camera.y + "px, 0) scale(" + camera.scale + ")";
    zoomValue.value = String(Math.round(camera.scale * 100));
    zoomValue.textContent = Math.round(camera.scale * 100) + "%";
    if (controls) {
      if (controls.zoomOutBtn) controls.zoomOutBtn.disabled = camera.scale <= bounds.min + 0.001;
      if (controls.zoomInBtn) controls.zoomInBtn.disabled = camera.scale >= bounds.max - 0.001;
    }
    return bounds;
  }

  function focusCameraTarget(unit, city) {
    if (unit) return { x: unit.x, y: unit.y };
    return { x: city.x, y: city.y };
  }

  window.EpohiCamera = {
    viewportMetrics,
    pointerPoint,
    mapSize,
    tileMetrics,
    fitScale,
    maxScale,
    scaleBounds,
    clampCamera,
    tileCenter,
    centerCameraOnTile,
    setCameraScale,
    applyCamera,
    focusCameraTarget,
    centerCameraOnFocus,
    showEntireMap
  };
})();
