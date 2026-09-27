const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('visual invalidation decorates each map tree once', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');
  const scans = await page.evaluate(() => {
    const map = document.getElementById('map');
    const original = map.querySelectorAll.bind(map);
    let tileScans = 0;
    map.querySelectorAll = function (selector) {
      if (selector === '.tile' && new Error().stack.includes('humans-visuals.js')) tileScans += 1;
      return original(selector);
    };
    const runtime = window.EpohiRuntimeInvalidation;
    runtime.flush();
    runtime.flush();
    const unchanged = tileScans;
    window.__epohiDebug().render();
    runtime.flush();
    runtime.flush();
    return {
      unchanged,
      afterRender:tileScans - unchanged,
      painted:map.querySelector('.tile.painted-tile') !== null
    };
  });
  expect(scans.unchanged).toBe(0);
  expect(scans.afterRender).toBe(1);
  expect(scans.painted).toBe(true);
});
