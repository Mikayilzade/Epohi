const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');

async function openGame(page, rivals = 1) {
  const problems = watchConsole(page);
  await clearStorage(page);
  await createGame(page, rivals, 'small');
  await page.waitForFunction(() => Boolean(
    window.EpohiWorkerLearning &&
    window.EpohiCaptureState &&
    window.EpohiDiplomacyCoherence &&
    window.__epohiDebug &&
    window.__epohiDebug().state
  ));
  return problems;
}

test.describe('Рабочие, опыт производства и захват городов', () => {
  test('рабочий строит улучшение рабочим временем без городского производства', async ({ page }) => {
    const problems = await openGame(page, 0);

    const result = await page.evaluate(() => {
      const debug = window.__epohiDebug();
      const state = debug.state;
      const city = state.cities[0];
      const worker = state.units.find(unit => unit.type === 'worker');
      const points = window.EpohiUtils.neighborsOf(city.x, city.y, state.map.length);
      const target = points.find(point => state.map[point.y][point.x].terrain !== 'water') || points[0];
      const tile = state.map[target.y][target.x];
      tile.terrain = 'plains';
      tile.revealed = true;
      tile.owner = city.id;
      tile.improvement = null;
      tile.pillaged = false;
      state.researched = Array.from(new Set([].concat(state.researched || [], ['agriculture'])));
      city.production = 0;
      worker.x = target.x;
      worker.y = target.y;
      worker.moves = 1;
      worker.acted = false;
      const started = window.EpohiWorkerLearning.startWorkerProject(worker.id, 'farm', target.x, target.y, false);
      const afterStart = city.production;
      const total = worker.workerProject && worker.workerProject.totalTurns;
      state.turn += 1;
      window.EpohiWorkerLearning.processWorkerProjects(state);
      return { started, afterStart, total, improvement:tile.improvement };
    });

    expect(result.started).toBe(true);
    expect(result.afterStart).toBe(0);
    expect(result.total).toBe(2);
    expect(result.improvement).toBe('farm');
    await expectNoConsoleProblems(problems);
  });

  test('здания и юниты дешевеют от собственного опыта по согласованным ступеням', async ({ page }) => {
    const problems = await openGame(page, 0);

    const values = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      window.EpohiWorkerLearning.ensureState(state);
      state.experience.buildings.storehouse = 0;
      state.experience.foreignBuildings.storehouse = [];
      state.experience.units.warrior = 0;
      const buildingBase = window.EpohiWorkerLearning.effectiveProductionCost(state, 'building', 'storehouse');
      state.experience.buildings.storehouse = 1;
      const buildingSecond = window.EpohiWorkerLearning.effectiveProductionCost(state, 'building', 'storehouse');
      state.experience.buildings.storehouse = 2;
      const buildingThird = window.EpohiWorkerLearning.effectiveProductionCost(state, 'building', 'storehouse');
      state.experience.buildings.storehouse = 3;
      const buildingFourth = window.EpohiWorkerLearning.effectiveProductionCost(state, 'building', 'storehouse');
      state.experience.units.warrior = 10;
      const unit10 = window.EpohiWorkerLearning.effectiveProductionCost(state, 'unit', 'warrior');
      state.experience.units.warrior = 20;
      const unit20 = window.EpohiWorkerLearning.effectiveProductionCost(state, 'unit', 'warrior');
      state.experience.units.warrior = 30;
      const unit30 = window.EpohiWorkerLearning.effectiveProductionCost(state, 'unit', 'warrior');
      return { buildingBase, buildingSecond, buildingThird, buildingFourth, unit10, unit20, unit30 };
    });

    expect(values.buildingBase).toBe(28);
    expect(values.buildingSecond).toBe(26);
    expect(values.buildingThird).toBe(23);
    expect(values.buildingFourth).toBe(20);
    expect(values.unit10).toBe(31);
    expect(values.unit20).toBe(28);
    expect(values.unit30).toBe(24);
    await expectNoConsoleProblems(problems);
  });

  test('падение столицы не уничтожает государство, пока остаётся другой город', async ({ page }) => {
    const problems = await openGame(page, 1);

    const setup = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals[0];
      const capital = civ.cities[0];
      capital.population = 4;
      capital.specialization = 'production';
      capital.buildings = ['storehouse'];
      const second = {
        id: civ.civilizationId + '-survivor', name: 'Запасная столица', x:capital.x + 4, y:capital.y,
        population:3, food:0, production:0, buildings:[], queue:null, hp:150, maxHp:150, capital:false
      };
      civ.cities.push(second);
      capital.hp = 0;
      window.EpohiCaptureState.queueCapture(state, civ, capital);
      return { capitalId:String(capital.id), civId:String(civ.civilizationId), secondId:String(second.id) };
    });

    await page.locator(`[data-capture-choice="annex"][data-city-id="${setup.capitalId}"]`).click();
    const result = await page.evaluate(({ civId, secondId, capitalId }) => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals.find(item => String(item.civilizationId) === civId);
      const survivor = civ.cities.find(item => String(item.id) === secondId);
      const captured = state.cities.find(item => String(item.id) === capitalId);
      return {
        defeated:civ.defeated,
        newCapital:!!(survivor && survivor.capital),
        specialization:captured && captured.specialization,
        foreignStorehouse:(state.experience.foreignBuildings.storehouse || []).includes(civId)
      };
    }, setup);

    expect(result.defeated).toBe(false);
    expect(result.newCapital).toBe(true);
    expect(result.specialization).toBe('production');
    expect(result.foreignStorehouse).toBe(true);
    await expectNoConsoleProblems(problems);
  });

  test('последний город уничтожает фракцию, а оставшиеся отряды становятся бандитами с тем же процентом здоровья', async ({ page }) => {
    const problems = await openGame(page, 1);

    const setup = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals[0];
      civ.cities = [civ.cities[0]];
      const city = civ.cities[0];
      const warrior = civ.units.find(unit => unit.type === 'warrior') || civ.units[0];
      warrior.maxHp = 100;
      warrior.hp = 37;
      city.hp = 0;
      window.EpohiCaptureState.queueCapture(state, civ, city);
      return { cityId:String(city.id), civId:String(civ.civilizationId), unitId:String(warrior.id) };
    });

    await page.locator(`[data-capture-choice="annex"][data-city-id="${setup.cityId}"]`).click();
    const result = await page.evaluate(({ civId }) => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals.find(item => String(item.civilizationId) === civId);
      const bandit = state.barbarians.find(item => item.bandit && String(item.formerCivilizationId) === civId && item.maxHp === 100);
      return { defeated:civ.defeated, units:civ.units.length, hp:bandit && bandit.hp, maxHp:bandit && bandit.maxHp };
    }, setup);

    expect(result.defeated).toBe(true);
    expect(result.units).toBe(0);
    expect(result.hp).toBe(37);
    expect(result.maxHp).toBe(100);
    await expectNoConsoleProblems(problems);
  });

  test('разграбление даёт 20% знаний неизвестной технологии и опыт увиденного здания', async ({ page }) => {
    const problems = await openGame(page, 1);

    const setup = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals[0];
      const city = civ.cities[0];
      state.researched = Array.from(new Set([].concat(state.researched || [], ['agriculture'])));
      state.researched = state.researched.filter(id => id !== 'writing');
      civ.technologies = Array.from(new Set([].concat(civ.technologies || [], ['writing'])));
      city.buildings = ['library'];
      city.hp = 0;
      window.EpohiCaptureState.queueCapture(state, civ, city);
      return { cityId:String(city.id), civId:String(civ.civilizationId) };
    });

    await page.locator(`[data-capture-choice="plunder"][data-city-id="${setup.cityId}"]`).click();
    const result = await page.evaluate(({ civId }) => {
      const state = window.__epohiDebug().state;
      return {
        insight:state.techInsights.writing,
        foreignLibrary:(state.experience.foreignBuildings.library || []).includes(civId)
      };
    }, setup);

    expect(result.insight).toBe(4);
    expect(result.foreignLibrary).toBe(true);
    await expectNoConsoleProblems(problems);
  });

  test('ИИ-город выбирает специализацию при населении 3', async ({ page }) => {
    const problems = await openGame(page, 1);

    const specialization = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals[0];
      const city = civ.cities[0];
      city.population = 3;
      city.specialization = null;
      window.EpohiCaptureState.processAiSpecializations(state);
      return city.specialization;
    });

    expect(['food', 'production', 'science', 'gold']).toContain(specialization);
    await expectNoConsoleProblems(problems);
  });

  test('при полностью открытой карте повторная покупка карты отключается', async ({ page }) => {
    const problems = await openGame(page, 0);

    await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      state.map.forEach(row => row.forEach(tile => { tile.revealed = true; }));
      window.EpohiPlayerFeedback.openTreasury();
    });
    await page.waitForTimeout(50);
    const button = page.locator('[data-treasury-action="map"]');
    await expect(button).toBeDisabled();
    await expect(button).toHaveText('Карта открыта');
    await expectNoConsoleProblems(problems);
  });
});
