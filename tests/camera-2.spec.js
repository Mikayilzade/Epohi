const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

async function cameraState(page) {
  return page.evaluate(() => {
    const debug = window.__epohiDebug();
    const camera = debug.getCamera();
    const bounds = debug.getCameraScaleBounds();
    const viewport = document.getElementById('mapViewport');
    const map = document.getElementById('map');
    return {
      camera: { x: camera.x, y: camera.y, scale: camera.scale },
      bounds,
      viewport: { width: viewport.clientWidth - 10, height: viewport.clientHeight - 10 },
      map: { width: map.offsetWidth, height: map.offsetHeight },
      zoomInDisabled: document.getElementById('zoomInBtn').disabled,
      zoomOutDisabled: document.getElementById('zoomOutBtn').disabled,
      zoomText: document.getElementById('zoomValue').textContent
    };
  });
}

async function clickZoomUntilDisabled(page, selector, readDisabled, maxClicks = 50) {
  for (let i = 0; i < maxClicks; i++) {
    const info = await cameraState(page);
    if (info[readDisabled]) return info;
    await page.locator(selector).click();
  }
  return cameraState(page);
}

async function zoomAboveFit(page) {
  return page.evaluate(() => {
    const debug = window.__epohiDebug();
    const bounds = debug.getCameraScaleBounds();
    const scale = Math.min(bounds.max, Math.max(bounds.min * 3, 2.4));
    debug.setCameraScale(scale, null, null, false);
    return scale;
  });
}

async function tileScreenCenter(page, x, y) {
  return page.evaluate(({ x, y }) => {
    const viewport = document.getElementById('mapViewport');
    const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
    const viewportRect = viewport.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();
    const style = getComputedStyle(viewport);
    const padLeft = parseFloat(style.paddingLeft) || 0;
    const padRight = parseFloat(style.paddingRight) || 0;
    const padTop = parseFloat(style.paddingTop) || 0;
    const padBottom = parseFloat(style.paddingBottom) || 0;
    const contentWidth = viewport.clientWidth - padLeft - padRight;
    const contentHeight = viewport.clientHeight - padTop - padBottom;
    return {
      x: tileRect.left + tileRect.width / 2,
      y: tileRect.top + tileRect.height / 2,
      viewportCenterX: viewportRect.left + padLeft + contentWidth / 2,
      viewportCenterY: viewportRect.top + padTop + contentHeight / 2
    };
  }, { x, y });
}

async function waitForTileCentered(page, x, y) {
  await expect.poll(async () => {
    const centered = await tileScreenCenter(page, x, y);
    return Math.max(
      Math.abs(centered.x - centered.viewportCenterX),
      Math.abs(centered.y - centered.viewportCenterY)
    );
  }, { timeout: 2000, intervals: [16, 32, 64, 100] }).toBeLessThan(0.2);
}

function expectCameraPositionWithinBounds(info) {
  const scaledWidth = info.map.width * info.camera.scale;
  const scaledHeight = info.map.height * info.camera.scale;
  if (scaledWidth <= info.viewport.width) {
    expect(info.camera.x).toBeCloseTo((info.viewport.width - scaledWidth) / 2, 1);
  } else {
    expect(info.camera.x).toBeGreaterThanOrEqual(info.viewport.width - scaledWidth - 1);
    expect(info.camera.x).toBeLessThanOrEqual(1);
  }
  if (scaledHeight <= info.viewport.height) {
    expect(info.camera.y).toBeCloseTo((info.viewport.height - scaledHeight) / 2, 1);
  } else {
    expect(info.camera.y).toBeGreaterThanOrEqual(info.viewport.height - scaledHeight - 1);
    expect(info.camera.y).toBeLessThanOrEqual(1);
  }
}

async function findVisibleTileClickPoint(page) {
  return page.evaluate(() => {
    const viewport = document.getElementById('mapViewport');
    const rect = viewport.getBoundingClientRect();
    const fractions = [0.5, 0.44, 0.56, 0.38, 0.62, 0.32, 0.68, 0.26, 0.74, 0.2, 0.8];

    for (const yFraction of fractions) {
      for (const xFraction of fractions) {
        const clientX = rect.left + rect.width * xFraction;
        const clientY = rect.top + rect.height * yFraction;
        const elements = document.elementsFromPoint(clientX, clientY);
        for (const element of elements) {
          const tile = element.matches && element.matches('.tile')
            ? element
            : (element.closest ? element.closest('.tile') : null);
          if (tile) {
            return {
              clientX,
              clientY,
              tileX: tile.dataset.x,
              tileY: tile.dataset.y
            };
          }
        }
      }
    }

    return null;
  });
}

