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

  test('manual hill movement uses the routed terrain cost and waits for the second turn', async ({ page }) => {
    await ready(page,0);
    await page.evaluate(()=>{const gs=window.__epohiDebug().state,u=gs.units[0];u.x=5;u.y=5;u.moves=1;u.acted=false;gs.map[5][5].terrain='plains';gs.map[5][6].terrain='hill';gs.map[5][5].revealed=gs.map[5][6].revealed=true;window.__epohiDebug().render();});
    await page.locator('#map .tile[data-x="6"][data-y="5"]').click();
    await page.locator('[data-context-action="move"]').click();
    expect(await page.evaluate(()=>{const u=window.__epohiDebug().state.units[0];return{x:u.x,bank:u.travelOrder.movementBank};})).toEqual({x:5,bank:1});
    await page.getByRole('button',{name:/Завершить ход/i}).click(); await page.waitForFunction(()=>!window.__epohiDebug().isTurnProcessing());
    expect(await page.evaluate(()=>window.__epohiDebug().state.units[0].x)).toBe(6);
  });

  test('a blocked route does not accumulate movement credit', async ({ page }) => {
    await ready(page,0);
    const banks=await page.evaluate(()=>{const gs=window.__epohiDebug().state,u=gs.units[0];u.x=5;u.y=5;u.moves=1;u.acted=false;for(let y=4;y<=6;y++)for(let x=4;x<=6;x++){gs.map[y][x].terrain=x===5&&y===5?'plains':'water';gs.map[y][x].revealed=true;}u.travelOrder={version:2,type:'move',targetKind:'tile',x:7,y:5,status:'active',path:[],movementBank:0};const values=[];for(let turn=0;turn<4;turn++){window.EpohiHumansPathing.processUnit(gs,u,{render:false});values.push(u.travelOrder.movementBank);u.moves=1;u.acted=false;}return values;});
    expect(banks).toEqual([0,0,0,0]);
  });

  test('Treasury funding follows the selected non-capital city and stays live', async ({ page }) => {
    await ready(page,0);
    const cityId=await page.evaluate(()=>{const gs=window.__epohiDebug().state,cap=gs.cities[0],city={id:'review-city-2',name:'Новая гавань',x:cap.x+4,y:cap.y,population:2,food:0,production:3,buildings:[],queue:null,hp:150,maxHp:150};gs.cities.push(city);gs.resources.gold=100;window.__epohiDebug().setActiveCity(city.id);window.EpohiPlayerFeedback.openTreasury();window.EpohiCombatWorldStability.render();return city.id;});
    await expect(page.locator('[data-treasury-action="production"]')).toContainText('20');
    await expect(page.locator('#feedbackTreasuryContent')).toContainText('Новая гавань');
    await page.locator('[data-treasury-action="production"]').click();
    const result=await page.evaluate(id=>{const gs=window.__epohiDebug().state;return{second:gs.cities.find(c=>c.id===id).production,capital:gs.cities[0].production,gold:gs.resources.gold,text:document.querySelector('[data-administration-card]').textContent};},cityId);
    expect(result.second).toBe(15); expect(result.capital).not.toBe(15); expect(result.gold).toBe(80); expect(result.text).toContain('2/4');
  });

  test('AI claims a known finite POI first and the player cannot collect it twice', async ({ page }) => {
    await ready(page,1);
    const setup=await page.evaluate(()=>{const gs=window.__epohiDebug().state,civ=gs.rivals[0],ai=civ.units[0],player=gs.units[0];ai.type='scout';ai.x=5;ai.y=5;ai.moves=2;ai.acted=false;player.x=8;player.y=5;const tile=gs.map[5][6];tile.terrain='plains';tile.revealed=true;tile.poi={type:'depot',used:false};civ.explored['6,5']=true;gs.barbarians=[];window.__epohiDebug().render();return{x:6,y:5,before:civ.resources.science+civ.resources.gold+civ.resources.production};});
    await page.getByRole('button',{name:/Завершить ход/i}).click(); await page.waitForFunction(()=>!window.__epohiDebug().isTurnProcessing());
    const claimed=await page.evaluate(({x,y,before})=>{const gs=window.__epohiDebug().state,civ=gs.rivals[0],tile=gs.map[y][x],target=window.EpohiHumansPathing.targetFromTile(gs,x,y);return{used:tile.poi.used,targetKind:target.targetKind,gain:civ.resources.science+civ.resources.gold+civ.resources.production-before,events:gs.eventLog.map(e=>e.eventType)};},setup);
    expect(claimed.used).toBe(true); expect(claimed.targetKind).not.toBe('poi'); expect(claimed.gain).toBeGreaterThan(0); expect(claimed.events).toContain('point-of-interest-resolved');
  });

  test('three same-type stacked units keep distinct selection and orders', async ({ page }) => {
    await ready(page,0);
    const ids=await page.evaluate(()=>{const gs=window.__epohiDebug().state,base=gs.units[0],def=window.EpohiData.UNIT_DEFS.scout;gs.units=[0,1,2].map(i=>({id:'stack-scout-'+i,type:'scout',x:5,y:5,moves:def.maxMoves,acted:false,hp:def.maxHealth,maxHp:def.maxHealth,travelOrder:null}));[[5,5],[6,5],[5,6],[4,5]].forEach(([x,y])=>{gs.map[y][x].terrain='plains';gs.map[y][x].revealed=true;});window.__epohiDebug().render();return gs.units.map(u=>u.id);});
    for(const [x,y] of [[6,5],[5,6],[4,5]]){await page.locator('#map .tile[data-x="5"][data-y="5"]').click();await page.locator(`#map .tile[data-x="${x}"][data-y="${y}"]`).click();await page.locator('[data-context-action="move"]').click();}
    const positions=await page.evaluate(ids=>ids.map(id=>{const u=window.__epohiDebug().state.units.find(item=>item.id===id);return[u.x,u.y];}),ids);
    expect(new Set(positions.map(String)).size).toBe(3);
    await expect(page.locator('#contextActions [data-path-action]')).toHaveCount(0);
  });

  test('the sole city defender stays home before distant AI goals', async ({ page }) => {
    await ready(page,1);
    const before=await page.evaluate(()=>{const gs=window.__epohiDebug().state,civ=gs.rivals[0],city=civ.cities[0],warrior=civ.units.find(u=>u.type==='warrior')||civ.units[0];warrior.type='warrior';warrior.x=city.x;warrior.y=city.y;civ.units=[warrior];civ.relation='neutral';civ.resources.gold=0;civ.resources.production=0;city.queue={type:'unit',id:'worker',progress:0,cost:999,upfront:{}};gs.barbarians=[];return{id:warrior.id,x:city.x,y:city.y};});
    await page.getByRole('button',{name:/Завершить ход/i}).click(); await page.waitForFunction(()=>!window.__epohiDebug().isTurnProcessing());
    expect(await page.evaluate(({id,x,y})=>{const u=window.__epohiDebug().state.rivals[0].units.find(item=>item.id===id);return u.x===x&&u.y===y;},before)).toBe(true);
  });

  test('legacy major events receive stable unique IDs', async ({ page }) => {
    await ready(page,0);
    const ids=await page.evaluate(()=>{const gs=window.__epohiDebug().state;gs.eventLog=[{turn:2,eventType:'victory',text:'Победа'},{turn:2,eventType:'major-diplomatic-event',text:'Договор'}];window.EpohiCombatWorldStability.migrate(gs);const first=gs.eventLog.map(e=>e.eventId);window.EpohiCombatWorldStability.migrate(gs);return{first,second:gs.eventLog.map(e=>e.eventId)};});
    expect(new Set(ids.first).size).toBe(2); expect(ids.second).toEqual(ids.first); expect(ids.first.every(Boolean)).toBe(true);
  });
});
