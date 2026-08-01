const { test, expect } = require('@playwright/test');
const { clearStorage, createGame, watchConsole, expectNoConsoleProblems } = require('./helpers');

async function ready(page) {
  await page.waitForFunction(() => window.EpohiLivingCivilizations && window.__epohiDebug && window.__epohiDebug().state);
}

test.describe('Living Civilizations', () => {
  test('мигрирует дипломатию v1 и объясняет доверие, страх и обиды', async ({ page }) => {
    const problems = watchConsole(page); await clearStorage(page); await createGame(page, 2); await ready(page);
    const result = await page.evaluate(() => {
      const gs = window.__epohiDebug().state, civ = gs.rivals[0];
      delete civ.diplomacy.trust; delete civ.diplomacy.fear; delete civ.diplomacy.grievances; delete civ.diplomacy.memories;
      window.EpohiLivingCivilizations.migrate(gs);
      window.EpohiLivingCivilizations.changeRelationship(gs, civ, 'trust', 9, 'Ардена помогла отбить налёт');
      return { version: gs.diplomacySchemaVersion, diplomacy: civ.diplomacy, personality: civ.personality, strategy: civ.developmentStrategy };
    });
    expect(result.version).toBe(2); expect(result.diplomacy.trust).toBeGreaterThan(0); expect(result.diplomacy.fear).toBeGreaterThanOrEqual(0);
    expect(result.diplomacy.memories[0].reason).toContain('помогла'); expect(result.personality).toBeTruthy(); expect(result.strategy).toBeTruthy();
    await page.evaluate(() => { const gs=window.__epohiDebug().state; gs.openMapMode=true; gs.rivals.forEach(c=>c.met=true); window.EpohiStrategyUX.openDiplomacy(); });
    await expect(page.locator('.living-relation-details').first()).toContainText('Доверие');
    await expect(page.locator('.living-relation-details').first()).toContainText('Ардена помогла'); await expectNoConsoleProblems(problems);
  });

  test('ИИ предлагает торговлю, дар, союз, мир, угрозу и совместную войну', async ({ page }) => {
    await clearStorage(page); await createGame(page, 3); await ready(page);
    const types = await page.evaluate(() => {
      const api=window.EpohiLivingCivilizations, gs=window.__epohiDebug().state, civ=gs.rivals[0]; gs.diplomaticProposals=[];
      ['trade','gift','alliance','peace','threat','jointWar'].forEach((type,i)=>api.createProposal(gs,civ,type,'Предложение '+type,i===5?gs.rivals[1].civilizationId:null));
      return gs.diplomaticProposals.map(p=>p.type);
    });
    expect(new Set(types)).toEqual(new Set(['trade','gift','alliance','peace','threat','jointWar']));
    await expect(page.locator('#livingProposals')).toHaveClass(/show/); await expect(page.locator('#livingProposals')).toContainText('Предложение');
  });

  test('принятое предложение меняет отношения и попадает в летопись', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1); await ready(page);
    const before = await page.evaluate(() => { const api=window.EpohiLivingCivilizations,gs=window.__epohiDebug().state,c=gs.rivals[0]; c.met=true; const p=api.createProposal(gs,c,'trade','Выгодный путь'); return {id:p.id,gold:gs.resources.gold,trust:c.diplomacy.trust}; });
    await page.locator(`[data-proposal="${before.id}"][data-answer="yes"]`).click();
    const after = await page.evaluate(() => { const gs=window.__epohiDebug().state,c=gs.rivals[0]; return {gold:gs.resources.gold,trust:c.diplomacy.trust,status:gs.diplomaticProposals[0].status,events:gs.eventLog.map(e=>e.eventType)}; });
    expect(after.gold).toBe(before.gold+8); expect(after.trust).toBe(before.trust+7); expect(after.status).toBe('accepted'); expect(after.events).toContain('major-diplomatic-event');
  });

  test('союзник идёт к варварам и вступает в войну игрока', async ({ page }) => {
    await clearStorage(page); await createGame(page, 3); await ready(page);
    const result = await page.evaluate(() => {
      const gs=window.__epohiDebug().state, ally=gs.rivals[2], enemy=gs.rivals[0], unit=ally.units.find(u=>u.type!=='worker'&&u.type!=='settler'), city=gs.city||gs.cities[0];
      ally.relation='ally'; enemy.relation='war'; unit.x=city.x+2; unit.y=city.y; gs.barbarians=[{id:'help-target',x:city.x+1,y:city.y,hp:5,maxHp:40}];
      window.EpohiLivingCivilizations.alliedHelp(gs,ally,{distance:(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y)),stepToward:()=>false,attackBarbarian:(c,u,b)=>{b.hp-=10;if(b.hp<=0)gs.barbarians=gs.barbarians.filter(x=>x!==b);return true;},warAction:()=>true});
      return {barbarians:gs.barbarians.length,joint:ally.diplomacy[enemy.civilizationId],events:gs.eventLog.map(e=>e.eventType)};
    });
    expect(result.barbarians).toBe(0); expect(result.joint).toBe('war'); expect(result.events).toContain('allied-battle'); expect(result.events).toContain('joint-war-declared');
  });

  test('дипломатический ИИ выполняется внутри обычного завершения хода', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1); await ready(page);
    await page.evaluate(() => {
      const gs=window.__epohiDebug().state,civ=gs.rivals[0];
      gs.turn=4; civ.met=true; civ.diplomacy.grievances=60; gs.diplomaticProposals=[];
      window.__epohiDebug().endTurn();
    });
    await page.waitForFunction(() => !window.__epohiDebug().isTurnProcessing());
    const result=await page.evaluate(() => ({turn:window.__epohiDebug().state.turn,proposals:window.__epohiDebug().state.diplomaticProposals}));
    expect(result.turn).toBe(5); expect(result.proposals.some(item => item.type === 'threat')).toBe(true);
    await expect(page.locator('#livingProposals')).toHaveClass(/show/);
  });

  test('обычный ИИ и союзная помощь делят единый бюджет действий', async ({ page }) => {
    await clearStorage(page); await createGame(page, 3); await ready(page);
    await page.evaluate(() => {
      const gs=window.__epohiDebug().state,defs=window.EpohiData.UNIT_DEFS;
      gs.rivals.forEach((civ,index) => { while(civ.units.length<9)civ.units.push({id:`budget-${index}-${civ.units.length}`,civilizationId:civ.civilizationId,type:'warrior',x:civ.cities[0].x,y:civ.cities[0].y,moves:1,acted:false,hp:defs.warrior.maxHealth,maxHp:defs.warrior.maxHealth}); });
      gs.rivals[2].relation='ally';
    });
    await page.getByRole('button', { name: /Завершить ход/i }).click();
    await page.waitForFunction(() => !window.__epohiDebug().isTurnProcessing());
    const budget=await page.evaluate(() => window.__epohiDebug().state.lastAiActionBudget);
    expect(budget.used).toBeLessThanOrEqual(budget.limit); expect(budget.remaining).toBe(budget.limit-budget.used);
  });

  test('война ИИ взаимна, а атакованная сторона отвечает', async ({ page }) => {
    await clearStorage(page); await createGame(page, 2); await ready(page);
    const before=await page.evaluate(() => {
      const gs=window.__epohiDebug().state,[a,b]=gs.rivals,au=a.units.find(u=>u.type==='warrior'),bu=b.units.find(u=>u.type==='warrior');
      a.diplomacy[b.civilizationId]='war'; delete b.diplomacy[a.civilizationId]; au.x=5;au.y=5;bu.x=6;bu.y=5;gs.map[5][5].terrain='plains';gs.map[5][6].terrain='plains';
      return {a:a.civilizationId,b:b.civilizationId,aHp:au.hp,bHp:bu.hp};
    });
    await page.getByRole('button', { name: /Завершить ход/i }).click(); await page.waitForFunction(() => !window.__epohiDebug().isTurnProcessing());
    const after=await page.evaluate(({a,b}) => {const gs=window.__epohiDebug().state,x=gs.rivals.find(c=>c.civilizationId===a),y=gs.rivals.find(c=>c.civilizationId===b);return {ab:x.diplomacy[b],ba:y.diplomacy[a],aHp:x.units[0]&&x.units[0].hp,bHp:y.units[0]&&y.units[0].hp,events:gs.eventLog.map(e=>e.eventType)};},before);
    expect(after.ab).toBe('war');expect(after.ba).toBe('war');expect(after.events).toContain('rival-battle');
  });

  test('личности меняют реальный выбор производства', async ({ page }) => {
    await clearStorage(page); await createGame(page, 2); await ready(page);
    await page.evaluate(() => {const [zarr,velm]=window.__epohiDebug().state.rivals;[zarr,velm].forEach(c=>{c.cities.forEach(city=>city.queue=null);c.units=c.units.filter(u=>u.type==='scout');c.resources.production=0;c.resources.gold=100;});});
    await page.getByRole('button', { name: /Завершить ход/i }).click();await page.waitForFunction(() => !window.__epohiDebug().isTurnProcessing());
    const queues=await page.evaluate(() => window.__epohiDebug().state.rivals.map(c=>({culture:c.cultureKey,type:c.cities[0].queue&&c.cities[0].queue.id,goal:c.strategicGoal})));
    expect(queues.find(c=>c.culture==='zarr').type).toBe('warrior');expect(queues.find(c=>c.culture==='velm').type).toBe('settler');
  });

  test('маршрутная атака создаёт память и видимый знак события', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1); await ready(page);
    const result=await page.evaluate(() => {const gs=window.__epohiDebug().state,civ=gs.rivals[0],unit=gs.units.find(u=>u.type==='warrior')||gs.units[0],enemy=civ.units.find(u=>u.type==='warrior');civ.relation='war';unit.x=5;unit.y=5;unit.moves=2;unit.acted=false;enemy.x=6;enemy.y=5;gs.map[5][5].terrain='plains';gs.map[5][6].terrain='plains';gs.map[5][5].revealed=true;gs.map[5][6].revealed=true;window.__epohiDebug().render();const target=window.EpohiHumansPathing.targetFromTile(gs,6,5);return {assigned:window.EpohiHumansPathing.assignTravelOrder(unit.id,target),civId:civ.civilizationId};});
    expect(result.assigned).toBe(true);await page.waitForFunction(id=>window.__epohiDebug().state.rivals.find(c=>c.civilizationId===id).diplomacy.memories.some(m=>m.reason.includes('атаковала')),result.civId);
    await expect(page.locator('#map .world-event-pulse')).toBeVisible();
  });
});
