const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');
  await page.waitForFunction(() => Boolean(window.EpohiMovement && window.EpohiHumansPathing));
});

async function openPlainMap(page, type = 'scout') {
  return page.evaluate(type => {
    const debug = window.__epohiDebug(), state = debug.state;
    state.openMapMode = true;
    state.rivals = [];
    state.barbarians = [];
    state.map.forEach(row => row.forEach(tile => {
      tile.terrain = 'plains'; tile.revealed = true; tile.camp = null;
      tile.poi = null; tile.feature = null;
    }));
    const unit = state.units[0];
    state.units = [unit];
    Object.assign(unit, { type, x:5, y:5, moves:window.EpohiData.UNIT_DEFS[type].maxMoves,
      acted:false, travelOrder:null, order:null });
    debug.render();
    return unit.id;
  }, type);
}

test('one MP units cross two plains and spend exactly one MP on forest or hill', async ({ page }) => {
  await openPlainMap(page);
  const result = await page.evaluate(() => {
    const state = window.__epohiDebug().state;
    const movement = window.EpohiMovement;
    const rules = {
      passableTile:window.EpohiUtils.passableTile,
      barbarianAt:() => null, campAt:() => null, rivalUnitAt:() => null,
      rivalCityAt:() => null, revealAround:() => {}, scoutSight:() => 1,
      allowTravelOrder:false
    };
    const outcomes = {};
    for (const type of ['worker', 'warrior', 'settler']) {
      const unit = state.units[0];
      Object.assign(unit, { type, x:5, y:5, moves:1, acted:false });
      const service = window.EpohiPlayerExploration.create(state, rules);
      const first = service.move(unit, 6, 5);
      const half = unit.moves;
      const second = service.move(unit, 7, 5);
      const third = service.move(unit, 8, 5);
      outcomes[type] = { first:first && first.kind, half, second:second && second.kind,
        third, x:unit.x, moves:unit.moves, acted:unit.acted };
    }
    for (const terrain of ['forest', 'hill']) {
      const unit = state.units[0];
      Object.assign(unit, { type:'worker', x:5, y:5, moves:1, acted:false });
      state.map[5][6].terrain = terrain;
      const service = window.EpohiPlayerExploration.create(state, rules);
      service.move(unit, 6, 5);
      outcomes[terrain] = { moves:unit.moves, acted:unit.acted, next:service.move(unit, 7, 5) };
      state.map[5][6].terrain = 'plains';
    }
    const unit = state.units[0];
    Object.assign(unit, { x:5, y:5, moves:0.5, acted:false });
    state.map[5][6].terrain = 'forest';
    outcomes.insufficient = { move:window.EpohiPlayerExploration.create(state, rules).move(unit, 6, 5),
      x:unit.x, moves:unit.moves };
    outcomes.formatted = [movement.format(1), movement.format(0.5)];
    return outcomes;
  });
  for (const type of ['worker', 'warrior', 'settler']) {
    expect(result[type]).toEqual({ first:'moved', half:0.5, second:'moved',
      third:null, x:7, moves:0, acted:false });
  }
  for (const terrain of ['forest', 'hill']) {
    expect(result[terrain]).toEqual({ moves:0, acted:false, next:null });
  }
  expect(result.insufficient).toEqual({ move:null, x:5, moves:0.5 });
  expect(result.formatted).toEqual(['1', '0.5']);
});

test('scout spends two MP across four plains and a mixed 0.5 + 1 + 0.5 path', async ({ page }) => {
  const id = await openPlainMap(page);
  const result = await page.evaluate(id => {
    const state = window.__epohiDebug().state, unit = state.units[0], pathing = window.EpohiHumansPathing;
    const plainPath = pathing.findPath(state, unit, { x:9, y:5 });
    const plainCost = pathing.pathCost(state, unit, plainPath);
    const plainEta = pathing.estimatePathTurns(state, unit, plainPath);
    pathing.assignTravelOrder(id, { type:'move', targetKind:'tile', x:9, y:5 });
    const afterPlains = { x:unit.x, moves:unit.moves, acted:unit.acted, order:unit.travelOrder };
    Object.assign(unit, { x:5, y:5, moves:2, acted:false, travelOrder:null });
    state.map.forEach(row => row.forEach(tile => { tile.terrain = 'water'; }));
    [5, 6, 8].forEach(x => { state.map[5][x].terrain = 'plains'; });
    state.map[5][7].terrain = 'forest';
    const mixedPath = [{ x:6, y:5 }, { x:7, y:5 }, { x:8, y:5 }];
    const mixedCost = pathing.pathCost(state, unit, mixedPath);
    pathing.assignTravelOrder(id, { type:'move', targetKind:'tile', x:8, y:5 });
    return { plainCost, plainEta, afterPlains, mixedCost,
      afterMixed:{ x:unit.x, moves:unit.moves, acted:unit.acted, order:unit.travelOrder } };
  }, id);
  expect(result.plainCost).toBe(2);
  expect(result.plainEta).toBe(0);
  expect(result.afterPlains).toEqual({ x:9, moves:0, acted:true, order:null });
  expect(result.mixedCost).toBe(2);
  expect(result.afterMixed).toEqual({ x:8, moves:0, acted:true, order:null });
});

