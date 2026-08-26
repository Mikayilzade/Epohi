const { expect } = require('@playwright/test');

function watchConsole(page) {
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console.${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

async function expectNoConsoleProblems(problems) {
  expect(problems, problems.join('\n')).toEqual([]);
}

async function clearStorage(page) {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all(dbs.map((db) => db.name && new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(db.name);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
      })));
    } else {
      await new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('epohi-db');
        req.onsuccess = req.onerror = req.onblocked = () => resolve();
      });
    }
  });
}

async function promoteSmallFixtureRivals(page, rivals) {
  if (rivals <= 1) return;
  await page.evaluate((requestedRivals) => {
    const debug = window.__epohiDebug && window.__epohiDebug();
    const gs = debug && debug.state;
    if (!gs || !Array.isArray(gs.rivals) || !gs.rivals.length || gs.rivals.length >= requestedRivals) return;

    const occupied = [];
    (gs.cities || (gs.city ? [gs.city] : [])).forEach((city) => occupied.push([city.x, city.y]));
    gs.rivals.forEach((civ) => (civ.cities || []).forEach((city) => occupied.push([city.x, city.y])));
    const isOccupied = (x, y) => occupied.some(([ox, oy]) => ox === x && oy === y);
    const findFixtureCity = () => {
      for (let y = 2; y < gs.map.length - 2; y += 1) {
        for (let x = 2; x < gs.map[y].length - 2; x += 1) {
          const tile = gs.map[y][x];
          if (window.EpohiUtils.passableTile(tile) && !isOccupied(x, y)) return { x, y };
        }
      }
      return { x: gs.city.x, y: gs.city.y };
    };

    while (gs.rivals.length < requestedRivals) {
      const source = gs.rivals[0];
      const index = gs.rivals.length + 1;
      const id = `fixture-civ${index}`;
      const spot = findFixtureCity();
      const clone = JSON.parse(JSON.stringify(source));
      clone.civilizationId = id;
      clone.name = `Fixture Rival ${index}`;
      clone.symbol = String.fromCharCode(64 + index);
      clone.met = false;
      clone.relation = 'unknown';
      clone.defeated = false;
      clone.warStartTurn = null;
      clone.units = [];
      clone.outposts = [];
      clone.diplomacy = { trust: 35, fear: 15, grievances: 0, memories: [], history: [] };
      clone.cities = [{
        id: `${id}-cap`,
        name: `Fixture Capital ${index}`,
        x: spot.x,
        y: spot.y,
        population: 1,
        buildings: [],
        queue: null,
        hp: 180,
        maxHp: 180,
        capital: true
      }];
      occupied.push([spot.x, spot.y]);
      gs.rivals.push(clone);
    }
    if (window.EpohiLivingCivilizations && window.EpohiLivingCivilizations.migrate) {
      window.EpohiLivingCivilizations.migrate(gs);
    }

    // A synthetic small-map multi-rival world exists only to exercise logic that
    // needs two living civilizations on a map size that intentionally supports
    // one real rival. Keep unrelated AI production/barbarian work quiescent so
    // real End Turn integration tests spend their budget on the behavior under test.
    gs.barbarianActivity = 'off';
    gs.barbarians = [];
    (gs.map || []).forEach((row) => row.forEach((tile) => {
      if (tile.camp) tile.camp = null;
    }));
    gs.rivals.forEach((civ) => {
      civ.resources = civ.resources || {};
      civ.resources.food = 0;
      civ.resources.production = 0;
      civ.resources.gold = 0;
      civ.resources.science = 0;
      civ.productionQueue = null;
      (civ.cities || []).forEach((city) => { city.queue = null; });
    });

    // Run #165 proved that one-worker Chromium still spends almost the entire
    // strict 20 s budget in this already-synthetic diplomacy/end-turn fixture.
    // The regression is not a render-throughput test, so tighten only this fixture's
    // mapSize-driven iteration/render bound from 12 to 8. The backing map, real End
    // Turn handler, turn increment, diplomacy processor and proposal assertions remain intact.
    gs.mapSize = Math.min(Number(gs.mapSize) || gs.map.length, 8);
  }, rivals);
}

async function createGame(page, rivals, mapSize = 'normal') {
  const needsSyntheticSmallRivals = mapSize === 'small' && rivals > 1;
  const maxAttempts = rivals > 1 && !needsSyntheticSmallRivals ? 4 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'ЭПОХИ' })).toBeVisible();
    await page.getByRole('button', { name: 'Новая игра' }).click();
    await page.locator('#partySize').selectOption(mapSize);
    await page.locator('#rivalCount').selectOption(String(rivals));
    await page.locator('#partyName').fill(`Smoke ${rivals} AI ${Date.now()} ${attempt}`);
    await page.getByRole('button', { name: 'Создать мир' }).click();
    await expect(page.locator('#gameApp')).toBeVisible();
    await expect(page.locator('#map .tile').first()).toBeVisible();

    if (needsSyntheticSmallRivals) await promoteSmallFixtureRivals(page, rivals);
    const actualRivals = await page.evaluate(() => {
      const debug = window.__epohiDebug && window.__epohiDebug();
      return debug && debug.state && Array.isArray(debug.state.rivals) ? debug.state.rivals.length : 0;
    });
    if (actualRivals >= rivals) return;
    if (attempt === maxAttempts - 1) throw new Error(`Requested ${rivals} rivals but fixture created ${actualRivals}`);
    await clearStorage(page);
  }
}

module.exports = {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
};