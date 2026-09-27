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
    const saved = window.EpohiSaveUtils.serializeState(state);
    const serializedCityAbsent = !Object.prototype.hasOwnProperty.call(saved, 'city');
    const restored = debug.migrateState(saved);
    return { capitalId:restored.city.id,
      serializedCapitalId:saved.capitalCityId,
      alias:restored.city === restored.cities[1],
      serializedCityAbsent:serializedCityAbsent,
      flags:restored.cities.map(city => city.capital),
      firstHp:restored.cities[0].hp };
  });
  expect(result).toEqual({ capitalId:'successor-capital', serializedCapitalId:'successor-capital',
    serializedCityAbsent:true, alias:true,
    flags:[false,true], firstHp:0 });
});

test('game creation and load normalize domain state before presentation', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 1, 'small');
  const result = await page.evaluate(async () => {
    const debug = window.__epohiDebug();
    const created = debug.createNewGame(20, 1, 'normal');
    const initialized = {
      experience: !!(created.experience && created.experience.units && created.experience.buildings),
      migrated: created.workerLearningMigrated === true,
      rivalResearch: created.rivals.every(civ => civ.science && Array.isArray(civ.technologies))
    };
    const old = JSON.parse(JSON.stringify(created));
    old.cities[0].buildings.push('granary');
    delete old.experience;
    delete old.workerLearningMigrated;
    old.rivals.forEach(civ => { delete civ.science; delete civ.technologies; });
    const loaded = debug.migrateState(old);
    const normalized = {
      buildingCount: loaded.experience.buildings.granary,
      migrated: loaded.workerLearningMigrated === true,
      rivalResearch: loaded.rivals.every(civ => civ.science && Array.isArray(civ.technologies))
    };

    const live = debug.state;
    live.workerLearningMigrated = false;
    live.city.buildings.push('granary');
    live.experience.buildings = {};
    const rival = live.rivals[0];
    rival.science.currentResearch = 'invalid-test-tech';
    rival.science.progress = 7;
    document.getElementById('cityModal').classList.add('show');
    document.getElementById('turnValue').textContent = String(live.turn);
    await new Promise(resolve => setTimeout(resolve, 100));
    const presentationOnly = {
      migrated: live.workerLearningMigrated,
      buildingCount: live.experience.buildings.granary || 0,
      research: rival.science.currentResearch,
      progress: rival.science.progress
    };
    return { initialized, normalized, presentationOnly };
  });
  expect(result.initialized).toEqual({ experience:true, migrated:true, rivalResearch:true });
  expect(result.normalized).toEqual({ buildingCount:1, migrated:true, rivalResearch:true });
  expect(result.presentationOnly).toEqual({ migrated:false, buildingCount:0, research:'invalid-test-tech', progress:7 });
});
