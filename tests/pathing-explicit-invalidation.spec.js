const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

test.describe('Pathing explicit invalidation bridge', () => {
  test('unit tile tap restores route controls even when pointerup is retargeted to the map viewport', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await page.waitForFunction(() => Boolean(
      window.__epohiDebug &&
      window.EpohiRuntimeInvalidation &&
      window.EpohiHumansPathingUI
    ));

    const fixture = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const selectedId = debug.getSelectedUnitId();
      const unit = state.units.find(item => String(item.id) === String(selectedId)) || state.units[0];
      state.barbarians = [];
      state.rivals = [];
      state.map.forEach(row => row.forEach(tile => {
        tile.revealed = true;
        tile.terrain = 'plains';
        tile.camp = null;
        tile.poi = null;
      }));
      state.units = [unit];
      unit.moves = window.EpohiData.UNIT_DEFS[unit.type].maxMoves;
      unit.acted = false;
      unit.travelOrder = null;
      unit.order = null;
      debug.render();
      const stats = window.EpohiRuntimeInvalidation.stats();
      return {
        id: unit.id,
        x: unit.x,
        y: unit.y,
        pathingSyncs: stats.pathingSyncs,
        tilePointerSignals: stats.tilePointerSignals
      };
    });

    // Do not call EpohiHumansPathingUI.refresh() here. The real mobile gesture must
    // restore pathing controls through the explicit invalidation lifecycle.
    const routeStart = page.locator('[data-path-action="start"]');
    await page.locator(`.tile[data-x="${fixture.x}"][data-y="${fixture.y}"]`).click();
    const actionabilityStartedAt = Date.now();
    await expect(routeStart).toBeVisible({ timeout: 1000 });
    expect(Date.now() - actionabilityStartedAt).toBeLessThanOrEqual(1000);

    const afterTap = await page.evaluate(() => {
      const stats = window.EpohiRuntimeInvalidation.stats();
      return {
        selectedId: window.__epohiDebug().getSelectedUnitId(),
        pathingSyncs: stats.pathingSyncs,
        tilePointerSignals: stats.tilePointerSignals
      };
    });
    expect(String(afterTap.selectedId)).toBe(String(fixture.id));
    expect(afterTap.tilePointerSignals).toBeGreaterThan(fixture.tilePointerSignals);
    expect(afterTap.pathingSyncs).toBeGreaterThan(fixture.pathingSyncs);

    // Pointer capture can retarget the same lifecycle to #mapViewport. Prove that
    // this target is still an owned map-action boundary and schedules pathing sync.
    await page.locator('#mapViewport').dispatchEvent('pointerup', {
      bubbles: true,
      pointerId: 4242,
      pointerType: 'touch',
      isPrimary: true
    });
    await page.waitForFunction(({ pointerSignals, pathingSyncs }) => {
      const stats = window.EpohiRuntimeInvalidation.stats();
      return stats.tilePointerSignals > pointerSignals && stats.pathingSyncs > pathingSyncs;
    }, {
      pointerSignals: afterTap.tilePointerSignals,
      pathingSyncs: afterTap.pathingSyncs
    }, { timeout: 1000 });
    await expect(routeStart).toBeVisible({ timeout: 1000 });
    await expectNoConsoleProblems(problems);
  });
});
