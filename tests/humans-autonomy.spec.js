const { test, expect } = require('@playwright/test');

async function openFreshGame(page, name = 'Тест автономности') {
  await page.goto('/');
  await expect(page.locator('#newGameScreenBtn')).toBeVisible();
  await page.locator('#newGameScreenBtn').click();
  await page.locator('#partySize').selectOption('small');
  await page.locator('#barbarianActivity').selectOption('off');
  await page.locator('#rivalCount').selectOption('0');
  await page.locator('#partyName').fill(name);
  await page.locator('#createParty').click();
  await page.waitForFunction(() => Boolean(
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    window.EpohiHumansAutonomy
  ));
}

test.describe('Автономные приказы людей', () => {
  test('модуль загружается и создаёт журнал отчётов', async ({ page }) => {
    await openFreshGame(page);

    const moduleInfo = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      window.EpohiHumansAutonomy.ensureAutonomyState(state);
      return {
        version: window.EpohiHumansAutonomy.version,
        hasAssign: typeof window.EpohiHumansAutonomy.assignOrder === 'function',
        hasProcess: typeof window.EpohiHumansAutonomy.processOrders === 'function',
        reports: state.autonomyReports
      };
    });

    expect(moduleInfo.version).toBe(1);
    expect(moduleInfo.hasAssign).toBe(true);
    expect(moduleInfo.hasProcess).toBe(true);
    expect(moduleInfo.reports).toEqual([]);

    // Fresh-game rendering emits the explicit humans-ui-settled lifecycle signal.
    // The report control must become actionable from that signal alone; requiring an
    // extra context mutation would reintroduce the observer-coupling this hardening
    // phase is removing.
    await expect(page.locator('#autonomyReportBtn')).toHaveCount(1, { timeout: 1000 });
  });

  test('разведчик самостоятельно идёт к границе известного мира и открывает клетки', async ({ page }) => {
    await openFreshGame(page, 'Авторазведка');

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const autonomy = window.EpohiHumansAutonomy;
      const scout = state.units.find(unit => unit.type === 'scout');

      state.map.forEach(row => row.forEach(tile => {
        tile.terrain = 'plains';
        tile.revealed = false;
        tile.poi = null;
        tile.camp = null;
      }));

      for (let y = scout.y - 1; y <= scout.y + 1; y += 1) {
        for (let x = scout.x - 1; x <= scout.x + 1; x += 1) {
          if (state.map[y] && state.map[y][x]) state.map[y][x].revealed = true;
        }
      }

      scout.moves = window.EpohiData.UNIT_DEFS.scout.maxMoves;
      scout.acted = false;
      const before = { x: scout.x, y: scout.y, revealed: state.map.reduce((sum, row) => sum + row.filter(tile => tile.revealed).length, 0) };

      const assigned = autonomy.assignOrder(scout.id, 'explore');
      const actions = autonomy.processOrders(state);
      const after = { x: scout.x, y: scout.y, revealed: state.map.reduce((sum, row) => sum + row.filter(tile => tile.revealed).length, 0) };

      return {
        assigned,
        actions,
        before,
        after,
        order: scout.order,
        latestReport: state.autonomyReports[0]
      };
    });

    expect(result.assigned).toBe(true);
    expect(result.after.x === result.before.x && result.after.y === result.before.y).toBe(false);
    expect(result.after.revealed).toBeGreaterThan(result.before.revealed);
    expect(result.order.type).toBe('explore');
    expect(result.order.status).toBe('active');
    expect(result.latestReport.kind).toBe('exploration');
  });

  test('охранный приказ уничтожает известную угрозу рядом с воином', async ({ page }) => {
    await openFreshGame(page, 'Автоохрана');

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const autonomy = window.EpohiHumansAutonomy;
      const warrior = state.units.find(unit => unit.type === 'warrior');
      const points = window.EpohiUtils.neighborsOf(warrior.x, warrior.y, state.mapSize);
      const targetPoint = points.find(point => state.map[point.y] && state.map[point.y][point.x]);

      state.map[targetPoint.y][targetPoint.x].terrain = 'plains';
      state.map[targetPoint.y][targetPoint.x].revealed = true;
      state.barbarians = [{
        id: 'autonomy-test-barbarian',
        x: targetPoint.x,
        y: targetPoint.y,
        hp: 1,
        maxHp: 75,
        homeX: targetPoint.x,
        homeY: targetPoint.y,
        originCampId: null,
        last: null
      }];
      warrior.moves = 1;
      warrior.acted = false;

      const assigned = autonomy.assignOrder(warrior.id, 'guard', {
        x: warrior.x,
        y: warrior.y,
        radius: 3
      });
      autonomy.processOrders(state);

      return {
        assigned,
        remainingBarbarians: state.barbarians.length,
        acted: warrior.acted,
        order: warrior.order,
        reports: state.autonomyReports.map(item => item.kind)
      };
    });

    expect(result.assigned).toBe(true);
    expect(result.remainingBarbarians).toBe(0);
    expect(result.acted).toBe(true);
    expect(result.order.type).toBe('guard');
    expect(result.reports).toContain('guard-combat');
  });

  test('рабочий по приказу развивает город и тратит локальное производство', async ({ page }) => {
    await openFreshGame(page, 'Авторабочий');

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const autonomy = window.EpohiHumansAutonomy;
      const city = state.cities[0];
      const point = window.EpohiUtils.neighborsOf(city.x, city.y, state.mapSize)
        .find(item => state.map[item.y] && state.map[item.y][item.x]);

      state.map.forEach(row => row.forEach(tile => {
        tile.revealed = false;
        tile.improvement = tile === state.map[point.y][point.x] ? null : 'lumber';
        tile.poi = null;
        tile.camp = null;
      }));

      const tile = state.map[point.y][point.x];
      tile.terrain = 'plains';
      tile.revealed = true;
      tile.owner = city.id;
      tile.improvement = null;
      city.production = 100;
      state.researched = Array.from(new Set([...state.researched, 'agriculture']));

      const worker = {
        id: 'autonomy-test-worker',
        name: 'Тален',
        type: 'worker',
        x: point.x,
        y: point.y,
        moves: 1,
        acted: false,
        hp: 70,
        maxHp: 70,
        order: null
      };
      state.units.push(worker);
      const productionBefore = city.production;

      const assigned = autonomy.assignOrder(worker.id, 'develop', {
        cityId: city.id,
        priority: 'food'
      });
      autonomy.processOrders(state);

      return {
        assigned,
        improvement: tile.improvement,
        productionBefore,
        productionAfter: city.production,
        acted: worker.acted,
        reports: state.autonomyReports.map(item => item.kind)
      };
    });

    expect(result.assigned).toBe(true);
    expect(result.improvement).toBe('farm');
    expect(result.productionAfter).toBeLessThan(result.productionBefore);
    expect(result.acted).toBe(true);
    expect(result.reports).toContain('worker-build');
  });

  test('приказ можно отменить и он не выполняется после отмены', async ({ page }) => {
    await openFreshGame(page, 'Отмена приказа');

    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const autonomy = window.EpohiHumansAutonomy;
      const scout = state.units.find(unit => unit.type === 'scout');
      const before = { x: scout.x, y: scout.y };
      const assigned = autonomy.assignOrder(scout.id, 'explore');
      const cancelled = autonomy.cancelOrder(scout.id);
      autonomy.processOrders(state);
      return {
        assigned,
        cancelled,
        order: scout.order,
        before,
        after: { x: scout.x, y: scout.y },
        latestKind: state.autonomyReports[0].kind
      };
    });

    expect(result.assigned).toBe(true);
    expect(result.cancelled).toBe(true);
    expect(result.order).toBeNull();
    expect(result.after).toEqual(result.before);
    expect(result.latestKind).toBe('order-cancelled');
  });
});
