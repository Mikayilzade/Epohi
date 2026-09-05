const { test, expect } = require('@playwright/test');

async function openFreshGame(page, options = {}) {
  await page.goto('/');
  await expect(page.locator('#newGameScreenBtn')).toBeVisible();
  await page.locator('#newGameScreenBtn').click();
  await page.locator('#partySize').selectOption(options.size || 'small');
  await page.locator('#barbarianActivity').selectOption(options.barbarians || 'off');
  await page.locator('#rivalCount').selectOption(String(options.rivals == null ? 0 : options.rivals));
  await page.locator('#partyName').fill(options.name || 'Тест исходов');
  await page.locator('#createParty').click();
  await expect(page.locator('#gameApp')).toBeVisible();
  await page.waitForFunction(() => Boolean(
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    window.EpohiHumansOutcomes &&
    window.__epohiDebug().state.outcome
  ));
}

function secondCity(capital, overrides = {}) {
  return Object.assign({
    id: 'player-city-outcome-test',
    name: 'Новая Ардена',
    x: capital.x + 3,
    y: capital.y,
    population: 2,
    food: 0,
    production: 0,
    buildings: [],
    queue: null,
    hp: 150,
    maxHp: 150,
    capital: false
  }, overrides);
}

test.describe('Победа, поражение и восстановление цивилизации', () => {
  test('государственная победа требует дворец, два города и общее население 8', async ({ page }) => {
    await openFreshGame(page, { name: 'Государственная победа' });

    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const capital = state.cities[0];
      const palace = window.EpohiData.BUILDINGS.palace;

      capital.population = 6;
      state.cities.push({
        id: 'player-city-statehood',
        name: 'Второй город',
        x: capital.x + 3,
        y: capital.y,
        population: 2,
        food: 0,
        production: 0,
        buildings: [],
        queue: null,
        hp: 150,
        maxHp: 150,
        capital: false
      });
      state.researched = Array.from(new Set([...state.researched, 'statehood']));
      state.barbarians = [];
      state.rivals = [];
      capital.queue = {
        type: 'building',
        id: 'palace',
        progress: Math.max(0, palace.cost.production - 1),
        cost: palace.cost.production,
        upfront: {}
      };
    });

    await page.locator('#endTurnBtn').click();
    await page.waitForFunction(() => {
      const outcome = window.__epohiDebug().state.outcome;
      return outcome && outcome.status === 'victory' && outcome.type === 'statehood';
    });

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      return {
        victory: state.victory,
        defeat: state.defeat,
        outcome: state.outcome,
        progress: window.EpohiHumansOutcomes.statehoodProgress(state)
      };
    });

    expect(result.victory).toBe(true);
    expect(result.defeat).toBe(false);
    expect(result.progress.complete).toBe(true);
    await expect(page.locator('#victoryModal')).toHaveClass(/show/);
    await expect(page.locator('#victoryModalTitle')).toHaveText('Государство создано!');
  });

  test('один дворец больше не завершает неустойчивую цивилизацию', async ({ page }) => {
    await openFreshGame(page, { name: 'Ранний дворец' });

    await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const city = state.cities[0];
      const palace = window.EpohiData.BUILDINGS.palace;
      city.population = 6;
      state.researched = Array.from(new Set([...state.researched, 'statehood']));
      city.queue = {
        type: 'building',
        id: 'palace',
        progress: Math.max(0, palace.cost.production - 1),
        cost: palace.cost.production,
        upfront: {}
      };
    });

    await page.locator('#endTurnBtn').click();
    await page.waitForFunction(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      return !debug.isTurnProcessing() &&
        state.cities[0].buildings.includes('palace') &&
        state.outcome && state.outcome.status === 'active' &&
        state.outcomeNotices.includes('palace-before-stable-state');
    });

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const progress = window.EpohiHumansOutcomes.statehoodProgress(state);
      return {
        victory: state.victory,
        missing: progress.requirements.filter(item => !item.done).map(item => item.id),
        notices: state.outcomeNotices
      };
    });

    expect(result.victory).toBe(false);
    expect(result.missing).toContain('cities');
    expect(result.missing).toContain('population');
    expect(result.notices).toContain('palace-before-stable-state');
    await expect(page.locator('#victoryModal')).not.toHaveClass(/show/);
    await expect(page.locator('#humansGoalsModal')).toHaveClass(/show/);
  });

  test('падение столицы передаёт управление другому живому городу', async ({ page }) => {
    await openFreshGame(page, { name: 'Наследник столицы' });

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const capital = state.cities[0];
      const successor = {
        id: 'player-city-successor',
        name: 'Наследник',
        x: capital.x + 3,
        y: capital.y,
        population: 3,
        food: 0,
        production: 0,
        buildings: [],
        queue: null,
        hp: 120,
        maxHp: 150,
        capital: false
      };
      state.cities.push(successor);
      capital.hp = 0;
      state.defeat = true;
      const outcome = window.EpohiHumansOutcomes.evaluate(state, { recalculate: true, announce: false });
      return {
        outcome,
        defeat: state.defeat,
        capitalId: state.city.id,
        oldCapital: capital.capital,
        successorCapital: successor.capital,
        eventTypes: state.eventLog.map(event => event.eventType)
      };
    });

    expect(result.outcome.status).toBe('active');
    expect(result.defeat).toBe(false);
    expect(result.capitalId).toBe('player-city-successor');
    expect(result.oldCapital).toBe(false);
    expect(result.successorCapital).toBe(true);
    expect(result.eventTypes).toContain('capital-succeeded');
  });

  test('без городов, но с поселенцем цивилизация остаётся в изгнании', async ({ page }) => {
    await openFreshGame(page, { name: 'Изгнание' });

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      state.cities.forEach(city => { city.hp = 0; city.capital = false; });
      state.units.push({
        id: 'surviving-settler',
        name: 'Последний караван',
        type: 'settler',
        x: state.city.x + 1,
        y: state.city.y,
        moves: 1,
        acted: false,
        hp: 60,
        maxHp: 60
      });
      state.defeat = true;
      const outcome = window.EpohiHumansOutcomes.evaluate(state, { recalculate: true, announce: false });
      return { outcome, victory: state.victory, defeat: state.defeat };
    });

    expect(result.outcome.status).toBe('exile');
    expect(result.victory).toBe(false);
    expect(result.defeat).toBe(false);
  });

  test('потеря всех городов без поселенца завершает партию поражением', async ({ page }) => {
    await openFreshGame(page, { name: 'Полное поражение' });

    await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      state.cities.forEach(city => { city.hp = 0; city.capital = false; });
      state.units = state.units.filter(unit => unit.type !== 'settler');
      window.EpohiHumansOutcomes.evaluate(state, { recalculate: true, announce: true });
    });

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      return { outcome: state.outcome, victory: state.victory, defeat: state.defeat };
    });

    expect(result.outcome.status).toBe('defeat');
    expect(result.outcome.type).toBe('extinction');
    expect(result.victory).toBe(false);
    expect(result.defeat).toBe(true);
    await expect(page.locator('#victoryModal')).toHaveClass(/show/);
    await expect(page.locator('#victoryModalTitle')).toHaveText('Цивилизация погибла');
  });

  test('победа над всеми соперниками фиксируется как военная', async ({ page }) => {
    await openFreshGame(page, { rivals: 1, name: 'Военная победа' });

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const rival = state.rivals[0];
      rival.defeated = true;
      rival.cities.forEach(city => { city.hp = 0; });
      rival.units = [];
      const outcome = window.EpohiHumansOutcomes.evaluate(state, { recalculate: true, announce: true });
      return { outcome, victory: state.victory, defeat: state.defeat };
    });

    expect(result.outcome.status).toBe('victory');
    expect(result.outcome.type).toBe('military');
    expect(result.victory).toBe(true);
    expect(result.defeat).toBe(false);
    await expect(page.locator('#victoryModalTitle')).toHaveText('Соперники подчинены!');
  });

  test('цели партии доступны из игрового меню', async ({ page }) => {
    await openFreshGame(page, { name: 'Панель целей' });
    await page.locator('#menuBtn').click();
    await expect(page.locator('[data-human-goals]')).toBeVisible();
    await page.locator('[data-human-goals]').click();
    await expect(page.locator('#humansGoalsModal')).toHaveClass(/show/);
    await expect(page.locator('#humansGoalsContent')).toContainText('Государственная победа');
    await expect(page.locator('#humansGoalsContent')).toContainText('Военная победа');
    await expect(page.locator('#humansGoalsContent')).toContainText('Поражение');
  });
});