test('route remainder survives completion, cancellation and reassignment without a free step', async ({ page }) => {
  const id = await openPlainMap(page);
  const result = await page.evaluate(id => {
    const state = window.__epohiDebug().state, unit = state.units[0], pathing = window.EpohiHumansPathing;
    pathing.assignTravelOrder(id, { type:'move', targetKind:'tile', x:8, y:5 });
    const afterFirst = { x:unit.x, moves:unit.moves };
    pathing.assignTravelOrder(id, { type:'move', targetKind:'tile', x:10, y:5 });
    const waiting = { x:unit.x, bank:unit.travelOrder.movementBank, moves:unit.moves };
    pathing.cancelTravelOrder(id);
    const cancelled = { x:unit.x, moves:unit.moves, acted:unit.acted };
    pathing.assignTravelOrder(id, { type:'move', targetKind:'tile', x:10, y:5 });
    const reassigned = { x:unit.x, bank:unit.travelOrder.movementBank, moves:unit.moves };
    return { afterFirst, waiting, cancelled, reassigned };
  }, id);
  expect(result).toEqual({ afterFirst:{ x:8, moves:0.5 }, waiting:{ x:9, bank:0, moves:0 },
    cancelled:{ x:9, moves:0, acted:true }, reassigned:{ x:9, bank:0, moves:0 } });
});

test('paid movement bank transfers on cancellation and reassignment of a costly route', async ({ page }) => {
  const id = await openPlainMap(page);
  const result = await page.evaluate(id => {
    const state = window.__epohiDebug().state, unit = state.units[0], pathing = window.EpohiHumansPathing;
    state.map[5][6].terrain = 'swamp';
    state.map.forEach((row, y) => row.forEach((tile, x) => {
      if (x !== 5 && x !== 6 || y !== 5) tile.terrain = 'water';
    }));
    pathing.assignTravelOrder(id, { type:'move', targetKind:'tile', x:6, y:5 });
    const waiting = { x:unit.x, bank:unit.travelOrder.movementBank, moves:unit.moves };
    pathing.cancelTravelOrder(id);
    const cancelled = { moves:unit.moves, acted:unit.acted };
    pathing.assignTravelOrder(id, { type:'move', targetKind:'tile', x:6, y:5 });
    const reassigned = { x:unit.x, bank:unit.travelOrder.movementBank, moves:unit.moves };
    unit.moves = 2; unit.acted = false;
    pathing.processUnit(state, unit, { render:false });
    return { waiting, cancelled, reassigned,
      completed:{ x:unit.x, moves:unit.moves, order:unit.travelOrder } };
  }, id);
  expect(result).toEqual({ waiting:{ x:5, bank:2, moves:0 },
    cancelled:{ moves:2, acted:false }, reassigned:{ x:5, bank:2, moves:0 },
    completed:{ x:6, moves:1, order:null } });
});

test('autonomous guard uses fractional costs and waits with 0.5 MP before forest', async ({ page }) => {
  const id = await openPlainMap(page, 'warrior');
  const result = await page.evaluate(id => {
    const state = window.__epohiDebug().state, unit = state.units[0];
    state.map.forEach(row => row.forEach(tile => { tile.terrain = 'water'; }));
    [5, 6, 8, 9].forEach(x => { state.map[5][x].terrain = 'plains'; });
    state.map[5][7].terrain = 'forest';
    window.EpohiHumansAutonomy.assignOrder(id, 'guard', { x:9, y:5, radius:2 });
    window.EpohiHumansAutonomy.processOrders(state);
    const first = { x:unit.x, moves:unit.moves, reason:unit.order.reason };
    unit.moves = 1; unit.acted = false;
    window.EpohiHumansAutonomy.processOrders(state);
    return { first, second:{ x:unit.x, moves:unit.moves } };
  }, id);
  expect(result.first).toMatchObject({ x:6, moves:0.5 });
  expect(result.first.reason).toContain('недостаточно очков');
  expect(result.second).toEqual({ x:7, moves:0 });
});

