const { test, expect } = require('@playwright/test');
const { watchConsole, expectNoConsoleProblems, clearStorage, createGame } = require('./helpers');

async function openGame(page, rivals = 1) {
  const problems = watchConsole(page);
  await clearStorage(page);
  await createGame(page, rivals, 'small');
  await page.waitForFunction(() => Boolean(
    window.EpohiEventOverlayPolicy &&
    window.EpohiDiplomacyCoherence &&
    window.EpohiWorkerLearning &&
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    window.__epohiObserverSafetyStats
  ));
  return problems;
}

async function callbackCount(page) {
  return page.evaluate(() => Number(window.__epohiObserverSafetyStats && window.__epohiObserverSafetyStats.callbacks || 0));
}

test.describe('Mobile runtime stability', () => {
  test('pending diplomacy proposal becomes idle and remains clickable', async ({ page }) => {
    const problems = await openGame(page, 1);
    const proposalId = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      const civ = gs.rivals[0];
      civ.met = true;
      civ.relation = 'neutral';
      civ.diplomacy = civ.diplomacy || {};
      civ.diplomacy.trust = 60;
      const item = window.EpohiLivingCivilizations.createProposal(gs, civ, 'gift', 'Проверочное дипломатическое предложение.');
      window.EpohiDiplomacyCoherence.renderProposal(gs);
      return String(item.id);
    });

    await expect(page.locator('#coherenceProposalModal')).toHaveClass(/show/);
    await page.waitForTimeout(300);
    const before = await callbackCount(page);
    await page.waitForTimeout(400);
    const after = await callbackCount(page);
    expect(after - before).toBeLessThanOrEqual(6);

    await page.locator('#coherenceProposalModal [data-coherence-proposal-answer="yes"]').click({ timeout: 1000 });
    await page.waitForFunction((id) => {
      const item = window.__epohiDebug().state.diplomaticProposals.find(entry => String(entry.id) === id);
      return item && item.status !== 'pending';
    }, proposalId, { timeout: 1000 });
    await expect(page.locator('#coherenceProposalModal')).not.toHaveClass(/show/);
    await expectNoConsoleProblems(problems);
  });

  test('selected worker context does not keep mutating every animation frame', async ({ page }) => {
    const problems = await openGame(page, 0);
    await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      let worker = gs.units.find(unit => unit.type === 'worker');
      if (!worker) {
        const city = gs.cities[0];
        const def = window.EpohiData.UNIT_DEFS.worker;
        worker = {
          id:'perf-worker', type:'worker', x:city.x, y:city.y,
          moves:def.maxMoves || 1, acted:false,
          hp:def.maxHealth, maxHp:def.maxHealth, name:'Рабочий тест'
        };
        gs.units.push(worker);
      }
      const tile = gs.map[worker.y][worker.x];
      tile.revealed = true;
      window.__epohiDebug().render();
      const node = document.querySelector(`#map .tile[data-x="${worker.x}"][data-y="${worker.y}"]`);
      if (node) node.click();
      if (window.EpohiContextReviewCleanup && window.EpohiContextReviewCleanup.selectStackUnit) {
        window.EpohiContextReviewCleanup.selectStackUnit(worker.id);
      }
    });

    await page.waitForTimeout(300);
    const before = await callbackCount(page);
    await page.waitForTimeout(400);
    const after = await callbackCount(page);
    expect(after - before).toBeLessThanOrEqual(6);
    await expectNoConsoleProblems(problems);
  });
});
