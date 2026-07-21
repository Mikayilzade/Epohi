const { test, expect } = require('@playwright/test');

async function openFreshGame(page, options = {}) {
  await page.goto('/');
  await expect(page.locator('#newGameScreenBtn')).toBeVisible();
  await page.locator('#newGameScreenBtn').click();

  if (options.size) await page.locator('#partySize').selectOption(options.size);
  if (options.barbarians) await page.locator('#barbarianActivity').selectOption(options.barbarians);
  if (options.rivals !== undefined) await page.locator('#rivalCount').selectOption(String(options.rivals));

  await page.locator('#partyName').fill(options.name || 'Тест прототипа');
  await page.locator('#createParty').click();

  await expect(page.locator('#gameApp')).not.toHaveClass(/is-hidden/);
  await page.waitForFunction(() => Boolean(window.__epohiDebug && window.__epohiDebug().state));
}

test.describe('Эпохи: Люди — базовый контракт прототипа', () => {
  test('новая обычная партия создаёт связное стартовое состояние', async ({ page }) => {
    await openFreshGame(page, { size: 'normal', barbarians: 'normal', rivals: 1 });

    const snapshot = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      return {
        mapSize: state.mapSize,
        rows: state.map.length,
        columns: state.map[0].length,
        turn: state.turn,
        cityCount: state.cities.length,
        capitalCount: state.cities.filter(city => city.capital).length,
        unitTypes: state.units.map(unit => unit.type).sort(),
        uniqueUnitIds: new Set(state.units.map(unit => unit.id)).size,
        rivals: state.rivals.length,
        barbarianActivity: state.barbarianActivity,
        activeCamps: window.__epohiDebug().activeCampEntries(state).length,
        researched: state.researched.length,
        hasResources: ['food', 'production', 'gold', 'science'].every(key =>
          Object.prototype.hasOwnProperty.call(state.resources, key)
        )
      };
    });

    expect(snapshot.mapSize).toBe(28);
    expect(snapshot.rows).toBe(28);
    expect(snapshot.columns).toBe(28);
    expect(snapshot.turn).toBe(1);
    expect(snapshot.cityCount).toBe(1);
    expect(snapshot.capitalCount).toBe(1);
    expect(snapshot.unitTypes).toEqual(['scout', 'worker']);
    expect(snapshot.uniqueUnitIds).toBe(2);
    expect(snapshot.rivals).toBe(1);
    expect(snapshot.barbarianActivity).toBe('normal');
    expect(snapshot.activeCamps).toBeGreaterThan(0);
    expect(snapshot.researched).toBe(0);
    expect(snapshot.hasResources).toBe(true);
  });

  test('настройки сценария реально меняют создаваемый мир', async ({ page }) => {
    await openFreshGame(page, { size: 'small', barbarians: 'off', rivals: 0, name: 'Мирный тест' });

    const scenario = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      return {
        mapSize: state.mapSize,
        rivals: state.rivals.length,
        barbarianActivity: state.barbarianActivity,
        camps: window.__epohiDebug().activeCampEntries(state).length,
        raiders: state.barbarians.length
      };
    });

    expect(scenario).toEqual({
      mapSize: 20,
      rivals: 0,
      barbarianActivity: 'off',
      camps: 0,
      raiders: 0
    });
  });

  test('контент не содержит сломанных технологических ссылок', async ({ page }) => {
    await page.goto('/');

    const integrity = await page.evaluate(() => {
      const { TECHS, BUILDINGS, UNIT_DEFS, IMPROVEMENTS } = window.EpohiData;
      const techIds = new Set(Object.keys(TECHS));
      const errors = [];

      Object.entries(TECHS).forEach(([id, tech]) => {
        if (!Number.isFinite(tech.cost) || tech.cost <= 0) errors.push(`tech-cost:${id}`);
        (tech.prereq || []).forEach(prereq => {
          if (!techIds.has(prereq)) errors.push(`tech-prereq:${id}:${prereq}`);
          if (prereq === id) errors.push(`tech-self:${id}`);
        });
      });

      [
        ['building', BUILDINGS],
        ['unit', UNIT_DEFS],
        ['improvement', IMPROVEMENTS]
      ].forEach(([kind, collection]) => {
        Object.entries(collection).forEach(([id, def]) => {
          if (def.tech && !techIds.has(def.tech)) errors.push(`${kind}-tech:${id}:${def.tech}`);
          if (!def.name || !def.icon) errors.push(`${kind}-identity:${id}`);
          if (!def.cost || !Object.values(def.cost).some(value => value > 0)) errors.push(`${kind}-cost:${id}`);
        });
      });

      return {
        errors,
        techCount: Object.keys(TECHS).length,
        buildingCount: Object.keys(BUILDINGS).length,
        unitCount: Object.keys(UNIT_DEFS).length,
        improvementCount: Object.keys(IMPROVEMENTS).length
      };
    });

    expect(integrity.errors).toEqual([]);
    expect(integrity.techCount).toBeGreaterThanOrEqual(6);
    expect(integrity.buildingCount).toBeGreaterThanOrEqual(7);
    expect(integrity.unitCount).toBeGreaterThanOrEqual(4);
    expect(integrity.improvementCount).toBeGreaterThanOrEqual(5);
  });

  test('текущая государственная победа достижима через завершение дворца', async ({ page }) => {
    await openFreshGame(page, { size: 'small', barbarians: 'off', rivals: 0, name: 'Тест победы' });

    await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const city = state.cities[0];
      const palace = window.EpohiData.BUILDINGS.palace;

      city.population = 6;
      state.researched = Array.from(new Set([...state.researched, 'statehood']));
      city.queue = {
        type: 'building',
        id: 'palace',
        progress: Math.max(0, palace.cost.production - 1),
        cost: palace.cost.production,
        upfront: {}
      };
    });

    await page.locator('#endTurnBtn').click();
    await page.waitForFunction(() => window.__epohiDebug().state.victory === true);

    await expect(page.locator('#victoryModal')).toHaveClass(/show/);
    const state = await page.evaluate(() => window.__epohiDebug().state);
    expect(state.victory).toBe(true);
    expect(state.cities[0].buildings).toContain('palace');
  });
});
