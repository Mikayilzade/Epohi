const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

async function openGame(page, rivals = 2) {
  const problems = watchConsole(page);
  await clearStorage(page);
  await createGame(page, rivals, 'small');
  await page.waitForFunction(() => Boolean(
    window.EpohiDiplomacyEventFlow &&
    window.EpohiEventOverlayPolicy &&
    window.EpohiChronicleUI &&
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    document.getElementById('strategyReadiness')
  ));
  return problems;
}

test.describe('Дипломатия, выбор объектов и события', () => {
  test('категория сначала выбирает готовый отряд и сбрасывает при переходе к городу', async ({ page }) => {
    const problems = await openGame(page, 0);

    const setup = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const soldiers = state.units.filter(unit => unit.type !== 'worker');
      const original = soldiers[0];
      const second = soldiers[1] || Object.assign({}, original, { id: 'priority-second', name: 'Второй отряд' });
      if (!soldiers[1]) state.units.push(second);
      const third = Object.assign({}, original, { id: 'priority-third', name: 'Третий отряд' });
      state.units.push(third);
      [original, second, third].forEach(unit => {
        unit.moves = 0;
        unit.acted = true;
        unit.travelOrder = null;
        unit.order = null;
      });
      second.moves = 1;
      second.acted = false;
      debug.render();
      window.EpohiDiplomacyEventFlow.refresh();
      return {
        ready: String(second.id),
        ids: [String(original.id), String(second.id), String(third.id)]
      };
    });

    const warriors = page.locator('#strategyReadiness [data-ready-kind="units"]');
    await warriors.click();
    expect(String(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId()))).toBe(setup.ready);

    await warriors.click();
    expect(String(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId()))).not.toBe(setup.ready);

    await page.locator('#strategyReadiness [data-ready-kind="cities"]').click();
    await warriors.click();
    expect(String(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId()))).toBe(setup.ready);
    await expectNoConsoleProblems(problems);
  });

  test('игрок может предложить торговый путь, когда технология хранится в technologies', async ({ page }) => {
    const problems = await openGame(page, 2);

    const civId = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const civ = state.rivals[1] || state.rivals[0];
      state.researched = (state.researched || []).filter(id => id !== 'trade');
      state.technologies = Array.from(new Set([].concat(state.technologies || [], ['trade'])));
      civ.met = true;
      civ.relation = 'ally';
      civ.technologies = Array.from(new Set([].concat(civ.technologies || [], ['trade'])));
      civ.nextTradeProposalTurn = 0;
      civ.diplomacy = civ.diplomacy || {};
      civ.diplomacy.trust = 90;
      civ.diplomacy.grievances = 0;
      civ.diplomacy.score = 40;
      debug.render();
      window.EpohiStrategyUX.openDiplomacy(civ.civilizationId);
      window.EpohiDiplomacyEventFlow.refresh();
      return String(civ.civilizationId);
    });

    const trade = page.locator(`[data-player-trade="${civId}"]`);
    await expect(trade).toBeVisible();
    await expect(trade).toContainText('+2 золота/ход');
    await trade.click();

    const route = await page.evaluate(id => window.__epohiDebug().state.tradeRoutes.find(item => String(item.civId) === id && item.status === 'active'), civId);
    expect(route).toBeTruthy();
    expect(route.remainingTurns).toBe(8);
    expect(route.goldPerTurn).toBe(2);
    await expect(page.locator(`[data-diplomacy-civ="${civId}"]`)).toContainText('путь уже действует');
    await expectNoConsoleProblems(problems);
  });

  test('предложения прямо показывают последствия принятия и отказа', async ({ page }) => {
    const problems = await openGame(page, 1);

    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const civ = state.rivals[0];
      civ.met = true;
      window.EpohiLivingCivilizations.createProposal(state, civ, 'peace', 'Предлагаем завершить войну.');
      window.EpohiLivingCivilizations.renderUI(state);
      window.EpohiDiplomacyEventFlow.refresh();
    });

    const proposal = page.locator('#livingProposals article').first();
    await expect(proposal).toBeVisible();
    await expect(proposal).toContainText('обиды −20');
    await expect(proposal).toContainText('доверие −5');
    await expect(proposal.locator('[data-answer="no"]')).toContainText('доверие −5');
    await expectNoConsoleProblems(problems);
  });

  test('события попадают в летопись, старые окна скрыты, сообщение исчезает', async ({ page }) => {
    const problems = await openGame(page, 0);

    const text = 'Проверочное событие для летописи.';
    await page.evaluate(eventText => {
      const state = window.__epohiDebug().state;
      state.eventLog.unshift({ eventId: 'flow-test-event', turn: state.turn, eventType: 'city-growth', text: eventText });
      window.EpohiDiplomacyEventFlow.syncEvents(state);
    }, text);

    await expect(page.locator('#feedbackWorldEvents')).toBeHidden();
    await expect(page.locator('#stabilityMajorModal')).toBeHidden();
    await expect(page.locator('#flowEventToast')).toHaveClass(/show/);
    expect(await page.evaluate(eventText => window.__epohiDebug().state.history.some(line => line.includes(eventText)), text)).toBe(true);

    await page.evaluate(() => window.EpohiChronicleUI.open());
    await expect(page.locator('#flowChronicleModal')).toHaveClass(/show/);
    await expect(page.locator('#flowChronicleContent')).toContainText(text);
    await page.locator('[data-flow-chronicle-close]').click();

    await page.waitForTimeout(2000);
    await expect(page.locator('#flowEventToast')).not.toHaveClass(/show/);
    await expectNoConsoleProblems(problems);
  });

  test('крупное событие не блокирует экран и остаётся в летописи', async ({ page }) => {
    const problems = await openGame(page, 0);

    const text = 'Пала столица тестового государства.';
    await page.evaluate(eventText => {
      const state = window.__epohiDebug().state;
      state.eventLog.unshift({ eventId: 'flow-major-test', turn: state.turn, eventType: 'capital-fallen', text: eventText });
      window.EpohiCombatWorldStability.render();
      window.EpohiEventOverlayPolicy.normalize();
    }, text);

    await expect(page.locator('#stabilityMajorModal')).not.toHaveClass(/show/);
    await expect(page.locator('#flowEventToast')).toContainText(text);
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
    expect(await page.evaluate(eventText => window.__epohiDebug().state.history.some(line => line.includes(eventText)), text)).toBe(true);
    await expectNoConsoleProblems(problems);
  });

  test('перешедший город сохраняет специализацию', async ({ page }) => {
    const problems = await openGame(page, 1);

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals[0];
      const city = civ.cities[0];
      city.specialization = 'production';
      const id = city.id;
      window.EpohiCombatWorldStability.resolveFactionDefeat(state, civ, state);
      const captured = state.cities.find(item => item.id === id);
      return captured && captured.specialization;
    });

    expect(result).toBe('production');
    await expectNoConsoleProblems(problems);
  });
});
