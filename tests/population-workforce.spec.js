const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

async function openFreshGame(page) {
  const consoleProblems = watchConsole(page);
  await clearStorage(page);
  await createGame(page, 0, 'small');
  await page.waitForFunction(() => Boolean(
    window.EpohiPopulationWorkforce &&
    window.__epohiDebug &&
    window.__epohiDebug().state
  ));
  return consoleProblems;
}

test.describe('Население и рабочая сила', () => {
  test('каждая община после первой получает занятие и видна в городе', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const city = state.cities[0];
      city.population = 2;
      delete city.workforce;
      delete city.growthFocus;
      delete city.workforceKnownPopulation;
      state.populationWorkforceVersion = 0;
      window.EpohiPopulationWorkforce.reconcileState(state, { announce: false, toast: false });
      debug.render();
    });

    await page.locator('#cityBtn').click();
    const panel = page.locator('[data-population-workforce-panel]');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('1/1 общин');
    await expect(panel).toContainText('🔨+1');
    await expect(panel.locator('[data-workforce-focus]')).toHaveCount(4);
    await expect(panel.locator('[data-workforce-focus="production"]')).toHaveClass(/active/);
    await expectNoConsoleProblems(consoleProblems);
  });

  test('направление роста назначает следующую общину, не убирая прежний доход', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const city = state.cities[0];
      city.population = 2;
      city.workforce = { food: 0, production: 1, gold: 0, science: 0 };
      city.growthFocus = 'production';
      city.workforceKnownPopulation = 2;
      state.populationWorkforceVersion = 1;
      debug.render();
    });

    await page.locator('#cityBtn').click();
    await page.locator('[data-workforce-focus="food"]').click();
    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      debug.state.cities[0].population = 3;
      debug.render();
    });
    await page.waitForFunction(() => {
      const city = window.__epohiDebug().state.cities[0];
      return city.workforce && city.workforce.food === 1 && city.workforce.production === 1;
    });

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const city = state.cities[0];
      return {
        workforce: city.workforce,
        focus: city.growthFocus,
        event: state.eventLog.find(item => item.eventType === 'population-workforce-assigned')
      };
    });

    expect(result.workforce).toEqual({ food: 1, production: 1, gold: 0, science: 0 });
    expect(result.focus).toBe('food');
    expect(result.event.text).toContain('+1 еда за ход');
    await expect(page.locator('[data-population-workforce-panel]')).toContainText('🍞+1');
    await expectNoConsoleProblems(consoleProblems);
  });

  test('конец хода заменяет старый скрытый бонус еды выбранным доходом населения', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    const expected = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const city = state.cities[0];
      state.turn = 1;
      state.resources.gold = 0;
      state.resources.science = 0;
      state.currentResearch = null;
      state.tradeRoutes = [];
      state.populationWorkforceVersion = 1;
      state.populationWorkforcePreparedTurn = 0;
      if (state.humanJourney) {
        state.humanJourney.scenarioBonusGranted = true;
        state.humanJourney.lastBonusTurn = 1;
      }
      city.population = 2;
      city.food = 0;
      city.production = 0;
      city.queue = null;
      city.specialization = null;
      city.growthFocus = 'production';
      city.workforce = { food: 0, production: 1, gold: 0, science: 0 };
      city.workforceKnownPopulation = 2;
      const income = window.EpohiPopulationWorkforce.adjustedIncome(state, city);
      debug.render();
      return income;
    });

    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('2');

    const after = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const city = state.cities[0];
      return {
        food: city.food,
        production: city.production,
        gold: state.resources.gold,
        science: state.resources.science,
        preparedTurn: state.populationWorkforcePreparedTurn
      };
    });

    expect(after.food).toBe(expected.food);
    expect(after.production).toBe(expected.production);
    expect(after.gold).toBe(expected.gold);
    expect(after.science).toBe(expected.science);
    expect(after.preparedTurn).toBe(1);
    await expectNoConsoleProblems(consoleProblems);
  });
});
