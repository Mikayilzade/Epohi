const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

async function openGame(page, options = {}) {
  const problems = watchConsole(page);
  await clearStorage(page);
  await createGame(page, options.rivals == null ? 0 : options.rivals, options.size || 'small');
  await page.waitForFunction(() => Boolean(
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    window.EpohiHumansPathing &&
    window.EpohiPerformance
  ));
  return problems;
}

async function prepareOpenPlains(page) {
  return page.evaluate(() => {
    const debug = window.__epohiDebug();
    const state = debug.state;
    state.openMapMode = true;
    state.barbarians = [];
    state.rivals = [];
    state.map.forEach(row => row.forEach(tile => {
      tile.revealed = true;
      tile.terrain = 'plains';
      tile.camp = null;
      tile.poi = null;
    }));
    const id = debug.getSelectedUnitId();
    const unit = state.units.find(item => item.id === id) || state.units[0];
    state.units = [unit];
    unit.moves = window.EpohiData.UNIT_DEFS[unit.type].maxMoves;
    unit.acted = false;
    unit.travelOrder = null;
    unit.order = null;
    debug.render();
    // This fixture mutates runtime state directly, outside normal click/action hooks.
    // Runtime hardening intentionally no longer relies on broad observer polling to
    // discover such synthetic writes, so explicitly refresh the owning pathing UI.
    if (window.EpohiHumansPathingUI && typeof window.EpohiHumansPathingUI.refresh === 'function') {
      window.EpohiHumansPathingUI.refresh();
    }
    return { id: unit.id, x: unit.x, y: unit.y, type: unit.type };
  });
}

