const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

async function ready(page) {
  await clearStorage(page);
  await createGame(page, 0);
  await page.waitForFunction(() => window.EpohiContextReviewCleanup && window.__epohiDebug().state);
}

test('tapping a remaining own-unit stack rebases selection after the previously selected unit moved away', async ({ page }) => {
  await ready(page);
  const ids = await page.evaluate(() => {
    const gs = window.__epohiDebug().state;
    const def = window.EpohiData.UNIT_DEFS.scout;
    gs.units = [0, 1, 2].map(index => ({
      id: `reentry-scout-${index}`,
      type: 'scout',
      x: 5,
      y: 5,
      moves: def.maxMoves,
      acted: false,
      hp: def.maxHealth,
      maxHp: def.maxHealth,
      travelOrder: null
    }));
    [[5,5],[6,5]].forEach(([x,y]) => {
      gs.map[y][x].terrain = 'plains';
      gs.map[y][x].revealed = true;
    });
    window.__epohiDebug().render();
    return gs.units.map(unit => unit.id);
  });

  const stackTile = page.locator('#map .tile[data-x="5"][data-y="5"]');
  await stackTile.locator('.piece.unit, .unit-count').first().click();
  await page.locator(`[data-context-stack-picker] [data-unit-id="${ids[0]}"]`).click();
  await page.locator('#contextActions [data-path-action="start"]').click();
  await page.locator('#map .tile[data-x="6"][data-y="5"]').click();
  await expect.poll(() => page.evaluate(id => {
    const unit = window.__epohiDebug().state.units.find(item => item.id === id);
    return unit && [unit.x, unit.y];
  }, ids[0])).toEqual([6, 5]);

  await stackTile.locator('.piece.unit, .unit-count').first().click();
  await expect.poll(() => page.evaluate(() => window.__epohiDebug().getSelectedUnitId())).toBe(ids[1]);
  await expect(page.locator('[data-context-stack-picker] .context-stack-unit')).toHaveCount(2);
  await expect(page.locator(`[data-context-stack-picker] [data-unit-id="${ids[1]}"]`)).toBeVisible();
  await expect(page.locator(`[data-context-stack-picker] [data-unit-id="${ids[2]}"]`)).toBeVisible();
});