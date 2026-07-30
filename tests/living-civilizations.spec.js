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
      window.EpohiLivingCivilizations.changeRelationship(civ, 'trust', 9, 'Ардена помогла отбить налёт');
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
      window.EpohiLivingCivilizations.alliedHelp(gs,ally);
      return {barbarians:gs.barbarians.length,joint:ally.diplomacy[enemy.civilizationId],events:gs.eventLog.map(e=>e.eventType)};
    });
    expect(result.barbarians).toBe(0); expect(result.joint).toBe('war'); expect(result.events).toContain('allied-battle'); expect(result.events).toContain('joint-war-declared');
  });
});
