const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

async function createConfiguredGame(page, options = {}) {
  await clearStorage(page);
  await page.goto('/');
  await expect(page.locator('#newGameScreenBtn')).toBeVisible();
  await page.locator('#newGameScreenBtn').click();
  await expect(page.locator('#openMapMode')).toBeVisible();
  if (options.size) await page.locator('#partySize').selectOption(options.size);
  if (options.rivals != null) await page.locator('#rivalCount').selectOption(String(options.rivals));
  if (options.barbarians) await page.locator('#barbarianActivity').selectOption(options.barbarians);
  if (options.openMap) await page.locator('#openMapMode').check();
  await page.locator('#partyName').fill(options.name || 'Визуальный тест');
  await page.locator('#createParty').click();
  await expect(page.locator('#gameApp')).toBeVisible();
  await page.waitForFunction(() => Boolean(
    window.__epohiDebug &&
    window.__epohiDebug().state &&
    window.EpohiHumansVisuals &&
    document.body.classList.contains('painted-world-ready')
  ));
}

test.describe('Визуальная демка и режим наблюдения', () => {
  test('авторазведчик использует оба очка движения за один ход', async ({ page }) => {
    const problems = watchConsole(page);
    await createConfiguredGame(page, { size: 'small', rivals: 0, barbarians: 'off' });

    const result = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const scout = state.units.find(unit => unit.type === 'scout');
      state.barbarians = [];
      state.rivals = [];
      state.map.forEach(row => row.forEach(tile => {
        tile.camp = null;
        tile.poi = null;
      }));

      for (let y = Math.max(0, scout.y - 4); y <= Math.min(state.map.length - 1, scout.y + 4); y += 1) {
        for (let x = Math.max(0, scout.x - 4); x <= Math.min(state.map[y].length - 1, scout.x + 4); x += 1) {
          state.map[y][x].terrain = 'plains';
          state.map[y][x].revealed = Math.max(Math.abs(x - scout.x), Math.abs(y - scout.y)) <= 2;
        }
      }

      scout.moves = 2;
      scout.acted = false;
      const start = { x: scout.x, y: scout.y };
      window.EpohiHumansAutonomy.assignOrder(scout.id, 'explore');
      window.EpohiHumansAutonomy.processOrders(state);
      return {
        start,
        end: { x: scout.x, y: scout.y },
        moves: scout.moves,
        acted: scout.acted,
        steps: scout.order && scout.order.steps,
        version: window.EpohiHumansAutonomy.version
      };
    });

    expect(result.version).toBe(2);
    expect(result.moves).toBe(0);
    expect(result.acted).toBe(true);
    expect(result.steps).toBeGreaterThanOrEqual(2);
    expect(result.end).not.toEqual(result.start);
    await expectNoConsoleProblems(problems);
  });

  test('открытая карта показывает весь мир и соперников с первого хода', async ({ page }) => {
    const problems = watchConsole(page);
    await createConfiguredGame(page, {
      size: 'normal',
      rivals: 1,
      barbarians: 'normal',
      openMap: true,
      name: 'Наблюдение'
    });
    await page.waitForFunction(() => {
      const state = window.__epohiDebug().state;
      return state.openMapMode && state.map.flat().every(tile => tile.revealed) &&
        state.rivals.every(civ => civ.met) && document.querySelectorAll('.piece.ai-city').length > 0;
    });

    const snapshot = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      return {
        openMapMode: state.openMapMode,
        hiddenTiles: state.map.flat().filter(tile => !tile.revealed).length,
        rivals: state.rivals.length,
        unmetRivals: state.rivals.filter(civ => !civ.met).length,
        bodyClass: document.body.classList.contains('open-map-mode'),
        visibleAiCities: document.querySelectorAll('.piece.ai-city').length
      };
    });

    expect(snapshot.openMapMode).toBe(true);
    expect(snapshot.hiddenTiles).toBe(0);
    expect(snapshot.rivals).toBe(1);
    expect(snapshot.unmetRivals).toBe(0);
    expect(snapshot.bodyClass).toBe(true);
    expect(snapshot.visibleAiCities).toBeGreaterThan(0);
    await expectNoConsoleProblems(problems);
  });

  test('карта использует рисованные фигурки и различимые находки вместо эмодзи', async ({ page }) => {
    const problems = watchConsole(page);
    await createConfiguredGame(page, { size: 'small', rivals: 0, barbarians: 'off', openMap: true });

    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const city = state.cities[0];
      const point = { x: Math.min(state.mapSize - 1, city.x + 2), y: city.y };
      state.map[point.y][point.x].revealed = true;
      state.map[point.y][point.x].terrain = 'hill';
      state.map[point.y][point.x].poi = { type: 'cave', used: false };
      debug.render();
    });
    await page.waitForFunction(() => Boolean(document.querySelector('.piece.poi[data-art-kind="cave"]')));

    const art = await page.evaluate(() => {
      const unit = document.querySelector('.piece.unit.has-art-sprite');
      const poi = document.querySelector('.piece.poi[data-art-kind="cave"]');
      const paintedTile = document.querySelector('.tile.painted-tile:not(.fog)');
      const terrainIcon = paintedTile && paintedTile.querySelector('.terrain-icon');
      return {
        unitSprite: unit && getComputedStyle(unit).getPropertyValue('--art-sprite'),
        poiSprite: poi && getComputedStyle(poi).getPropertyValue('--art-sprite'),
        poiLabel: poi && poi.dataset.artLabel,
        terrainSprite: paintedTile && getComputedStyle(paintedTile).getPropertyValue('--terrain-sprite'),
        terrainIconDisplay: terrainIcon && getComputedStyle(terrainIcon).display,
        units: window.EpohiHumansVisuals.unitSprites.length,
        terrains: window.EpohiHumansVisuals.terrainSprites.length,
        pois: window.EpohiHumansVisuals.poiSprites.length,
        improvements: window.EpohiHumansVisuals.improvementSprites.length
      };
    });

    expect(art.unitSprite).toContain('data:image/svg+xml');
    expect(art.poiSprite).toContain('data:image/svg+xml');
    expect(art.poiLabel).toBe('Пещера');
    expect(art.terrainSprite).toContain('data:image/svg+xml');
    expect(art.terrainIconDisplay).toBe('none');
    expect(art.units).toBe(6);
    expect(art.terrains).toBe(7);
    expect(art.pois).toBe(8);
    expect(art.improvements).toBe(5);
    await expectNoConsoleProblems(problems);
  });

  test('визуальная панель и карта помещаются на экран iPhone', async ({ page }) => {
    const problems = watchConsole(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await clearStorage(page);
    await createGame(page, 1, 'normal');
    await page.waitForFunction(() => document.body.classList.contains('painted-world-ready'));

    const layout = await page.evaluate(() => {
      const map = document.querySelector('.map-shell').getBoundingClientRect();
      const context = document.querySelector('.context').getBoundingClientRect();
      const toolbar = document.querySelector('.toolbar').getBoundingClientRect();
      const saga = document.querySelector('#humansJourneyBar').getBoundingClientRect();
      return {
        mapHeight: map.height,
        mapWidth: map.width,
        contextBottom: context.bottom,
        toolbarBottom: toolbar.bottom,
        sagaHeight: saga.height,
        viewportHeight: innerHeight,
        viewportWidth: innerWidth
      };
    });

    expect(layout.mapHeight).toBeGreaterThan(120);
    expect(layout.mapWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.contextBottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.toolbarBottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.sagaHeight).toBeGreaterThanOrEqual(35);
    await expectNoConsoleProblems(problems);
  });
});
