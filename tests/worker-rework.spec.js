const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');
});

test('worker costs are data driven and progress once per turn without city payment', async ({ page }) => {
  const result = await page.evaluate(() => {
    const state = window.__epohiDebug().state;
    const city = state.city;
    const point = window.EpohiUtils.neighborsOf(city.x, city.y, state.map.length)
      .find(item => !state.units.some(unit => unit.x === item.x && unit.y === item.y));
    const tile = state.map[point.y][point.x];
    Object.assign(tile, { terrain:'hill', revealed:true, owner:city.id,
      improvement:null, pillaged:false, camp:null, poi:null });
    state.researched.push('mining');
    city.production = 0;
    state.resources.production = 0;
    const worker = { id:'rework-mine', type:'worker', x:point.x, y:point.y,
      moves:1, acted:false, hp:70, maxHp:70 };
    state.units.push(worker);
    window.EpohiData.IMPROVEMENTS.mine.cost.production = 1000;
    const service = window.EpohiWorkerProjects;
    const started = service.start(state, worker.id, 'mine', point.x, point.y, false);
    const project = { ...worker.workerProject };
    const orderAssigned = window.EpohiHumansAutonomy.assignOrder(worker.id, 'develop',
      { cityId:city.id, priority:'production' });
    const second = service.start(state, worker.id, 'mine', point.x, point.y, false);
    window.EpohiHumansAutonomy.processOrders(state);
    const afterSwitch = worker.workerProject.remainingWorkerActions;
    state.turn += 1;
    service.processTurn(state);
    const firstProgress = worker.workerProject.remainingWorkerActions;
    service.processTurn(state);
    const duplicateProgress = worker.workerProject.remainingWorkerActions;
    state.turn += 1;
    service.processTurn(state);
    return { started, project, orderAssigned, second, afterSwitch,
      firstProgress, duplicateProgress, improvement:tile.improvement,
      finalProject:worker.workerProject, production:city.production,
      empireProduction:state.resources.production };
  });
  expect(result.started).toEqual({ remaining:2, total:3 });
  expect(result.project).toEqual(expect.objectContaining({
    totalWorkerActions:3, remainingWorkerActions:2, actionCostVersion:2
  }));
  expect(result.orderAssigned).toBe(true);
  expect(result.second).toBeNull();
  expect(result.afterSwitch).toBe(2);
  expect(result.firstProgress).toBe(1);
  expect(result.duplicateProgress).toBe(1);
  expect(result.improvement).toBe('mine');
  expect(result.finalProject).toBeNull();
  expect(result.production).toBe(0);
  expect(result.empireProduction).toBe(0);
});

test('repair and harbor share territorial and fog validation', async ({ page }) => {
  const result = await page.evaluate(() => {
    const state = window.__epohiDebug().state, city = state.city;
    const point = window.EpohiUtils.neighborsOf(city.x, city.y, state.map.length)[0];
    const tile = state.map[point.y][point.x];
    Object.assign(tile, { terrain:'forest', revealed:true, owner:city.id,
      improvement:'lumber', pillaged:true, camp:null, poi:null });
    const repairer = { id:'rework-repair', type:'worker', x:point.x, y:point.y,
      moves:1, acted:false, hp:70, maxHp:70 };
    state.units.push(repairer);
    city.production = 0;
    const service = window.EpohiWorkerProjects;
    const repaired = service.start(state, repairer.id, null, point.x, point.y, true);
    const doubleAct = service.start(state, repairer.id, 'lumber', point.x, point.y, false);

    const harborPoint = window.EpohiUtils.neighborsOf(city.x, city.y, state.map.length)
      .find(item => item.x !== point.x || item.y !== point.y);
    const water = state.map[harborPoint.y][harborPoint.x];
    Object.assign(water, { terrain:'water', revealed:false, owner:city.id,
      improvement:null, pillaged:false, camp:null, poi:null });
    const harborWorker = { id:'rework-harbor', type:'worker', x:city.x, y:city.y,
      moves:1, acted:false, hp:70, maxHp:70 };
    state.units.push(harborWorker);
    state.researched.push('trade');
    const fog = service.validate(state, harborWorker, 'harbor', harborPoint.x, harborPoint.y, false);
    water.revealed = true;
    water.owner = 'rival-city';
    const foreign = service.validate(state, harborWorker, 'harbor', harborPoint.x, harborPoint.y, false);
    water.owner = city.id;
    const valid = service.validate(state, harborWorker, 'harbor', harborPoint.x, harborPoint.y, false);
    const harbor = service.start(state, harborWorker.id, 'harbor', harborPoint.x, harborPoint.y, false);
    return { repaired, pillaged:tile.pillaged, doubleAct, fog:fog.reason,
      foreign:foreign.reason, valid:valid.ok, harbor,
      harborProject:harborWorker.workerProject, production:city.production };
  });
  expect(result.repaired).toEqual({ remaining:0, total:1 });
  expect(result.pillaged).toBe(false);
  expect(result.doubleAct).toBeNull();
  expect(result.fog).toContain('не разведана');
  expect(result.foreign).toContain('вне вашей территории');
  expect(result.valid).toBe(true);
  expect(result.harbor).toEqual({ remaining:2, total:3 });
  expect(result.harborProject).toEqual(expect.objectContaining({
    improvementId:'harbor', totalWorkerActions:3, remainingWorkerActions:2
  }));
  expect(result.production).toBe(0);
});

