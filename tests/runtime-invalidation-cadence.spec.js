const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('runtime invalidation request storm stays below near-frame-rate flush cadence', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.EpohiRuntimeInvalidation));
  await page.waitForFunction(() => !window.EpohiRuntimeInvalidation.stats().scheduled);

  const result = await page.evaluate(async () => {
    const before = window.EpohiRuntimeInvalidation.stats();
    const started = performance.now();
    while (performance.now() - started < 400) {
      window.EpohiRuntimeInvalidation.request('cadence-regression');
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    const after = window.EpohiRuntimeInvalidation.stats();
    return {
      requests: after.requests - before.requests,
      flushes: after.flushes - before.flushes,
      scheduled: after.scheduled
    };
  });

  expect(result.requests).toBeGreaterThanOrEqual(25);
  expect(result.flushes).toBeLessThanOrEqual(12);
  expect(result.scheduled).toBe(false);
});

test('synthetic joint-war End Turn emits retained phase timing', async ({ page }) => {
  const phases = [];
  page.on('console', message => {
    const text = message.text();
    if (!text.startsWith('[fixture-phase]')) return;
    phases.push(text);
    console.log(`EPOHI_FIXTURE_PHASE ${text}`);
  });

  await clearStorage(page);
  await createGame(page, 2, 'small');
  await page.waitForFunction(() => window.EpohiCombatWorldStability && window.__epohiDebug().state);

  const setup = await page.evaluate(() => {
    const gs = window.__epohiDebug().state;
    const [ally, target] = gs.rivals;
    ally.met = target.met = true;
    ally.relation = 'ally';
    target.relation = 'neutral';
    ally.diplomacy[target.civilizationId] = 'neutral';
    ally.diplomacy.grievances = 0;
    ally.diplomacy.trust = 80;
    ally.units = [];
    target.units = [];
    gs.barbarians = [];
    gs.diplomaticProposals = [];
    const modulo = (Number(String(ally.civilizationId).replace(/\D/g, '')) || 0) % 4;
    gs.turn = (modulo || 4) - 1;
    return { ally: ally.civilizationId, target: target.civilizationId, beforeTurn: gs.turn };
  });

  const started = Date.now();
  try {
    await page.getByRole('button', { name: /Завершить ход/i }).click();
    await page.waitForFunction(
      beforeTurn => window.__epohiDebug().state.turn > beforeTurn && !window.__epohiDebug().isTurnProcessing(),
      setup.beforeTurn
    );
  } finally {
    console.log(`EPOHI_FIXTURE_END_TURN totalMs=${Date.now() - started} phases=${JSON.stringify(phases)}`);
  }

  const proposal = await page.evaluate(({ ally, target }) => window.__epohiDebug().state.diplomaticProposals.find(
    item => item.type === 'jointWar' && item.civId === ally && item.targetId === target
  ), setup);
  expect(proposal).toMatchObject({ type: 'jointWar', status: 'pending' });
});
