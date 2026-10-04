const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('Worker card keeps a scrollable description and reachable actions at critical viewport sizes', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'normal');
  const position = await page.evaluate(() => {
    const debug = window.__epohiDebug();
    const state = debug.state;
    const city = state.city;
    const point = window.EpohiUtils.neighborsOf(city.x, city.y, state.map.length)
      .find(candidate => !state.units.some(unit => unit.x === candidate.x && unit.y === candidate.y));
    Object.assign(state.map[point.y][point.x], {
      terrain: 'plains', revealed: true, owner: city.id,
      improvement: null, pillaged: false, camp: null, poi: null
    });
    state.units.push({ id: 'v3-worker-layout', name: 'Проверка карточки', type: 'worker',
      x: point.x, y: point.y, moves: 1, acted: false, hp: 70, maxHp: 70 });
    debug.render();
    return point;
  });

  const sizes = test.info().project.name === 'chromium-mobile'
    ? [{ width: 390, height: 844 }, { width: 390, height: 600 }]
    : [{ width: 1280, height: 720 }, { width: 1280, height: 500 }];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.locator(`.tile[data-x="${position.x}"][data-y="${position.y}"]`).evaluate(tile => tile.click());
    await expect(page.locator('#contextPanel')).toHaveClass(/worker-context-panel/);
    await page.evaluate(() => {
      const card = document.querySelector('#contextText .worker-card');
      card.querySelectorAll('[data-v3-layout-filler]').forEach(node => node.remove());
      for (let index = 0; index < 16; index += 1) {
        const row = document.createElement('div');
        row.dataset.v3LayoutFiller = '1';
        row.textContent = 'Длинное описание проекта рабочего ' + index;
        card.appendChild(row);
      }
    });
    const measures = await page.evaluate(() => {
      const panel = document.getElementById('contextPanel');
      const copy = panel.querySelector('.context-copy');
      const text = document.getElementById('contextText');
      const actions = document.getElementById('contextActions');
      const title = document.getElementById('contextTitle');
      const rect = element => { const r = element.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height }; };
      return { panel: rect(panel), copy: rect(copy), text: rect(text), actions: rect(actions),
        title: rect(title), scrollable: text.scrollHeight > text.clientHeight,
        actionCount: actions.querySelectorAll('button').length, viewportHeight: innerHeight };
    });
    expect(measures.actionCount).toBeGreaterThan(0);
    expect(measures.panel.bottom).toBeLessThanOrEqual(measures.viewportHeight + 2);
    expect(measures.actions.bottom).toBeLessThanOrEqual(measures.panel.bottom + 1);
    expect(measures.title.height).toBeGreaterThan(12);
    expect(measures.scrollable).toBe(true);
    await page.locator('#contextText').hover();
    await page.mouse.wheel(0, 220);
    await expect.poll(() => page.locator('#contextText').evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    const action = page.locator('#contextActions button').last();
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeVisible();
    const footerAfterScroll = await page.locator('#contextActions').boundingBox();
    expect(footerAfterScroll.y + footerAfterScroll.height).toBeLessThanOrEqual(measures.panel.bottom + 1);
  }
});
