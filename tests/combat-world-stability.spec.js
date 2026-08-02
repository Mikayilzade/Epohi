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

  test('visible city attack collapses a rival and transfers all cities', async ({ page }) => {
    await ready(page, 2);
    const setup = await page.evaluate(() => {
      const gs=window.__epohiDebug().state, loser=gs.rivals[0], observer=gs.rivals[1];
      const attacker=gs.units.find(unit=>unit.type==='warrior')||gs.units[0], capital=loser.cities[0];
      attacker.type='warrior'; attacker.x=5; attacker.y=5; attacker.moves=1; attacker.acted=false; attacker.hp=100; attacker.maxHp=100;
      Object.assign(capital,{x:6,y:5,hp:1,maxHp:180,capital:true}); loser.units=[]; loser.relation='war'; loser.met=true;
      gs.map[5][5].terrain='plains'; gs.map[5][6].terrain='plains'; gs.map[5][5].revealed=true; gs.map[5][6].revealed=true;
      loser.cities.push({id:'captured-second',name:'Второй',x:8,y:8,population:2,hp:150,maxHp:150,buildings:[],queue:null});
      observer.diplomacy[loser.civilizationId]='war';
      gs.diplomaticProposals=[{id:'collapse-proposal',type:'peace',civId:loser.civilizationId,status:'pending'}];
      gs.tradeRoutes=[{id:'collapse-trade',civId:loser.civilizationId,status:'active',remainingTurns:4}];
      window.__epohiDebug().render(); return {civId:loser.civilizationId,transferred:loser.cities.length};
    });
    await page.locator('#map .tile[data-x="6"][data-y="5"]').click();
    await expect(page.locator('[data-context-action="attack"]')).toContainText('Атаковать');
    await page.locator('[data-context-action="attack"]').click();
    const result=await page.evaluate(({civId})=>{const gs=window.__epohiDebug().state,loser=gs.rivals.find(c=>c.civilizationId===civId);return{defeated:loser.defeated,cities:gs.cities.filter(c=>c.formerCivilizationId===civId).length,proposal:gs.diplomaticProposals[0].status,trade:gs.tradeRoutes[0].status,event:gs.eventLog[0].eventType};},setup);
    expect(result).toMatchObject({defeated:true,cities:setup.transferred,proposal:'cancelled',trade:'cancelled',event:'capital-fallen'});
    await expect(page.locator('#stabilityMajorModal')).toHaveClass(/show/);
    await page.locator('[data-stability-close="major"]').click();
    await expect(page.locator('#stabilityMajorModal')).not.toHaveClass(/show/);
  });

  test('turn-driven era decision is immediate, persistent when closed, and city-bound', async ({ page }) => {
    await ready(page, 0);
    const ids = await page.evaluate(() => {
      const gs=window.__epohiDebug().state, city=gs.cities[0]; city.production=0; gs.resources.gold=20; gs.turn=5;
      window.EpohiHumansJourney.sync({render:false});
      return {city:city.id};
    });
    await expect(page.locator('#stabilityDecisionModal')).toHaveClass(/show/);
    await page.locator('[data-stability-close="decision"]').click();
    await expect(page.locator('#urgentDecisionIndicator')).toHaveClass(/show/);
    await page.locator('#urgentDecisionIndicator').click();
    await page.locator('[data-option-id="hire"]').click();
    const resolved = await page.evaluate(({city}) => { const gs=window.__epohiDebug().state; return {production:gs.cities.find(c=>c.id===city).production,status:gs.urgentDecisions[0].status}; }, ids);
    expect(resolved).toEqual({production:18,status:'resolved'});
  });

  test('enemy selected from the map exposes and resolves a visible unit attack', async ({ page }) => {
    await ready(page, 1);
    const enemyId=await page.evaluate(()=>{const gs=window.__epohiDebug().state,civ=gs.rivals[0],attacker=gs.units[0],enemy=civ.units[0];attacker.type='warrior';attacker.x=5;attacker.y=5;attacker.moves=1;attacker.acted=false;enemy.x=6;enemy.y=5;enemy.hp=1;civ.relation='war';civ.met=true;gs.map[5][5].terrain=gs.map[5][6].terrain='plains';gs.map[5][5].revealed=gs.map[5][6].revealed=true;window.__epohiDebug().render();return enemy.id;});
    await page.locator('#map .tile[data-x="6"][data-y="5"]').click();
    await expect(page.locator('[data-context-action="attack"]')).toContainText('Атаковать');
    await page.locator('[data-context-action="attack"]').click();
    expect(await page.evaluate(id=>window.__epohiDebug().state.rivals[0].units.some(unit=>unit.id===id),enemyId)).toBe(false);
  });

  test('Treasury visibly expands administration with an escalating price', async ({ page }) => {
    await ready(page, 0);
    const before=await page.evaluate(()=>{const gs=window.__epohiDebug().state;gs.resources.gold=500;window.EpohiPlayerFeedback.openTreasury();window.EpohiCombatWorldStability.render();return{capacity:gs.cityCapacity,cost:window.EpohiCombatWorldStability.administrationCost(gs)};});
    await page.locator('[data-expand-administration]').click();
    const result=await page.evaluate(()=>{const gs=window.__epohiDebug().state;return{capacity:gs.cityCapacity,cost:window.EpohiCombatWorldStability.administrationCost(gs),gold:gs.resources.gold};});
    expect(result.capacity).toBe(before.capacity + 1);
    expect(result.cost).toBe(before.cost + 40);
    expect(result.gold).toBe(500 - before.cost);
  });
});