test.describe('Маршруты, desktop-карта и производительность', () => {
  test('desktop-карта крупная, а постоянные водные анимации отключены', async ({ page }) => {
    const problems = watchConsole(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await clearStorage(page);
    await createGame(page, 1, 'normal');
    await page.waitForFunction(() => Boolean(window.EpohiPerformance && window.EpohiHumansPathing));

    const result = await page.evaluate(async () => {
      await new Promise(resolve => setTimeout(resolve, 700));
      const snapshot = window.EpohiPerformance.snapshot();
      await new Promise(resolve => setTimeout(resolve, 350));
      const shell = document.querySelector('.map-shell').getBoundingClientRect();
      const water = document.querySelector('.tile.water');
      const resource = document.querySelector('.resource');
      return {
        width: shell.width,
        height: shell.height,
        mode: window.EpohiPerformance.mode,
        snapshotMode: snapshot.mode,
        observerMode: window.EpohiObserverSafety && window.EpohiObserverSafety.mode,
        waterAnimation: water ? getComputedStyle(water, '::after').animationName : 'none',
        backdrop: getComputedStyle(resource).backdropFilter
      };
    });

    expect(result.width).toBeGreaterThanOrEqual(700);
    expect(result.height).toBeGreaterThan(250);
    expect(result.mode).toBe('observer-local-safety');
    expect(result.snapshotMode).toBe(result.mode);
    expect(result.observerMode).toBe('observer-local');
    expect(result.waterAnimation).toBe('none');
    expect(['none', '']).toContain(result.backdrop);
    await expectNoConsoleProblems(problems);
  });

  test('кнопка Идти назначает маршрут, показывает шаги и переносит приказ между ходами', async ({ page }) => {
    const problems = await openGame(page);
    const unit = await prepareOpenPlains(page);
    await page.locator(`.tile[data-x="${unit.x}"][data-y="${unit.y}"]`).click();

    const routeStart = page.locator('[data-path-action="start"]');
    const actionabilityStartedAt = Date.now();
    await expect(routeStart).toBeVisible({ timeout: 1000 });
    expect(Date.now() - actionabilityStartedAt).toBeLessThanOrEqual(1000);
    await routeStart.click();
    const target = await page.evaluate(({ x, y }) => {
      const state = window.__epohiDebug().state;
      const candidates = [];
      state.map.forEach((row, yy) => row.forEach((tile, xx) => {
        const distance = Math.max(Math.abs(xx - x), Math.abs(yy - y));
        if (distance >= 5 && distance <= 7 && tile.terrain !== 'water') candidates.push({ x: xx, y: yy, distance });
      }));
      candidates.sort((a, b) => a.distance - b.distance);
      return candidates[0];
    }, unit);
    await page.locator(`.tile[data-x="${target.x}"][data-y="${target.y}"]`).click();

    await expect(page.locator('.route-badge').first()).toBeVisible();
    await expect(page.locator('[data-route-summary]')).toContainText(/Маршрут:/);
    const assigned = await page.evaluate(({ id }) => {
      const state = window.__epohiDebug().state;
      const unit = state.units.find(item => item.id === id);
      return {
        order: unit.travelOrder,
        moves: unit.moves,
        routeBadges: document.querySelectorAll('.route-badge').length
      };
    }, unit);
    expect(assigned.order.type).toBe('move');
    expect(assigned.order.path.length).toBeGreaterThan(0);
    expect(assigned.routeBadges).toBeGreaterThan(0);

    await page.locator('#endTurnBtn').click();
    await page.waitForFunction(({ id }) => {
      const state = window.__epohiDebug().state;
      const unit = state.units.find(item => item.id === id);
      return state.turn >= 2 && unit && unit.travelOrder;
    }, unit);
    const afterTurn = await page.evaluate(({ id, x, y }) => {
      const state = window.__epohiDebug().state;
      const moved = state.units.find(item => item.id === id);
      return {
        turn: state.turn,
        hasOrder: Boolean(moved.travelOrder),
        distance: Math.max(Math.abs(moved.x - x), Math.abs(moved.y - y))
      };
    }, unit);
    expect(afterTurn.turn).toBeGreaterThanOrEqual(2);
    expect(afterTurn.hasOrder).toBe(true);
    expect(afterTurn.distance).toBeGreaterThan(0);
    await expectNoConsoleProblems(problems);
  });

  test('движущаяся цель пересчитывается без ошибки, исчезнувшая завершает приказ', async ({ page }) => {
    const problems = await openGame(page);
    const unit = await prepareOpenPlains(page);

    const result = await page.evaluate(({ id }) => {
      const state = window.__epohiDebug().state;
      const actor = state.units.find(item => item.id === id);
      const start = { x: actor.x, y: actor.y };
      const target = {
        id: 'moving-route-target',
        x: Math.min(state.mapSize - 2, actor.x + 6),
        y: actor.y,
        hp: 75,
        maxHp: 75,
        homeX: actor.x + 6,
        homeY: actor.y,
        originCampId: null
      };
      state.barbarians.push(target);
      actor.moves = 0;
      actor.acted = true;
      window.EpohiHumansPathing.assignTravelOrder(actor.id, {
        type: 'attack', targetKind: 'barbarian', targetId: target.id, x: target.x, y: target.y
      });
      target.x = Math.max(1, target.x - 1);
      target.y = Math.min(state.mapSize - 2, target.y + 2);
      actor.moves = 2;
      actor.acted = false;
      const processed = window.EpohiHumansPathing.processUnit(state, actor, { render: false });
      const retargeted = actor.travelOrder && { x: actor.travelOrder.x, y: actor.travelOrder.y };
      state.barbarians = state.barbarians.filter(item => item.id !== target.id);
      actor.moves = 2;
      actor.acted = false;
      window.EpohiHumansPathing.processUnit(state, actor, { render: false });
      return {
        processed,
        moved: actor.x !== start.x || actor.y !== start.y,
        retargeted,
        expected: { x: target.x, y: target.y },
        finalOrder: actor.travelOrder
      };
    }, unit);

    expect(result.processed).toBe(true);
    expect(result.moved).toBe(true);
    expect(result.retargeted).toEqual(result.expected);
    expect(result.finalOrder).toBeNull();
    await expectNoConsoleProblems(problems);
  });

  test('маршрут к находке открывает выбор и применяет результат', async ({ page }) => {
    const problems = await openGame(page);
    const unit = await prepareOpenPlains(page);

    const before = await page.evaluate(({ id }) => {
      const state = window.__epohiDebug().state;
      const actor = state.units.find(item => item.id === id);
      const point = window.EpohiUtils.neighborsOf(actor.x, actor.y, state.mapSize).find(candidate =>
        !state.units.some(item => item.id !== actor.id && item.x === candidate.x && item.y === candidate.y)
      );
      const tile = state.map[point.y][point.x];
      tile.terrain = 'plains';
      tile.revealed = true;
      tile.poi = { type: 'ruins', used: false };
      actor.moves = 2;
      actor.acted = false;
      const science = state.resources.science;
      window.EpohiHumansPathing.assignTravelOrder(actor.id, {
        type: 'poi', targetKind: 'poi', targetId: 'ruins', x: point.x, y: point.y
      });
      return { science, x: point.x, y: point.y };
    }, unit);

    await expect(page.locator('#routePoiModal')).toHaveClass(/show/);
    await page.locator('[data-route-poi-choice="study"]').click();
    const after = await page.evaluate(({ id, x, y }) => {
      const state = window.__epohiDebug().state;
      const actor = state.units.find(item => item.id === id);
      return {
        science: state.resources.science,
        used: state.map[y][x].poi.used,
        order: actor.travelOrder
      };
    }, { id: unit.id, x: before.x, y: before.y });
    expect(after.science).toBe(before.science + 10);
    expect(after.used).toBe(true);
    expect(after.order).toBeNull();
    await expectNoConsoleProblems(problems);
  });

  test('атака лагеря центрирует камеру и завершает приказ', async ({ page }) => {
    const problems = await openGame(page);
    const unit = await prepareOpenPlains(page);

    const result = await page.evaluate(({ id }) => {
      const originalDebug = window.__epohiDebug;
      const state = originalDebug().state;
      const actor = state.units.find(item => item.id === id);
      const point = window.EpohiUtils.neighborsOf(actor.x, actor.y, state.mapSize).find(candidate =>
        !state.units.some(item => item.id !== actor.id && item.x === candidate.x && item.y === candidate.y)
      );
      state.map[point.y][point.x].terrain = 'plains';
      state.map[point.y][point.x].revealed = true;
      state.map[point.y][point.x].camp = {
        campId: 'route-camp', hp: 1, maxHp: 140, nextSpawn: 10, discovered: true
      };
      let centered = null;
      window.__epohiDebug = function () {
        const value = originalDebug();
        const originalCenter = value.centerCameraOnTile;
        value.centerCameraOnTile = function (x, y, smooth) {
          centered = { x, y, smooth };
          return originalCenter(x, y, smooth);
        };
        return value;
      };
      actor.moves = 1;
      actor.acted = false;
      window.EpohiHumansPathing.assignTravelOrder(actor.id, {
        type: 'attack', targetKind: 'camp', targetId: 'route-camp', x: point.x, y: point.y
      });
      window.__epohiDebug = originalDebug;
      return {
        centered,
        camp: state.map[point.y][point.x].camp,
        order: actor.travelOrder,
        target: point
      };
    }, unit);

    expect(result.centered).toMatchObject(result.target);
    expect(result.camp).toBeNull();
    expect(result.order).toBeNull();
    await expectNoConsoleProblems(problems);
  });

  test('рабочий выбирает приоритет четырьмя кнопками без текстового prompt', async ({ page }) => {
    const problems = await openGame(page);
    const workerPoint = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const city = state.cities[0];
      const point = window.EpohiUtils.neighborsOf(city.x, city.y, state.mapSize).find(candidate =>
        !state.units.some(item => item.x === candidate.x && item.y === candidate.y)
      );
      state.map[point.y][point.x].terrain = 'plains';
      state.map[point.y][point.x].revealed = true;
      state.map[point.y][point.x].owner = city.id;
      const worker = {
        id: 'route-worker', name: 'Тестовый рабочий', type: 'worker',
        x: point.x, y: point.y, moves: 1, acted: false, hp: 70, maxHp: 70,
        order: null, travelOrder: null
      };
      state.units.push(worker);
      debug.render();
      return { x: point.x, y: point.y, id: worker.id };
    });

    await page.locator(`.tile[data-x="${workerPoint.x}"][data-y="${workerPoint.y}"]`).click();
    await expect(page.locator('.worker-priority-picker [data-path-action^="worker-"]')).toHaveCount(4);
    await expect(page.locator('[data-autonomy-action="develop"]')).toBeHidden();
    await page.locator('[data-path-action="worker-food"]').click();
    const order = await page.evaluate(({ id }) => {
      const worker = window.__epohiDebug().state.units.find(item => item.id === id);
      return worker.order;
    }, workerPoint);
    expect(order.type).toBe('develop');
    expect(order.priority).toBe('food');
    await expectNoConsoleProblems(problems);
  });

  test('мобильная компоновка остаётся в пределах iPhone-экрана', async ({ page }) => {
    const problems = watchConsole(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await clearStorage(page);
    await createGame(page, 1, 'normal');
    await page.waitForFunction(() => Boolean(window.EpohiHumansPathing));
    const result = await page.evaluate(() => {
      const shell = document.querySelector('.map-shell').getBoundingClientRect();
      const toolbar = document.querySelector('.toolbar').getBoundingClientRect();
      return {
        shellWidth: shell.width,
        viewportWidth: innerWidth,
        toolbarBottom: toolbar.bottom,
        viewportHeight: innerHeight
      };
    });
    expect(result.shellWidth).toBeLessThanOrEqual(result.viewportWidth);
    expect(result.toolbarBottom).toBeLessThanOrEqual(result.viewportHeight);
    await expectNoConsoleProblems(problems);
  });
});
