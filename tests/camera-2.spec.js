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

  test('deep max zoom exceeds old 200% limit and plus/minus respect bounds', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'normal');
    let info = await cameraState(page);
    expect(info.bounds.max).toBeGreaterThan(2);
    for (let i = 0; i < 30; i++) await page.locator('#zoomInBtn').click();
    info = await cameraState(page);
    expect(info.camera.scale).toBeCloseTo(info.bounds.max, 2);
    expect(info.zoomInDisabled).toBe(true);
    expect(info.zoomText).toBe(`${Math.round(info.camera.scale * 100)}%`);
    for (let i = 0; i < 40; i++) await page.locator('#zoomOutBtn').click();
    info = await cameraState(page);
    expect(info.camera.scale).toBeCloseTo(info.bounds.min, 2);
    expect(info.zoomOutDisabled).toBe(true);
  });

  test('show entire map centers map and center control targets selected unit or capital', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'normal');
    await page.locator('#showMapBtn').click();
    let info = await cameraState(page);
    expect(info.camera.x).toBeCloseTo((info.viewport.width - info.map.width * info.camera.scale) / 2, 1);
    expect(info.camera.y).toBeCloseTo((info.viewport.height - info.map.height * info.camera.scale) / 2, 1);

    const changed = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      state.units[0].x = 2;
      state.units[0].y = 3;
      debug.render();
      debug.centerCameraOnFocus(true);
      return debug.getCamera();
    });
    expect(changed.x).not.toBeCloseTo(info.camera.x, 0);

    const capitalCentered = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      debug.state.units = [];
      debug.render();
      debug.centerCameraOnFocus(true);
      return debug.getCamera();
    });
    expect(capitalCentered.x).not.toBe(changed.x);
  });

  test('stored scale clamps after layout, pinch stays bounded, resize reclamps, and tile click still works', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem(window.EpohiConfig.CAMERA_KEY, JSON.stringify({ x: -99999, y: -99999, scale: 99 })));
    await createGame(page, 0, 'normal');
    let info = await cameraState(page);
    expect(info.camera.scale).toBeCloseTo(info.bounds.max, 2);

    const box = await page.locator('#mapViewport').boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2 - 20, box.y + box.height / 2);
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
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20);
    await page.mouse.up();
    await page.locator('.tile[data-x="14"][data-y="14"]').click({ force: true });
    await expect(page.locator('#contextTitle')).toContainText('Клетка');
  });
});
