const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

test.describe('Pathing explicit invalidation bridge', () => {
  test('unit tile tap restores route controls through RuntimeInvalidation without a manual pathing refresh', async ({ page }) => {
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

    // Do not call EpohiHumansPathingUI.refresh() here. This regression specifically
    // proves the real mobile pointer lifecycle owns the refresh after app.js rebuilds
    // context and suppresses the synthetic click for a tap.
    const routeStart = page.locator('[data-path-action="start"]');
    const actionabilityStartedAt = Date.now();
    await page.locator(`.tile[data-x="${fixture.x}"][data-y="${fixture.y}"]`).click();
    await expect(routeStart).toBeVisible({ timeout: 1000 });
    expect(Date.now() - actionabilityStartedAt).toBeLessThanOrEqual(1000);

    const result = await page.evaluate(() => {
      const stats = window.EpohiRuntimeInvalidation.stats();
      return {
        selectedId: window.__epohiDebug().getSelectedUnitId(),
        pathingSyncs: stats.pathingSyncs,
        tilePointerSignals: stats.tilePointerSignals
      };
    });
    expect(String(result.selectedId)).toBe(String(fixture.id));
    expect(result.tilePointerSignals).toBeGreaterThan(fixture.tilePointerSignals);
    expect(result.pathingSyncs).toBeGreaterThan(fixture.pathingSyncs);
    await expectNoConsoleProblems(problems);
  });
});
