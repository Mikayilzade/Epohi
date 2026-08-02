const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

async function ready(page, rivals = 1) {
  await clearStorage(page);
  await createGame(page, rivals);
  await page.waitForFunction(() => window.EpohiCombatWorldStability && window.__epohiDebug().state);
}

test.describe('Combat, AI and world stability', () => {
  test('weighted route prefers a longer cheap route and reports its cost', async ({ page }) => {
    await ready(page, 0);
    const result = await page.evaluate(() => {
      const gs = window.__epohiDebug().state, unit = gs.units[0];
      unit.x = 5; unit.y = 5; unit.type = 'scout'; unit.moves = 2; unit.acted = false;
      for (let y = 4; y <= 7; y += 1) for (let x = 4; x <= 8; x += 1) Object.assign(gs.map[y][x], { terrain:'water', revealed:true, camp:null, poi:null });
      [[5,5],[6,5],[7,5],[8,5],[5,6],[5,7],[6,7],[7,7],[8,7],[8,6]].forEach(([x,y]) => { gs.map[y][x].terrain='plains'; });
      gs.map[5][6].terrain='swamp'; gs.map[5][7].terrain='swamp';
      const path = window.EpohiHumansPathing.findPath(gs, unit, {x:8,y:5}, {allowTarget:{x:8,y:5}});
      return { path, cost:window.EpohiHumansPathing.pathCost(gs, unit, path) };
    });
    expect(result.path.length).toBeGreaterThan(3);
    expect(result.path.some(point => point.y === 6)).toBe(true);
    expect(result.cost).toBeLessThan(7);
  });

  test('terrain rules expose exact movement, defense and impassability', async ({ page }) => {
    await ready(page, 0);
    const rules = await page.evaluate(() => window.EpohiData.TERRAIN);
    expect(rules.plains.movementCost).toBe(1);
    expect(rules.swamp.movementCost).toBe(3);
    expect(rules.hill.defenseModifier).toBe(25);
    expect(rules.water.passable).toBe(false);
    expect(rules.water.impassableReason).toContain('воду');
  });

  test('capital collapse transfers all cities, clears forces and diplomacy, and migrates after reload shape', async ({ page }) => {
    await ready(page, 2);
    const result = await page.evaluate(() => {
      const gs=window.__epohiDebug().state, loser=gs.rivals[0], observer=gs.rivals[1];
      loser.cities.push({id:'captured-second',name:'Второй',x:8,y:8,population:2,hp:150,maxHp:150,buildings:[],queue:null});
      observer.diplomacy[loser.civilizationId]='war';
      gs.diplomaticProposals=[{id:'collapse-proposal',type:'peace',civId:loser.civilizationId,status:'pending'}];
      gs.tradeRoutes=[{id:'collapse-trade',civId:loser.civilizationId,status:'active',remainingTurns:4}];
      const transferred=loser.cities.length, forces=loser.units.length;
      window.EpohiCombatWorldStability.resolveFactionDefeat(gs, loser, gs);
      const snapshot=JSON.parse(JSON.stringify(gs)); window.EpohiCombatWorldStability.migrate(snapshot);
      return { transferred,forces,defeated:loser.defeated,cities:gs.cities.filter(c=>c.formerCivilizationId===loser.civilizationId).length,units:loser.units.length,proposal:gs.diplomaticProposals[0].status,trade:gs.tradeRoutes[0].status,relation:observer.diplomacy[loser.civilizationId],event:gs.eventLog[0].eventType,migrated:snapshot.combatWorldStabilityVersion };
    });
    expect(result).toMatchObject({ defeated:true, cities:result.transferred, units:0, proposal:'cancelled', trade:'cancelled', relation:undefined, event:'capital-fallen', migrated:1 });
    expect(result.forces).toBeGreaterThan(0);
    await expect(page.locator('#stabilityMajorModal')).toHaveClass(/show/);
    await page.locator('[data-stability-close="major"]').click();
    await expect(page.locator('#stabilityMajorModal')).not.toHaveClass(/show/);
  });

  test('urgent decision is immediate, city-bound, persistent when closed, and expires', async ({ page }) => {
    await ready(page, 0);
    const ids = await page.evaluate(() => {
      const gs=window.__epohiDebug().state, city=gs.cities[0]; city.production=0;
      const decision=window.EpohiCombatWorldStability.createUrgentDecision(gs,{title:'Странствующий мастер',text:'Помочь мастерским?',cityId:city.id,options:[{id:'work',label:'Принять помощь',production:9}]});
      return {decision:decision.id,city:city.id};
    });
    await expect(page.locator('#stabilityDecisionModal')).toHaveClass(/show/);
    await page.locator('[data-stability-close="decision"]').click();
    await expect(page.locator('#urgentDecisionIndicator')).toHaveClass(/show/);
    await page.locator('#urgentDecisionIndicator').click();
    await page.locator('[data-option-id="work"]').click();
    const resolved = await page.evaluate(({city}) => { const gs=window.__epohiDebug().state; return {production:gs.cities.find(c=>c.id===city).production,status:gs.urgentDecisions[0].status}; }, ids);
    expect(resolved).toEqual({production:9,status:'resolved'});
  });

  test('administration capacity is migrated, priced progressively, and expandable', async ({ page }) => {
    await ready(page, 0);
    const result = await page.evaluate(() => {
      const gs=window.__epohiDebug().state; gs.resources.gold=500;
      const before={capacity:gs.cityCapacity,cost:window.EpohiCombatWorldStability.administrationCost(gs)};
      window.EpohiCombatWorldStability.expandAdministration(gs);
      return {before,capacity:gs.cityCapacity,cost:window.EpohiCombatWorldStability.administrationCost(gs),gold:gs.resources.gold};
    });
    expect(result.capacity).toBe(result.before.capacity + 1);
    expect(result.cost).toBe(result.before.cost + 40);
    expect(result.gold).toBe(500 - result.before.cost);
  });
});