test('legacy worker project migrates on save load without a free action', async ({ page }) => {
  const result = await page.evaluate(() => {
    const debug = window.__epohiDebug(), state = debug.state, city = state.city;
    const point = window.EpohiUtils.neighborsOf(city.x, city.y, state.map.length)[0];
    const tile = state.map[point.y][point.x];
    Object.assign(tile, { terrain:'plains', revealed:true, owner:city.id,
      improvement:null, pillaged:false, camp:null, poi:null });
    state.units.push({ id:'legacy-worker', type:'worker', x:point.x, y:point.y,
      moves:1, acted:false, hp:70, maxHp:70,
      workerProject:{ type:'improvement', improvementId:'farm', x:point.x, y:point.y,
        totalTurns:2, remainingTurns:1, startedTurn:state.turn } });
    const loaded = debug.migrateState(JSON.parse(JSON.stringify(state)));
    const worker = loaded.units.find(unit => unit.id === 'legacy-worker');
    const migrated = { ...worker.workerProject };
    window.EpohiWorkerProjects.processTurn(loaded);
    const sameTurn = worker.workerProject.remainingWorkerActions;
    loaded.turn += 1;
    window.EpohiWorkerProjects.processTurn(loaded);
    return { migrated, sameTurn, improvement:loaded.map[point.y][point.x].improvement,
      project:worker.workerProject, acted:worker.acted };
  });
  expect(result.migrated).toEqual(expect.objectContaining({
    cityId:expect.any(String), totalWorkerActions:2, remainingWorkerActions:1,
    actionCostVersion:2
  }));
  expect(result.migrated).not.toHaveProperty('totalTurns');
  expect(result.sameTurn).toBe(1);
  expect(result.improvement).toBe('farm');
  expect(result.project).toBeNull();
  expect(result.acted).toBe(true);
});

test('worker selection survives inspection and harbor uses the visible context action', async ({ page }) => {
  const setup = await page.evaluate(() => {
    const debug = window.__epohiDebug(), state = debug.state, city = state.city;
    const points = window.EpohiUtils.neighborsOf(city.x, city.y, state.map.length);
    const workerPoint = points.find(point =>
      !state.units.some(unit => unit.x === point.x && unit.y === point.y));
    const harborPoint = points.find(point => !state.units.some(unit => unit.x === point.x && unit.y === point.y)
      && (point.x !== workerPoint.x || point.y !== workerPoint.y)
      && window.EpohiUtils.isAdjacent(workerPoint.x, workerPoint.y, point.x, point.y));
    Object.assign(state.map[workerPoint.y][workerPoint.x], {
      terrain:'plains', revealed:true, owner:city.id, improvement:null,
      pillaged:false, poi:null, camp:null
    });
    Object.assign(state.map[harborPoint.y][harborPoint.x], {
      terrain:'water', revealed:true, owner:city.id, improvement:null,
      pillaged:false, poi:null, camp:null
    });
    city.production = 0;
    state.resources.production = 0;
    state.researched.push('trade');
    state.units.push({ id:'ui-harbor-worker', name:'Тален', type:'worker',
      x:workerPoint.x, y:workerPoint.y, moves:1, acted:false, hp:70, maxHp:70 });
    debug.render();
    return { workerPoint, harborPoint, id:'ui-harbor-worker' };
  });
  const workerTile = page.locator(`.tile[data-x="${setup.workerPoint.x}"][data-y="${setup.workerPoint.y}"]`);
  await workerTile.locator('.piece.unit').last().click();
  await expect(page.locator('#contextTitle')).toContainText('Тален');
  await expect(page.locator('[data-worker-time-status]')).toContainText('Город:');
  await workerTile.click({ position:{ x:4, y:4 } });
  expect(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId())).toBe(setup.id);
  const harborTile = page.locator(`.tile[data-x="${setup.harborPoint.x}"][data-y="${setup.harborPoint.y}"]`);
  await harborTile.click({ position:{ x:4, y:4 } });
  const button = page.locator('[data-context-action="build-harbor"]');
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await button.click();
  expect(await page.evaluate(id => window.__epohiDebug().state.units
    .find(unit => unit.id === id).workerProject, setup.id)).toEqual(expect.objectContaining({
    improvementId:'harbor', totalWorkerActions:3, remainingWorkerActions:2
  }));
});

test('visible develop controls assign the chosen city and priority', async ({ page }) => {
  const setup = await page.evaluate(() => {
    const debug = window.__epohiDebug(), state = debug.state, city = state.city;
    state.cities.push({ ...city, id:'second-city', name:'Второй город',
      x:city.x + 3, y:city.y, capital:false, buildings:[], queue:null });
    const point = window.EpohiUtils.neighborsOf(city.x, city.y, state.map.length)
      .find(item => !state.units.some(unit => unit.x === item.x && unit.y === item.y));
    Object.assign(state.map[point.y][point.x], { terrain:'plains', revealed:true,
      owner:city.id, improvement:null, pillaged:false, camp:null, poi:null });
    state.units.push({ id:'city-choice-worker', name:'Городской рабочий', type:'worker',
      x:point.x, y:point.y, moves:1, acted:false, hp:70, maxHp:70 });
    debug.render();
    return point;
  });
  await page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"] .piece.unit`).last().click();
  const city = page.locator('.worker-priority-picker [data-worker-city]');
  await expect(city).toBeVisible();
  await city.selectOption('second-city');
  await page.locator('[data-path-action="worker-food"]').click();
  expect(await page.evaluate(() => window.__epohiDebug().state.units
    .find(unit => unit.id === 'city-choice-worker').order)).toEqual(expect.objectContaining({
    type:'develop', cityId:'second-city', priority:'food'
  }));
});
