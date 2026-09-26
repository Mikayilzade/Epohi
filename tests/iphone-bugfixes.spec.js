const { test, expect } = require("@playwright/test");
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require("./helpers");

test.describe('v1.4.2-alpha manual iPhone bugfixes', () => {
  test('resources do not overlap the map zone on small mobile viewports', async ({ page }) => {
    const problems = watchConsole(page);
    await page.setViewportSize({ width: 360, height: 640 });
    await clearStorage(page);
    await createGame(page, 0, 'small');
    for (const size of [{ width: 360, height: 640 }, { width: 375, height: 667 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      await expect(page.locator('#gameApp')).toBeVisible();
      const rects = await page.evaluate(() => {
        const resources = document.querySelector('.resources').getBoundingClientRect();
        const mapZone = document.querySelector('.map-zone').getBoundingClientRect();
        return { resourcesBottom: resources.bottom, mapZoneTop: mapZone.top, resourcesRight: resources.right, mapZoneLeft: mapZone.left };
      });
      expect(rects.resourcesBottom).toBeLessThanOrEqual(rects.mapZoneTop + 0.5);
    }
    expect(problems).toEqual([]);
  });

  test('player can found a city through the real context UI button', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 0, 'small');
    const setup = await page.evaluate(() => {
      const d = window.__epohiDebug();
      const s = d.state;
      const cap = s.city;
      const settler = s.units.find(u => u.type === 'settler') || { id: 'ui-settler', type: 'settler', hp: 70, maxHp: 70 };
      if (!s.units.includes(settler)) s.units.push(settler);
      let spot = null;
      for (let y = 1; y < s.mapSize - 1 && !spot; y++) {
        for (let x = 1; x < s.mapSize - 1 && !spot; x++) {
          if (Math.max(Math.abs(x - cap.x), Math.abs(y - cap.y)) < 4) continue;
          const t = s.map[y][x];
          t.terrain = 'plains'; t.revealed = true; t.camp = null; t.poi = null; t.improvement = null;
          settler.x = x; settler.y = y; settler.moves = 1; settler.acted = false;
          if (d.canFoundCity(settler)) spot = { x, y };
        }
      }
      d.render();
      return { id: settler.id, x: spot.x, y: spot.y, before: s.cities.length };
    });
    await page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"]`).click();
    await expect(page.locator('#contextTitle')).toContainText('Поселенец');
    await expect(page.locator('#contextActions')).toContainText('Основать');
    page.once('dialog', dialog => dialog.accept('UI-град'));
    await page.locator('#contextActions button').filter({ hasText: 'Основать' }).click();
    await expect(page.locator('#contextTitle')).not.toContainText('Поселенец');
    const result = await page.evaluate((before) => {
      const s = window.__epohiDebug().state;
      return { cities: s.cities.length, name: s.cities[s.cities.length - 1].name };
    }, setup.before);
    expect(result.cities).toBe(setup.before + 1);
    expect(result.name).toBe('UI-град');
    expect(problems).toEqual([]);
  });

  test('small 20x20 maps with active barbarians always receive a valid camp', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await page.getByRole('button', { name: 'Новая игра' }).click();
    await page.locator('#partySize').selectOption('small');
    await page.locator('#barbarianActivity').selectOption('normal');
    await page.locator('#rivalCount').selectOption('0');
    await page.locator('#partyName').fill(`Camp smoke ${Date.now()}`);
    await page.getByRole('button', { name: 'Создать мир' }).click();
    await expect(page.locator('#gameApp')).toBeVisible();
    const camps = await page.evaluate(() => {
      const d = window.__epohiDebug();
      const s = d.state;
      const found = [];
      s.map.forEach((row, y) => row.forEach((t, x) => { if (t.camp && t.camp.hp > 0) found.push({ x, y, terrain: t.terrain, poi: !!t.poi, nearCapital: Math.max(Math.abs(x - s.city.x), Math.abs(y - s.city.y)) < 7 }); }));
      return found;
    });
    expect(camps.length).toBeGreaterThanOrEqual(1);
    expect(camps.every(c => c.terrain !== 'water' && !c.poi && !c.nearCapital)).toBeTruthy();
    expect(problems).toEqual([]);
  });

  test('AI scout resets unreachable exploration target and keeps moving on land', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 1, 'small');
    const result = await page.evaluate(() => {
      const d = window.__epohiDebug();
      const s = d.state;
      const civ = s.rivals[0];
      const scout = civ.units.find(u => u.type === 'scout');
      scout.x = 2; scout.y = 2; scout.moves = 2; scout.acted = false; scout.stuckTurns = 2; scout.aiTarget = { x: s.mapSize - 2, y: 1 };
      for (let y = 0; y < s.mapSize; y++) for (let x = 0; x < s.mapSize; x++) {
        s.map[y][x].terrain = (y === 1 && x > 4) ? 'water' : 'plains';
        s.map[y][x].camp = null;
      }
      [[1,2],[2,1],[3,2],[2,3]].forEach(([x,y]) => { s.map[y][x].terrain = 'plains'; });
      const positions = [];
      for (let i = 0; i < 6; i++) {
        scout.moves = window.EpohiData.UNIT_DEFS.scout.maxMoves;
        scout.acted = false;
        d.processRivals();
        positions.push(`${scout.x},${scout.y}`);
      }
      return { alive: civ.units.includes(scout), unique: new Set(positions).size, positions, terrain: s.map[scout.y][scout.x].terrain };
    });
    expect(result.alive).toBeTruthy();
    expect(result.terrain).not.toBe('water');
    expect(result.unique).toBeGreaterThan(1);
    expect(problems).toEqual([]);
  });
});
