const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('research choice and completion follow prerequisites and accumulated science', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');
  const before = await page.evaluate(() => {
    const state = window.__epohiDebug().state;
    const progression = window.EpohiProgression;
    const techs = window.EpohiData.TECHS;
    const rejected = progression.chooseResearch(state, 'statehood', techs);
    const selected = progression.chooseResearch(state, 'agriculture', techs);
    state.resources.science = techs.agriculture.cost - 1;
    state.barbarianActivity = 'off';
    return { turn:state.turn, rejected, selected, cost:techs.agriculture.cost };
  });
  expect(before.rejected).toBe(false);
  expect(before.selected).toBe(true);
  await page.evaluate(() => window.__epohiDebug().endTurn());
  await page.waitForFunction(turn => window.__epohiDebug().state.turn > turn
    && !window.__epohiDebug().isTurnProcessing(), before.turn);
  const after = await page.evaluate(() => {
    const state = window.__epohiDebug().state;
    return {
      selected:state.currentResearch,
      researched:state.researched.filter(id => id === 'agriculture'),
      science:state.resources.science,
      history:state.history.filter(item => item.includes('исследована технология'))
    };
  });
  expect(after.selected).toBe(null);
  expect(after.researched).toEqual(['agriculture']);
  expect(after.science).toBeGreaterThanOrEqual(0);
  expect(after.history).toHaveLength(1);
  expect(after.history[0]).toContain('Земледелие');
});
