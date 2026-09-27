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

test('stability schema is initialized before UI render and not rescanned by it', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');
  const result = await page.evaluate(() => {
    const state = window.__epohiDebug().state;
    const original = state.eventLog.forEach;
    let scans = 0;
    state.eventLog.forEach = function (...args) {
      scans += 1;
      return original.apply(this, args);
    };
    window.EpohiCombatWorldStability.render();
    window.EpohiCombatWorldStability.render();
    delete state.eventLog.forEach;
    return {
      scans,
      version:state.combatWorldStabilityVersion,
      capacity:state.cityCapacity,
      decisions:Array.isArray(state.urgentDecisions)
    };
  });
  expect(result.scans).toBe(0);
  expect(result.version).toBe(1);
  expect(result.capacity).toBeGreaterThanOrEqual(4);
  expect(result.decisions).toBe(true);
});