async function expectLargeMapFitsViewport(page, viewportSize) {
  await page.setViewportSize(viewportSize);
  await clearStorage(page);
  await createGame(page, 0, 'large');
  await page.locator('#showMapBtn').click();
  const info = await cameraState(page);
  const requiredFitScale = Math.min(info.viewport.width / info.map.width, info.viewport.height / info.map.height);

  expect(info.camera.scale).toBeCloseTo(info.bounds.min, 2);
  expect(info.bounds.min).toBeCloseTo(requiredFitScale, 3);
  expect(info.map.width * info.camera.scale).toBeLessThanOrEqual(info.viewport.width + 1);
  expect(info.map.height * info.camera.scale).toBeLessThanOrEqual(info.viewport.height + 1);
  expect(info.camera.x).toBeCloseTo((info.viewport.width - info.map.width * info.camera.scale) / 2, 1);
  expect(info.camera.y).toBeCloseTo((info.viewport.height - info.map.height * info.camera.scale) / 2, 1);
  if (requiredFitScale < 0.18) expect(info.bounds.min).toBeLessThan(0.18);
}

test.describe('Camera 2.0', () => {
  test('fit scale shows whole map and dynamic bounds vary by map size', async ({ page }) => {
    const mins = [];
    for (const size of ['small', 'normal', 'large']) {
      await clearStorage(page);
      await createGame(page, 0, size);
      await page.locator('#showMapBtn').click();
      const info = await cameraState(page);
      mins.push(info.bounds.min);
      expect(info.camera.scale).toBeCloseTo(info.bounds.min, 2);
      expect(info.map.width * info.camera.scale).toBeLessThanOrEqual(info.viewport.width + 1);
      expect(info.map.height * info.camera.scale).toBeLessThanOrEqual(info.viewport.height + 1);
    }
    expect(new Set(mins.map((value) => value.toFixed(3))).size).toBeGreaterThan(1);
  });

  test('large map can fit short portrait and landscape viewports below legacy minimum', async ({ page }) => {
    await expectLargeMapFitsViewport(page, { width: 390, height: 667 });
    await expectLargeMapFitsViewport(page, { width: 844, height: 390 });
  });

  test('deep max zoom exceeds old 200% limit and plus/minus respect bounds', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'normal');
    let info = await cameraState(page);
    expect(info.bounds.max).toBeGreaterThan(2);

    info = await clickZoomUntilDisabled(page, '#zoomInBtn', 'zoomInDisabled');
    expect(info.camera.scale).toBeCloseTo(info.bounds.max, 2);
    expect(info.zoomInDisabled).toBe(true);
    expect(info.zoomText).toBe(`${Math.round(info.camera.scale * 100)}%`);

    info = await clickZoomUntilDisabled(page, '#zoomOutBtn', 'zoomOutDisabled');
    expect(info.camera.scale).toBeCloseTo(info.bounds.min, 2);
    expect(info.zoomOutDisabled).toBe(true);
    expect(info.zoomText).toBe(`${Math.round(info.camera.scale * 100)}%`);
  });

  test('show entire map centers map and center control targets selected unit or capital', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'normal');
    await page.locator('#showMapBtn').click();
    let info = await cameraState(page);
    expect(info.camera.x).toBeCloseTo((info.viewport.width - info.map.width * info.camera.scale) / 2, 1);
    expect(info.camera.y).toBeCloseTo((info.viewport.height - info.map.height * info.camera.scale) / 2, 1);

    await zoomAboveFit(page);
    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      state.units[0].x = 2;
      state.units[0].y = 3;
      debug.render();
    });
    await page.waitForFunction(() => document.querySelector('.tile[data-x="2"][data-y="3"]'));
    await page.evaluate(() => window.__epohiDebug().centerCameraOnFocus(true));
    await waitForTileCentered(page, 2, 3);
    let centered = await tileScreenCenter(page, 2, 3);
    expect(centered.x).toBeCloseTo(centered.viewportCenterX, 1);
    expect(centered.y).toBeCloseTo(centered.viewportCenterY, 1);

    await zoomAboveFit(page);
    const capital = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      debug.state.units = [];
      debug.render();
      return { x: debug.state.city.x, y: debug.state.city.y };
    });
    await page.waitForFunction(({ x, y }) => document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`), capital);
    await page.evaluate(() => window.__epohiDebug().centerCameraOnFocus(true));
    await waitForTileCentered(page, capital.x, capital.y);
    centered = await tileScreenCenter(page, capital.x, capital.y);
    expect(centered.x).toBeCloseTo(centered.viewportCenterX, 1);
    expect(centered.y).toBeCloseTo(centered.viewportCenterY, 1);
  });

  test('stored scale normalizes safely across reload, pinch stays bounded, resize reclamps, and tile click still works', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'normal');
    await expect(page.locator('#gameApp')).toBeVisible();
    await page.waitForFunction(() => window.__epohiDebug && window.__epohiDebug().state && document.querySelector('#map .tile'));

    // Exercise the actual persisted-camera boundary. Mutating the debug camera object
    // alone never writes storage: production persistence happens through EpohiCameraStorage.
    // Seed an intentionally out-of-range legacy value directly, prove it reached storage,
    // then reload so any startup/layout normalization may clamp and persist a safe value.
    await page.evaluate(() => {
      localStorage.setItem(
        window.EpohiConfig.CAMERA_KEY,
        JSON.stringify({ x: -99999, y: -99999, scale: 99 })
      );
    });
    expect(await page.evaluate(() => {
      const raw = localStorage.getItem(window.EpohiConfig.CAMERA_KEY);
      return raw ? JSON.parse(raw).scale : null;
    })).toBe(99);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'ЭПОХИ' })).toBeVisible();
    await page.locator('[data-continue]').first().click();
    await expect(page.locator('#gameApp')).toBeVisible();

    let info = await cameraState(page);
    expect(info.camera.scale).toBeGreaterThanOrEqual(info.bounds.min - 0.01);
    expect(info.camera.scale).toBeLessThanOrEqual(info.bounds.max + 0.01);
    expectCameraPositionWithinBounds(info);
    const persistedScale = await page.evaluate(() => {
      const raw = localStorage.getItem(window.EpohiConfig.CAMERA_KEY);
      return raw ? JSON.parse(raw).scale : null;
    });
    expect(Number.isFinite(persistedScale)).toBe(true);
    expect(persistedScale).toBeCloseTo(info.camera.scale, 2);
    expect(persistedScale).toBeGreaterThanOrEqual(info.bounds.min - 0.01);
    expect(persistedScale).toBeLessThanOrEqual(info.bounds.max + 0.01);

    await page.evaluate(() => {
      const viewport = document.getElementById('mapViewport');
      viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 91, pointerType: 'touch', clientX: 120, clientY: 160, bubbles: true }));
      viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 92, pointerType: 'touch', clientX: 220, clientY: 160, bubbles: true }));
      viewport.dispatchEvent(new PointerEvent('pointermove', { pointerId: 92, pointerType: 'touch', clientX: 820, clientY: 160, bubbles: true }));
      viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 91, pointerType: 'touch', clientX: 120, clientY: 160, bubbles: true }));
      viewport.dispatchEvent(new PointerEvent('pointerup', { pointerId: 92, pointerType: 'touch', clientX: 820, clientY: 160, bubbles: true }));
    });
    info = await cameraState(page);
    expect(info.camera.scale).toBeLessThanOrEqual(info.bounds.max + 0.01);

    await page.setViewportSize({ width: 390, height: 700 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    info = await cameraState(page);
    expect(info.camera.scale).toBeGreaterThanOrEqual(info.bounds.min - 0.01);
    expect(info.camera.scale).toBeLessThanOrEqual(info.bounds.max + 0.01);

    await page.evaluate(() => window.__epohiDebug().setCameraScale(3, null, null, false));
    const box = await page.locator('#mapViewport').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20);
    await page.mouse.up();
    await page.waitForFunction(() => !document.getElementById('mapViewport').classList.contains('dragging'));

    const visibleTile = await findVisibleTileClickPoint(page);
    expect(visibleTile).not.toBeNull();
    await page.mouse.click(visibleTile.clientX, visibleTile.clientY);
    await expect(page.locator(`.tile.inspect-tile[data-x="${visibleTile.tileX}"][data-y="${visibleTile.tileY}"]`)).toHaveCount(1);
    await expect(page.locator('#contextTitle')).toHaveText(/\S/);
  });
});
