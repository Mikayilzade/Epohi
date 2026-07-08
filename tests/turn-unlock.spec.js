const { test, expect } = require("@playwright/test");
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require("./helpers");



test.describe('v1.4.5.1 turn unlock hotfix', () => {
  test('turn 130 advances to 131', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await page.evaluate(() => {
      const d = window.__epohiDebug();
      d.state.turn = 130;
      d.render();
    });
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('131');
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
  });

  test('rejected autosave does not leave the end turn button disabled', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await page.evaluate(() => {
      window.__epohiDebug().setAutoSaveForTests(() => Promise.reject(new Error('autosave failed for test')));
    });
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('2');
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
  });

  test('pending autosave does not prevent the next turn after calculation finishes', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await page.evaluate(() => {
      window.__epohiDebug().setAutoSaveForTests(() => new Promise(() => {}));
    });
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('2');
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('3');
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
  });

  test('canSaveNow returns true after turn calculation while autosave is still pending', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await page.evaluate(() => {
      window.__epohiDebug().setAutoSaveForTests(() => new Promise(() => {}));
    });
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('2');
    await expect.poll(() => page.evaluate(() => window.__epohiDebug().canSaveNow())).toBe(true);
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
  });
});
