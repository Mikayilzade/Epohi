const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('legacy state migration is versioned and idempotent', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');

  const result = await page.evaluate(() => {
    const debug = window.__epohiDebug();
    const old = JSON.parse(JSON.stringify(debug.state));
    old.version = 1;
    old.resources.food = 7;
    old.resources.production = 9;
    delete old.cities;
    delete old.units;
    old.scout = { x: old.city.x, y: old.city.y - 1, moved: true };
    delete old.history;
    delete old.eventLog;
    delete old.localResourceMigration142Done;
    const migrated = debug.migrateState(old);
    const once = { food: migrated.city.food, production: migrated.city.production };
    debug.migrateState(migrated);
    return {
      version: migrated.version,
      expectedVersion: window.EpohiConfig.STATE_VERSION,
      cityAlias: migrated.city === migrated.cities[0],
      resourcePool: migrated.resources,
      once,
      twice: { food: migrated.city.food, production: migrated.city.production },
      unit: migrated.units[0],
      history: migrated.history,
      eventLog: migrated.eventLog,
      oldScoutRemoved: !Object.prototype.hasOwnProperty.call(migrated, 'scout')
    };
  });

  expect(result.version).toBe(result.expectedVersion);
  expect(result.cityAlias).toBe(true);
  expect(result.resourcePool.food).toBe(0);
  expect(result.resourcePool.production).toBe(0);
  expect(result.twice).toEqual(result.once);
  expect(result.unit.type).toBe('scout');
  expect(result.unit.moves).toBe(0);
  expect(result.history).toEqual([]);
  expect(result.eventLog).toEqual([]);
  expect(result.oldScoutRemoved).toBe(true);
});

test('saved successor capital remains the active city after migration', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');
  const result = await page.evaluate(() => {
    const debug = window.__epohiDebug();
    const state = debug.state;
    const first = state.cities[0];
    const successor = { ...first, id:'successor-capital', name:'Новая столица',
      x:first.x + 2, y:first.y, hp:150, maxHp:150, capital:true,
      buildings:[], queue:null };
    first.hp = 0;
    first.capital = false;
    state.cities.push(successor);
    state.city = successor;
    const saved = JSON.parse(JSON.stringify(state));
    const restored = debug.migrateState(saved);
    return { capitalId:restored.city.id,
      alias:restored.city === restored.cities[1],
      flags:restored.cities.map(city => city.capital),
      firstHp:restored.cities[0].hp };
  });
  expect(result).toEqual({ capitalId:'successor-capital', alias:true,
    flags:[false,true], firstHp:0 });
});
