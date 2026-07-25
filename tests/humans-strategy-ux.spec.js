const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

async function waitStrategy(page) {
  await page.waitForFunction(() => Boolean(
    window.EpohiStrategyUX &&
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    document.getElementById('strategyReadiness')
  ));
}

test.describe('Стратегический UX', () => {
  test('колесо мыши масштабирует карту к курсору', async ({ page }) => {
    const problems = watchConsole(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await clearStorage(page);
    await createGame(page, 0, 'normal');
    await waitStrategy(page);

    const before = await page.evaluate(() => window.__epohiDebug().getCamera().scale);
    const viewport = page.locator('#mapViewport');
    const box = await viewport.boundingBox();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.35);
    await page.mouse.wheel(0, -420);
    await page.waitForTimeout(80);
    const after = await page.evaluate(() => window.__epohiDebug().getCamera().scale);

    expect(after).toBeGreaterThan(before);
    await expectNoConsoleProblems(problems);
  });

  test('прибытие к руинам сразу открывает выбор без дополнительного клика', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await waitStrategy(page);

    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const scout = state.units.find(unit => unit.type === 'scout');
      const x = Math.min(state.mapSize - 2, scout.x + 1);
      const y = scout.y;
      state.map[y][x].terrain = 'plains';
      state.map[y][x].revealed = true;
      state.map[y][x].feature = 'ruins';
      state.map[y][x].poi = null;
      scout.moves = 2;
      scout.acted = false;
      debug.render();
      const destination = window.EpohiHumansPathing.targetFromTile(state, x, y);
      window.EpohiHumansPathing.assignTravelOrder(scout.id, destination);
    });

    await expect(page.locator('#routePoiModal')).toHaveClass(/show/);
    await expect(page.locator('#routePoiContent')).toContainText('Маршрут завершён');
    await expect(page.locator('#routePoiContent')).toContainText('Древние руины');
    await page.locator('[data-strategy-poi="study"]').click();

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const scout = state.units.find(unit => unit.type === 'scout');
      return {
        order: scout.travelOrder,
        science: state.resources.science
      };
    });
    expect(result.order).toBeNull();
    expect(result.science).toBeGreaterThanOrEqual(10);
    await expectNoConsoleProblems(problems);
  });

  test('государства получают разные имена, цвета и маркеры', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 2, 'normal');
    await waitStrategy(page);
    await page.waitForFunction(() => window.__epohiDebug().state.rivals.every(civ => Boolean(civ.cultureKey)));

    const identity = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      state.openMapMode = true;
      window.EpohiHumansObserver.revealAll(state);
      window.__epohiDebug().render();
      window.EpohiStrategyUX.refresh();
      return state.rivals.map(civ => ({
        name: civ.name,
        color: civ.color,
        city: civ.cities[0].name,
        culture: civ.cultureKey
      }));
    });

    expect(identity).toHaveLength(2);
    expect(new Set(identity.map(item => item.name)).size).toBe(2);
    expect(new Set(identity.map(item => item.color)).size).toBe(2);
    expect(identity[0].name).toBe('Каганат Зарр');
    expect(identity[1].name).toBe('Лига Вельмора');
    await expect(page.locator('#map .piece.ai-unit .strategy-faction-marker').first()).toBeVisible();
    await expectNoConsoleProblems(problems);
  });

  test('три соперника создают политическую кампанию с союзником', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Новая игра' }).click();
    await page.waitForFunction(() => Boolean(document.querySelector('#rivalCount option[value="3"]')));
    await page.locator('#partySize').selectOption('normal');
    await page.locator('#rivalCount').selectOption('3');
    await page.locator('#partyName').fill('Большая политика');
    await page.getByRole('button', { name: 'Создать мир' }).click();
    await expect(page.locator('#gameApp')).toBeVisible();
    await waitStrategy(page);
    await page.waitForFunction(() => window.__epohiDebug().state.rivals.length === 3 && window.__epohiDebug().state.rivals[2].cultureKey);

    const diplomacy = await page.evaluate(() => {
      const rivals = window.__epohiDebug().state.rivals;
      return rivals.map(civ => ({ name: civ.name, relation: civ.relation, score: civ.diplomacy.score }));
    });
    expect(diplomacy[0].score).toBeLessThan(0);
    expect(diplomacy[1].score).toBeLessThan(0);
    expect(diplomacy[2].relation).toBe('ally');
    expect(diplomacy[2].score).toBeGreaterThanOrEqual(40);

    await page.evaluate(() => window.EpohiStrategyUX.openDiplomacy());
    await expect(page.locator('#strategyDiplomacyModal')).toHaveClass(/show/);
    await expect(page.locator('#strategyDiplomacyContent')).toContainText('Союз Эларии');
    await expect(page.locator('#strategyDiplomacyContent')).toContainText('Союз');
    await expectNoConsoleProblems(problems);
  });

  test('панель незавершённых дел открывает город и науку', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await waitStrategy(page);

    const snapshot = await page.evaluate(() => {
      window.EpohiStrategyUX.refresh();
      const bar = document.getElementById('strategyReadiness');
      return {
        units: bar.querySelector('[data-ready-kind="units"] b').textContent,
        workers: bar.querySelector('[data-ready-kind="workers"] b').textContent,
        cities: bar.querySelector('[data-ready-kind="cities"] b').textContent,
        science: bar.querySelector('[data-ready-kind="science"] b').textContent
      };
    });
    expect(Number(snapshot.cities)).toBeGreaterThanOrEqual(1);
    expect(snapshot.science).toBe('!');

    await page.locator('[data-ready-kind="cities"]').click();
    await expect(page.locator('#cityModal')).toHaveClass(/show/);
    await page.locator('[data-close="cityModal"]').click();
    await page.locator('[data-ready-kind="science"]').click();
    await expect(page.locator('#scienceModal')).toHaveClass(/show/);
    await expectNoConsoleProblems(problems);
  });
});
