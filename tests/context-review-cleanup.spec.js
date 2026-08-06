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
    window.EpohiContextReviewCleanup &&
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    document.getElementById('strategyReadiness')
  ));
  return consoleProblems;
}

test.describe('Применение ревью контекстного интерфейса', () => {
  test('убраны крупный переключатель города, кнопка города и вкладки осмотра', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    await expect(page.locator('.resource-scope')).toBeHidden();
    await expect(page.locator('#cityBtn')).toBeHidden();

    const capital = await page.evaluate(() => {
      const city = window.__epohiDebug().state.cities[0];
      return { x: city.x, y: city.y, name: city.name };
    });
    const tile = page.locator(`.tile[data-x="${capital.x}"][data-y="${capital.y}"]`);
    await tile.locator('.piece.city').click();

    await expect(page.locator('#contextTitle')).toContainText(capital.name);
    await expect(page.locator('#contextTabs')).toBeHidden();
    expect(await page.evaluate(() => window.__epohiDebug().getInspectLayer())).toBe('city');
    await expect(page.locator('#cityModal')).not.toHaveClass(/show/);
    await expectNoConsoleProblems(consoleProblems);
  });

  test('экран активности остаётся переключателем объектов после их действий', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    const setup = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      state.units.forEach(unit => { unit.moves = 0; unit.acted = true; delete unit.travelOrder; delete unit.order; });
      state.cities.forEach(city => { city.queue = { type: 'unit', id: 'scout', progress: 0 }; });
      debug.render();
      return {
        military: state.units.filter(unit => unit.hp > 0 && unit.type !== 'worker').map(unit => String(unit.id)),
        cities: state.cities.length
      };
    });

    const militaryButton = page.locator('#strategyReadiness [data-ready-kind="units"]');
    await expect(militaryButton.locator('b')).toHaveText(`0/${setup.military.length}`);
    await expect(militaryButton).toBeEnabled();

    await militaryButton.click();
    expect(String(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId()))).toBe(setup.military[0]);
    if (setup.military.length > 1) {
      await militaryButton.click();
      expect(String(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId()))).toBe(setup.military[1]);
    }

    const cityButton = page.locator('#strategyReadiness [data-ready-kind="cities"]');
    await expect(cityButton.locator('b')).toHaveText(`0/${setup.cities}`);
    await expect(cityButton).toBeEnabled();
    await cityButton.click();
    expect(await page.evaluate(() => window.__epohiDebug().getInspectLayer())).toBe('city');
    await expect(page.locator('#cityModal')).not.toHaveClass(/show/);
    await expectNoConsoleProblems(consoleProblems);
  });

  test('юниты в одной клетке выбираются напрямую списком без стрелок', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    const setup = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const original = state.units.find(unit => unit.hp > 0 && unit.type !== 'worker') || state.units[0];
      const copy = Object.assign({}, original, {
        id: 'review-stack-copy',
        name: 'Второй отряд',
        acted: true,
        moves: 0,
        travelOrder: null,
        order: null
      });
      state.units.push(copy);
      debug.render();
      return { x: original.x, y: original.y, originalId: String(original.id), copyId: String(copy.id) };
    });

    const tile = page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"]`);
    await tile.locator('.piece.unit').click();
    const picker = page.locator('[data-context-stack-picker]');
    await expect(picker).toBeVisible();
    await expect(picker.locator('.context-stack-unit')).toHaveCount(2);
    await expect(page.locator('[data-context-action="stack-prev-unit"]')).toBeHidden();
    await expect(page.locator('[data-context-action="stack-next-unit"]')).toBeHidden();

    await picker.locator(`[data-unit-id="${setup.copyId}"]`).click();
    expect(String(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId()))).toBe(setup.copyId);
    await expect(picker.locator(`[data-unit-id="${setup.copyId}"]`)).toHaveClass(/is-active/);
    await expectNoConsoleProblems(consoleProblems);
  });
});
