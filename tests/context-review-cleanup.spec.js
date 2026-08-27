const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

async function syncContextReview(page) {
  await page.evaluate(() => window.EpohiContextReviewCleanup.sync());
}

async function waitTwoFrames(page) {
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

async function openFreshGame(page) {
  const consoleProblems = watchConsole(page);
  await clearStorage(page);
  await createGame(page, 0, 'small');
  await page.waitForFunction(() => Boolean(
    window.EpohiContextReviewCleanup &&
    window.EpohiContextReviewCleanup.version >= 2 &&
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    document.getElementById('strategyReadiness')
  ));
  await syncContextReview(page);
  return consoleProblems;
}

test.describe('Применение ревью контекстного интерфейса', () => {
  test('убраны крупные переключатели, нижние город и наука, а также вкладки осмотра', async ({ page }) => {
    const consoleProblems = await openFreshGame(page);

    const removedControls = await page.evaluate(() => ['.resource-scope', '#cityBtn', '.toolbar > .badge-wrap'].map(selector => {
      const element = document.querySelector(selector);
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { selector, opacity: style.opacity, pointerEvents: style.pointerEvents, width: rect.width, height: rect.height };
    }));
    removedControls.forEach(control => {
      expect(control.opacity).toBe('0');
      expect(control.pointerEvents).toBe('none');
      expect(control.height).toBeLessThanOrEqual(2);
    });

    const capital = await page.evaluate(() => {
      const city = window.__epohiDebug().state.cities[0];
      return { x: city.x, y: city.y, name: city.name };
    });
    const tile = page.locator(`.tile[data-x="${capital.x}"][data-y="${capital.y}"]`);
    await tile.locator('.piece.city').click();

    await expect(page.locator('#contextTitle')).toContainText(capital.name);
    const tabsStyle = await page.locator('#contextTabs').evaluate(element => ({
      opacity: getComputedStyle(element).opacity,
      pointerEvents: getComputedStyle(element).pointerEvents,
      height: element.getBoundingClientRect().height
    }));
    expect(tabsStyle.opacity).toBe('0');
    expect(tabsStyle.pointerEvents).toBe('none');
    expect(tabsStyle.height).toBeLessThanOrEqual(2);
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

      // Force StrategyUX through its identity-followup branch. Before the runtime
      // ordering fix that branch queued a later RAF which could re-disable the
      // activity switcher after ContextReviewCleanup had already made it actionable.
      delete state.playerIdentity;
      debug.render();
      window.EpohiRuntimeInvalidation.flush();
      return {
        military: state.units.filter(unit => unit.hp > 0 && unit.type !== 'worker').map(unit => String(unit.id)),
        cities: state.cities.length
      };
    });

    await waitTwoFrames(page);

    const militaryButton = page.locator('#strategyReadiness [data-ready-kind="units"]');
    await expect(militaryButton.locator('b')).toHaveText(`0/${setup.military.length}`);
    await expect(militaryButton).toHaveAttribute('data-ready-count', '0');
    await expect(militaryButton).toBeEnabled();

    await militaryButton.click();
    expect(String(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId()))).toBe(setup.military[0]);
    if (setup.military.length > 1) {
      await militaryButton.click();
      expect(String(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId()))).toBe(setup.military[1]);
    }

    const cityButton = page.locator('#strategyReadiness [data-ready-kind="cities"]');
    await expect(cityButton.locator('b')).toHaveText(`0/${setup.cities}`);
    await expect(cityButton).toHaveAttribute('data-ready-count', '0');
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
      window.EpohiContextReviewCleanup.sync();
      return { x: original.x, y: original.y, copyId: String(copy.id) };
    });

    const tile = page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"]`);
    await tile.locator('.piece.unit').click();
    await syncContextReview(page);
    const picker = page.locator('[data-context-stack-picker]');
    await expect(picker).toBeVisible();
    await expect(picker.locator('.context-stack-unit')).toHaveCount(2);
    for (const key of ['stack-prev-unit', 'stack-next-unit']) {
      const legacy = page.locator(`[data-context-action="${key}"]`);
      const legacyStyle = await legacy.evaluate(element => ({
        opacity: getComputedStyle(element).opacity,
        pointerEvents: getComputedStyle(element).pointerEvents,
        height: element.getBoundingClientRect().height
      }));
      expect(legacyStyle.opacity).toBe('0');
      expect(legacyStyle.pointerEvents).toBe('none');
      expect(legacyStyle.height).toBeLessThanOrEqual(2);
    }

    await picker.locator(`[data-unit-id="${setup.copyId}"]`).click();
    expect(String(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId()))).toBe(setup.copyId);
    await expect(picker.locator(`[data-unit-id="${setup.copyId}"]`)).toHaveClass(/is-active/);
    await expectNoConsoleProblems(consoleProblems);
  });

  test('на мобильном наука открывается сверху, а приказы не перекрываются и не остаются смещёнными', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    const consoleProblems = await openFreshGame(page);

    const topScience = page.locator('#strategyReadiness [data-ready-kind="science"]');
    await expect(topScience).toBeVisible();
    await expect(topScience).toBeEnabled();
    await topScience.click();
    await expect(page.locator('#scienceModal')).toHaveClass(/show/);
    await page.locator('[data-close="scienceModal"]').click();

    await page.locator('#strategyReadiness [data-ready-kind="units"]').click();
    await syncContextReview(page);
    await page.evaluate(() => {
      const actions = document.getElementById('contextActions');
      const direct = actions.querySelector('.context-btn:not([data-context-action="stack-prev-unit"]):not([data-context-action="stack-next-unit"])');
      if (!direct) {
        const probe = document.createElement('button');
        probe.className = 'context-btn';
        probe.dataset.contextAction = 'layout-probe';
        probe.textContent = 'Макет';
        actions.appendChild(probe);
      }
      window.EpohiContextReviewCleanup.sync();
    });

    const layout = await page.evaluate(() => {
      function rect(selector) {
        const box = document.querySelector(selector).getBoundingClientRect();
        return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
      }
      const firstAction = document.querySelector('#contextActions > .context-btn:not([data-context-action="stack-prev-unit"]):not([data-context-action="stack-next-unit"])');
      const scienceWrap = document.querySelector('.toolbar > .badge-wrap');
      return {
        context: rect('#contextPanel'),
        actions: rect('#contextActions'),
        firstAction: firstAction ? (() => { const box = firstAction.getBoundingClientRect(); return { left: box.left, right: box.right, width: box.width }; })() : null,
        toolbar: rect('.toolbar'),
        endTurn: rect('#endTurnBtn'),
        menu: rect('#menuBtn'),
        science: {
          opacity: getComputedStyle(scienceWrap).opacity,
          pointerEvents: getComputedStyle(scienceWrap).pointerEvents,
          height: scienceWrap.getBoundingClientRect().height
        }
      };
    });

    expect(layout.science.opacity).toBe('0');
    expect(layout.science.pointerEvents).toBe('none');
    expect(layout.science.height).toBeLessThanOrEqual(2);
    expect(layout.actions.left).toBeGreaterThanOrEqual(layout.context.left - 1);
    expect(layout.actions.right).toBeLessThanOrEqual(layout.context.right + 1);
    expect(layout.firstAction).not.toBeNull();
    expect(layout.firstAction.left).toBeGreaterThanOrEqual(layout.actions.left - 1);
    expect(layout.firstAction.width).toBeGreaterThanOrEqual(74);
    expect(layout.toolbar.top).toBeGreaterThanOrEqual(layout.context.bottom - 1);
    expect(layout.endTurn.left).toBeGreaterThanOrEqual(layout.toolbar.left - 1);
    expect(layout.menu.right).toBeLessThanOrEqual(layout.toolbar.right + 1);

    const reset = await page.evaluate(() => {
      const actions = document.getElementById('contextActions');
      const probe = actions.querySelector('[data-context-action="layout-probe"]');
      if (probe) probe.remove();
      for (let index = 0; index < 12; index += 1) {
        const fake = document.createElement('button');
        fake.className = 'context-btn';
        fake.dataset.contextAction = 'layout-test-' + index;
        fake.textContent = 'Тест ' + index;
        fake.style.flex = '0 0 96px';
        actions.appendChild(fake);
      }
      window.EpohiContextReviewCleanup.sync();
      const overflowPx = actions.scrollWidth - actions.clientWidth;
      actions.scrollLeft = actions.scrollWidth;
      const shifted = actions.scrollLeft;
      document.getElementById('contextTitle').textContent += ' ';
      window.EpohiContextReviewCleanup.sync();
      return { overflowPx, shifted, reset: actions.scrollLeft };
    });
    expect(reset.overflowPx).toBeGreaterThan(0);
    expect(reset.shifted).toBeGreaterThan(0);
    expect(reset.reset).toBe(0);
    await expectNoConsoleProblems(consoleProblems);
  });
});
