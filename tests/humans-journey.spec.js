const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

async function openFreshGame(page, options = {}) {
  const consoleProblems = watchConsole(page);
  await clearStorage(page);
  await createGame(page, options.rivals == null ? 0 : options.rivals, options.size || 'small');
  await page.waitForFunction(() => Boolean(
    window.EpohiHumansJourney &&
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    window.__epohiDebug().state.humanJourney
  ));
  return consoleProblems;
}

test.describe('Сага Ардены, сценарии и визуальный слой', () => {
  test('сага запускается без блокирующего окна и показывает текущую главу', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    await expect(page.locator('#humansJourneyBar')).toBeVisible();
    await expect(page.locator('#humansJourneyBar')).toContainText('Первый очаг');
    await expect(page.locator('#humansJourneyModal')).not.toHaveClass(/show/);

    const snapshot = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      return {
        version: state.humanJourney.version,
        chapter: state.humanJourney.chapter,
        scenario: state.humanJourney.scenario,
        queued: state.humanJourney.queuedEvents.length,
        apiVersion: window.EpohiHumansJourney.version
      };
    });

    expect(snapshot).toEqual({
      version: 1,
      chapter: 0,
      scenario: 'peaceful',
      queued: 0,
      apiVersion: 1
    });
    await expectNoConsoleProblems(consoleProblems);
  });

  test('готовые сценарии меняют настройки нового мира и сохраняются в партии', async ({ page }) => {
    const consoleProblems = watchConsole(page);
    await clearStorage(page);
    await page.goto('/');
    await page.locator('#newGameScreenBtn').click();
    await expect(page.locator('#scenarioPreset')).toBeVisible();

    await page.locator('#scenarioPreset').selectOption('frontier');
    await expect(page.locator('#partySize')).toHaveValue('normal');
    await expect(page.locator('#barbarianActivity')).toHaveValue('high');
    await expect(page.locator('#rivalCount')).toHaveValue('1');

    await page.locator('#partyName').fill('Дикий рубеж');
    await page.locator('#createParty').click();
    await page.waitForFunction(() => Boolean(
      window.__epohiDebug &&
      window.__epohiDebug().state &&
      window.__epohiDebug().state.humanJourney
    ));

    const state = await page.evaluate(() => {
      const current = window.__epohiDebug().state;
      return {
        scenario: current.humanJourney.scenario,
        barbarians: current.barbarianActivity,
        rivals: current.rivals.length,
        production: current.cities[0].production
      };
    });

    expect(state.scenario).toBe('frontier');
    expect(state.barbarians).toBe('high');
    expect(state.rivals).toBe(1);
    expect(state.production).toBeGreaterThanOrEqual(22);
    await expectNoConsoleProblems(consoleProblems);
  });

  test('глава завершается один раз и награда не дублируется', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    const first = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const city = state.cities[0];
      const tile = state.map[city.y][city.x + 1];
      tile.terrain = 'plains';
      tile.revealed = true;
      tile.owner = city.id;
      tile.improvement = 'farm';
      tile.pillaged = false;
      state.researched = ['agriculture'];
      state.turn = 4;

      const before = {
        food: city.food,
        production: city.production,
        science: state.resources.science
      };
      window.EpohiHumansJourney.sync({ render: false });
      return {
        before,
        after: {
          food: city.food,
          production: city.production,
          science: state.resources.science
        },
        chapter: state.humanJourney.chapter,
        rewards: state.humanJourney.rewardKeys.slice()
      };
    });

    expect(first.chapter).toBe(1);
    expect(first.rewards).toContain('first-hearth');
    expect(first.after.food - first.before.food).toBe(10);
    expect(first.after.production - first.before.production).toBe(8);
    expect(first.after.science - first.before.science).toBe(4);

    const second = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const city = state.cities[0];
      const before = [city.food, city.production, state.resources.science];
      window.EpohiHumansJourney.sync({ render: false });
      return {
        before,
        after: [city.food, city.production, state.resources.science],
        rewards: state.humanJourney.rewardKeys.slice()
      };
    });

    expect(second.after).toEqual(second.before);
    expect(second.rewards.filter(id => id === 'first-hearth')).toHaveLength(1);
    await expectNoConsoleProblems(consoleProblems);
  });

  test('решение эпохи ожидает игрока и применяет выбранное последствие', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    const scienceBefore = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      state.turn = 5;
      window.EpohiHumansJourney.sync({ render: true });
      return state.resources.science;
    });

    await expect(page.locator('[data-journey-alert]')).toHaveClass(/has-event/);
    await page.locator('[data-open-human-journey]').first().click();
    await expect(page.locator('#humansJourneyModal')).toHaveClass(/show/);
    await expect(page.locator('#humansJourneyContent')).toContainText('Странствующий мастер');
    await page.locator('[data-story-choice="teach"]').click();

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      return {
        science: state.resources.science,
        queued: state.humanJourney.queuedEvents.slice(),
        resolved: state.humanJourney.resolvedEvents.slice()
      };
    });

    expect(result.science).toBe(scienceBefore + 10);
    expect(result.queued).not.toContain('wandering-smith');
    expect(result.resolved).toContain('wandering-smith');
    await expectNoConsoleProblems(consoleProblems);
  });

  test('специализация города начисляет бонус только один раз за новый ход', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const city = state.cities[0];
      city.population = 3;
      const selected = window.EpohiHumansJourney.chooseSpecialization(city.id, 'science');
      const before = state.resources.science;
      state.turn += 1;
      window.EpohiHumansJourney.sync({ render: false });
      const afterFirst = state.resources.science;
      window.EpohiHumansJourney.sync({ render: false });
      const afterSecond = state.resources.science;
      return {
        selected,
        specialization: city.specialization,
        before,
        afterFirst,
        afterSecond
      };
    });

    expect(result.selected).toBe(true);
    expect(result.specialization).toBe('science');
    expect(result.afterFirst - result.before).toBe(2);
    expect(result.afterSecond).toBe(result.afterFirst);
    await expectNoConsoleProblems(consoleProblems);
  });

  test('новый визуальный слой украшает карту и остаётся пригодным на iPhone-размере', async ({ page }) => {
    const consoleProblems = watchConsole(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await page.waitForFunction(() => {
      const tile = document.querySelector('#map .tile');
      return Boolean(tile && tile.dataset.variant !== undefined && document.querySelector('#humansJourneyBar'));
    });

    const metrics = await page.evaluate(() => {
      const tile = document.querySelector('#map .tile:not(.fog)') || document.querySelector('#map .tile');
      const map = document.querySelector('.map-shell').getBoundingClientRect();
      const bar = document.querySelector('#humansJourneyBar').getBoundingClientRect();
      const toolbar = document.querySelector('.toolbar').getBoundingClientRect();
      const style = getComputedStyle(tile);
      return {
        variant: tile.dataset.variant,
        backgroundImage: style.backgroundImage,
        mapHeight: map.height,
        barHeight: bar.height,
        toolbarBottom: toolbar.bottom,
        viewportHeight: window.innerHeight
      };
    });

    expect(['0', '1', '2', '3']).toContain(metrics.variant);
    expect(metrics.backgroundImage).not.toBe('none');
    expect(metrics.mapHeight).toBeGreaterThan(50);
    expect(metrics.barHeight).toBeGreaterThanOrEqual(35);
    expect(metrics.toolbarBottom).toBeLessThanOrEqual(metrics.viewportHeight);
    await expectNoConsoleProblems(consoleProblems);
  });
});