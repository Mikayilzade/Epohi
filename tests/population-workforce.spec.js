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

async function openCapital(page) {
  const capital = page.locator('#map .piece.city.player-capital');
  await expect(capital).toBeVisible();
  await capital.click();
  const openCity = page.locator('#contextActions [data-context-action="open-city"]');
  await expect(openCity).toBeVisible();
  await openCity.click();
}

test.describe('Население и рабочая сила', () => {
  test('workforce wiki decoration follows the explicit wiki render', async ({ page }) => {
    const problems = await openFreshGame(page);
    await page.locator('#menuBtn').click();
    await page.locator('#wikiBtn').click();
    await expect(page.locator('#wikiContent [data-workforce-wiki]')).toHaveCount(1);
    await expectNoConsoleProblems(problems);
  });

  test('UI refresh does not assign workers without a state command', async ({ page }) => {
    await openFreshGame(page);
    const result = await page.evaluate(async () => {
      const gs = window.__epohiDebug().state;
      const city = gs.cities[0];
      city.population = 2;
      window.__epohiDebug().render();
      await new Promise(resolve => setTimeout(resolve, 100));
      const afterRender = { known:city.workforceKnownPopulation,
        assigned:window.EpohiPopulationWorkforce.workforceTotal(city.workforce) };
      window.EpohiPopulationWorkforce.reconcileState(gs);
      return { afterRender, afterCommand:{ known:city.workforceKnownPopulation,
        assigned:window.EpohiPopulationWorkforce.workforceTotal(city.workforce) } };
    });
    expect(result.afterRender).toEqual({ known:1, assigned:0 });
    expect(result.afterCommand).toEqual({ known:2, assigned:1 });
  });

  test('accepting refugees assigns the new community at the decision command', async ({ page }) => {
    await openFreshGame(page);
    const result = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      gs.city.food = 10;
      gs.humanJourney.queuedEvents.push('refugees');
      const accepted = window.EpohiHumansJourney.resolveEvent('refugees', 'welcome');
      return { accepted, population:gs.city.population,
        known:gs.city.workforceKnownPopulation,
        assigned:window.EpohiPopulationWorkforce.workforceTotal(gs.city.workforce),
        event:gs.eventLog.some(item => item.eventType === 'population-workforce-assigned') };
    });
    expect(result).toEqual({ accepted:true, population:2, known:2, assigned:1, event:true });
  });

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

    await openCapital(page);
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

    await openCapital(page);
    await page.locator('[data-workforce-focus="food"]').click();
    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      debug.state.cities[0].population = 3;
      window.EpohiPopulationWorkforce.reconcileState(debug.state);
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
