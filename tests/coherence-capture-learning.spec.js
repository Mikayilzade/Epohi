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
    window.EpohiCoherenceFinalize &&
    window.__epohiDebug &&
    window.__epohiDebug().state
  ));
  return problems;
}

test.describe('Рабочие, опыт производства, дипломатия и захват городов', () => {
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
      return { started, afterStart, total, improvement: tile.improvement };
    });
    expect(result.started).toBe(true);
    expect(result.afterStart).toBe(0);
    expect(result.total).toBe(2);
    expect(result.improvement).toBe('farm');
    await expectNoConsoleProblems(problems);
  });

  test('автоприказ рабочего не остаётся на паузе из-за старого требования производства', async ({ page }) => {
    const problems = await openGame(page, 0);
    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const worker = state.units.find(unit => unit.type === 'worker');
      worker.order = { type:'develop', status:'paused', reason:'городу не хватает локального производства', cityId:state.cities[0].id, priority:'food', target:null };
      worker.workerProject = { type:'improvement', improvementId:'farm', x:worker.x, y:worker.y, totalTurns:2, remainingTurns:1, startedTurn:state.turn };
      state.autonomyReports = [{ unitId:worker.id, text:'Рабочий остановил приказ: городу не хватает локального производства.' }];
      window.EpohiCoherenceFinalize.repairWorkerAutonomy(state);
      return { status:worker.order.status, reason:worker.order.reason, reports:state.autonomyReports.length };
    });
    expect(result.status).toBe('active');
    expect(result.reason).toContain('строит');
    expect(result.reports).toBe(0);
    await expectNoConsoleProblems(problems);
  });

  test('здания и юниты дешевеют от собственного опыта по согласованным ступеням', async ({ page }) => {
    const problems = await openGame(page, 0);
    const values = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      window.EpohiWorkerLearning.ensureState(state);
      state.experience.buildings.granary = 0;
      state.experience.foreignBuildings.granary = [];
      state.experience.units.warrior = 0;
      const buildingBase = window.EpohiWorkerLearning.effectiveProductionCost(state, 'building', 'granary');
      state.experience.buildings.granary = 1;
      const buildingSecond = window.EpohiWorkerLearning.effectiveProductionCost(state, 'building', 'granary');
      state.experience.buildings.granary = 2;
      const buildingThird = window.EpohiWorkerLearning.effectiveProductionCost(state, 'building', 'granary');
      state.experience.buildings.granary = 3;
      const buildingFourth = window.EpohiWorkerLearning.effectiveProductionCost(state, 'building', 'granary');
      state.experience.units.warrior = 10;
      const unit10 = window.EpohiWorkerLearning.effectiveProductionCost(state, 'unit', 'warrior');
      state.experience.units.warrior = 20;
      const unit20 = window.EpohiWorkerLearning.effectiveProductionCost(state, 'unit', 'warrior');
      state.experience.units.warrior = 30;
      const unit30 = window.EpohiWorkerLearning.effectiveProductionCost(state, 'unit', 'warrior');
      return { buildingBase, buildingSecond, buildingThird, buildingFourth, unit10, unit20, unit30 };
    });
    expect(values.buildingBase).toBe(24);
    expect(values.buildingSecond).toBe(22);
    expect(values.buildingThird).toBe(20);
    expect(values.buildingFourth).toBe(17);
    expect(values.unit10).toBe(31);
    expect(values.unit20).toBe(28);
    expect(values.unit30).toBe(24);
    await expectNoConsoleProblems(problems);
  });

  test('ИИ получает ту же скидку на тип войск после каждых десяти произведённых', async ({ page }) => {
    const problems = await openGame(page, 1);
    const result = await page.evaluate(async () => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals[0];
      window.EpohiCoherenceFinalize.ensureState(state);
      civ.experience.units.warrior = 10;
      const type = window.EpohiLivingCivilizations.chooseProduction(civ, { threat:true, warriors:0, workers:1, scouts:1, canSettle:false });
      const during = window.EpohiData.UNIT_DEFS.warrior.cost.production;
      await Promise.resolve();
      const restored = window.EpohiData.UNIT_DEFS.warrior.cost.production;
      return { type, during, restored };
    });
    expect(result.type).toBe('warrior');
    expect(result.during).toBe(31);
    expect(result.restored).toBe(34);
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
      capital.buildings = ['granary'];
      const second = {
        id:civ.civilizationId + '-survivor', name:'Запасная столица', x:capital.x + 4, y:capital.y,
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
        foreignGranary:(state.experience.foreignBuildings.granary || []).includes(civId)
      };
    }, setup);
    expect(result.defeated).toBe(false);
    expect(result.newCapital).toBe(true);
    expect(result.specialization).toBe('production');
    expect(result.foreignGranary).toBe(true);
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
      return { cityId:String(city.id), civId:String(civ.civilizationId) };
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
      state.researched = Array.from(new Set([].concat(state.researched || [], ['agriculture']))).filter(id => id !== 'writing');
      civ.technologies = Array.from(new Set([].concat(civ.technologies || [], ['writing'])));
      city.buildings = ['library'];
      city.hp = 0;
      window.EpohiCaptureState.queueCapture(state, civ, city);
      return { cityId:String(city.id), civId:String(civ.civilizationId) };
    });
    await page.locator(`[data-capture-choice="plunder"][data-city-id="${setup.cityId}"]`).click();
    const result = await page.evaluate(({ civId }) => {
      const state = window.__epohiDebug().state;
      return { insight:state.techInsights.writing, foreignLibrary:(state.experience.foreignBuildings.library || []).includes(civId) };
    }, setup);
    expect(result.insight).toBe(4);
    expect(result.foreignLibrary).toBe(true);
    await expectNoConsoleProblems(problems);
  });

  test('при заполненном лимите захваченный город требует сначала расширить администрацию за золото', async ({ page }) => {
    const problems = await openGame(page, 1);
    const setup = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals[0];
      const city = civ.cities[0];
      state.cityCapacity = state.cities.length;
      state.resources.gold = 500;
      city.hp = 0;
      window.EpohiCaptureState.queueCapture(state, civ, city);
      return { cityId:String(city.id), before:state.cityCapacity };
    });
    const annex = page.locator(`[data-capture-choice="annex"][data-city-id="${setup.cityId}"]`);
    await expect(annex).toBeDisabled();
    await expect(page.locator('[data-capture-expand]')).toBeVisible();
    await page.locator('[data-capture-expand]').click();
    await expect(annex).toBeEnabled();
    expect(await page.evaluate(() => window.__epohiDebug().state.cityCapacity)).toBe(setup.before + 1);
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

  test('невозможное торговое предложение отменяется, если технология торговли отсутствует', async ({ page }) => {
    const problems = await openGame(page, 1);
    const result = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals[0];
      civ.met = true;
      civ.relation = 'neutral';
      state.researched = (state.researched || []).filter(id => id !== 'trade');
      state.technologies = (state.technologies || []).filter(id => id !== 'trade');
      civ.technologies = (civ.technologies || []).filter(id => id !== 'trade');
      const item = window.EpohiLivingCivilizations.createProposal(state, civ, 'trade', 'Откроем торговый путь.');
      window.EpohiCoherenceFinalize.invalidateImpossibleTrades(state);
      return { status:item && item.status, phantom:state.eventLog.some(event => event.eventType === 'diplomatic-proposal' && String(event.text).includes('Откроем торговый путь.')) };
    });
    expect(result.status).toBe('cancelled');
    expect(result.phantom).toBe(false);
    await expectNoConsoleProblems(problems);
  });

  test('дипломатия показывает изученные технологии и текущее исследование соперника', async ({ page }) => {
    const problems = await openGame(page, 1);
    const civId = await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const civ = state.rivals[0];
      civ.met = true;
      civ.relation = 'neutral';
      civ.technologies = ['agriculture'];
      civ.science = { currentResearch:'mining', progress:7 };
      window.__epohiDebug().render();
      window.EpohiStrategyUX.openDiplomacy(civ.civilizationId);
      window.EpohiDiplomacyCoherence.patchDiplomacy(state);
      return String(civ.civilizationId);
    });
    const card = page.locator(`[data-diplomacy-civ="${civId}"]`);
    await expect(card).toContainText('Земледелие');
    await expect(card).toContainText('Горное дело — 7/16');
    await expectNoConsoleProblems(problems);
  });

  test('срочное решение показывает последствия каждого варианта', async ({ page }) => {
    const problems = await openGame(page, 0);
    await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      const event = window.EpohiHumansJourney.eventById('wandering-smith');
      const city = state.cities[0];
      window.EpohiCombatWorldStability.createUrgentDecision(state, {
        id:'test-urgent-effects', journeyEventId:event.id, title:event.title, text:event.text, cityId:city.id,
        options:event.choices.map(choice => ({ id:choice.id, label:choice.label }))
      });
      document.getElementById('stabilityDecisionModal').classList.add('show');
      window.EpohiCoherenceFinalize.patchUrgentDecision(state);
    });
    const modal = page.locator('#stabilityDecisionModal');
    await expect(modal).toContainText('Столица получает +18 производства');
    await expect(modal).toContainText('Цивилизация получает +10 науки');
    await expect(page.locator('#urgentDecisionIndicator')).toBeHidden();
    await expectNoConsoleProblems(problems);
  });

  test('требование населения для юнита показано точным числом', async ({ page }) => {
    const problems = await openGame(page, 0);
    await page.evaluate(() => {
      const state = window.__epohiDebug().state;
      state.cities[0].population = 1;
      state.cities[0].queue = null;
      state.researched = Array.from(new Set([].concat(state.researched || [], ['mining'])));
      document.getElementById('cityBtn').click();
      window.EpohiCoherenceFinalize.patchPopulationRequirement(state);
    });
    const warrior = page.locator('#cityContent .game-card').filter({ hasText:'Воин' }).first();
    await expect(warrior.locator('button.card-button')).toHaveText('Нужно население 2+');
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