test('unrevealed terrain uses neutral planning cost and waits when revealed cost is higher', async ({ page }) => {
  const id = await openPlainMap(page);
  const result = await page.evaluate(id => {
    const state = window.__epohiDebug().state, unit = state.units[0], pathing = window.EpohiHumansPathing;
    state.openMapMode = false;
    Object.assign(state.map[5][6], { terrain:'swamp', revealed:false });
    const unknownCost = pathing.movementCost(state, unit, { x:6, y:5 });
    const path = pathing.findPath(state, unit, { x:6, y:5 });
    pathing.assignTravelOrder(id, { type:'move', targetKind:'tile', x:6, y:5 });
    const afterReveal = { x:unit.x, moves:unit.moves, bank:unit.travelOrder.movementBank,
      revealed:state.map[5][6].revealed, reason:unit.travelOrder.reason };
    unit.moves = 2; unit.acted = false;
    pathing.processUnit(state, unit, { render:false });
    return { unknownCost, plannedCost:pathing.pathCost(state, unit, path), afterReveal,
      afterNext:{ x:unit.x, moves:unit.moves, acted:unit.acted, order:unit.travelOrder } };
  }, id);
  expect(result.unknownCost).toBe(1);
  expect(result.afterReveal).toMatchObject({ x:5, moves:0, bank:2, revealed:true });
  expect(result.afterReveal.reason).toContain('пересчитан');
  expect(result.afterNext).toEqual({ x:6, moves:1, acted:false, order:null });
});

test('manual command does not disclose hidden terrain before route execution', async ({ page }) => {
  await openPlainMap(page, 'warrior');
  const result = await page.evaluate(() => {
    const state = window.__epohiDebug().state, unit = state.units[0];
    state.openMapMode = false;
    const rules = { passableTile:window.EpohiUtils.passableTile,
      barbarianAt:() => null, campAt:() => null, rivalUnitAt:() => null,
      rivalCityAt:() => null, allowTravelOrder:true };
    const service = window.EpohiPlayerExploration.create(state, rules);
    const tile = state.map[5][6];
    tile.revealed = false; tile.terrain = 'water';
    const water = { allowed:service.canMove(unit, 6, 5), result:service.move(unit, 6, 5) };
    tile.terrain = 'swamp';
    const swamp = { allowed:service.canMove(unit, 6, 5), result:service.move(unit, 6, 5) };
    return { water, swamp, x:unit.x, moves:unit.moves, revealed:tile.revealed };
  });
  expect(result).toEqual({ water:{ allowed:true, result:{ kind:'travel-order' } },
    swamp:{ allowed:true, result:{ kind:'travel-order' } },
    x:5, moves:1, revealed:false });
});

test('fractional moves and route bank survive save migration; attack still ends movement', async ({ page }) => {
  const id = await openPlainMap(page, 'warrior');
  const result = await page.evaluate(id => {
    const debug = window.__epohiDebug(), state = debug.state, unit = state.units[0];
    unit.moves = 0.5;
    unit.travelOrder = { version:2, type:'move', targetKind:'tile', x:7, y:5,
      status:'waiting', movementBank:0.5, path:[] };
    const loaded = debug.migrateState(JSON.parse(JSON.stringify(state)));
    const saved = loaded.units.find(item => item.id === id);
    unit.travelOrder = null; unit.moves = 0.5; unit.acted = false;
    state.map[5][6].camp = { campId:'fractional-camp', hp:1 };
    const attacked = window.EpohiHumansPathing.assignTravelOrder(id,
      window.EpohiHumansPathing.targetFromTile(state, 6, 5));
    return { saved:{ moves:saved.moves, bank:saved.travelOrder.movementBank },
      attack:{ attacked, moves:unit.moves, acted:unit.acted } };
  }, id);
  expect(result.saved).toEqual({ moves:0.5, bank:0.5 });
  expect(result.attack).toEqual({ attacked:true, moves:0, acted:true });
});

test('unit and tile inspection show fractional movement without trailing decimal zero', async ({ page }) => {
  await openPlainMap(page, 'warrior');
  await page.evaluate(() => {
    const debug = window.__epohiDebug(), state = debug.state;
    state.units[0].moves = 0.5;
    debug.render();
  });
  await page.locator('.tile[data-x="5"][data-y="5"] .piece.unit').last().click();
  await expect(page.locator('#contextText')).toContainText('0.5 / 1');
  await page.locator('.tile[data-x="6"][data-y="5"]').click({ position:{ x:4, y:4 } });
  await expect(page.locator('#contextText')).toContainText('движение: 0.5 очк.');
});
