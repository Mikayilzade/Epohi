const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('invalid diplomacy is cancelled by turn rules, not panel rendering', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 2, 'normal');
  const before = await page.evaluate(() => {
    const state = window.__epohiDebug().state;
    const [proposer, target] = state.rivals;
    target.relation = 'war';
    state.diplomaticProposals = [{
      id:'invalid-joint-war', type:'jointWar', civId:proposer.civilizationId,
      targetId:target.civilizationId, status:'pending', createdTurn:state.turn
    }];
    window.EpohiCombatWorldStability.render();
    return state.diplomaticProposals[0].status;
  });
  expect(before).toBe('pending');
  const turn = await page.evaluate(() => window.__epohiDebug().state.turn);
  await page.locator('#endTurnBtn').click();
  await page.waitForFunction(previous => window.__epohiDebug().state.turn > previous
    && !window.__epohiDebug().isTurnProcessing(), turn);
  expect(await page.evaluate(() => window.__epohiDebug().state.diplomaticProposals[0].status))
    .toBe('cancelled');
});
