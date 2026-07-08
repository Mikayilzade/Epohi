const { test, expect } = require("@playwright/test");
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require("./helpers");



test.describe('v1.4.4 review fixes for living camps', () => {
  test('barbarian activity off keeps target zero and never creates camps', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Новая игра' }).click();
    await page.locator('#partySize').selectOption('small');
    await page.locator('#barbarianActivity').selectOption('off');
    await page.locator('#rivalCount').selectOption('0');
    await page.locator('#partyName').fill(`No barbarians ${Date.now()}`);
    await page.getByRole('button', { name: 'Создать мир' }).click();
    await expect(page.locator('#gameApp')).toBeVisible();
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state; s.turn=50; s.barbarianDirector.nextCampSpawnTurn=50; s.barbarianDirector.lastMaintenanceTurn=null; return { target:d.targetActiveCampCount(s), before:d.activeCampEntries(s).length, spawned:!!d.maintainBarbarianCamps(s,()=>0), after:d.activeCampEntries(s).length, next:s.barbarianDirector.nextCampSpawnTurn }; });
    expect(r).toEqual({ target:0, before:0, spawned:false, after:0, next:null });
  });

  test('hidden replacement camp on previously revealed tile is not rendered or inspectable until current vision returns', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const setup = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state; d.activeCampEntries(s).forEach(c=>s.map[c.y][c.x].camp=null); const x=1,y=1,t=s.map[y][x]; t.terrain='plains'; t.revealed=true; t.owner=null; t.poi=null; t.improvement=null; t.feature=null; t.resource=null; t.camp={campId:'hidden-camp',hp:140,maxHp:140,nextSpawn:8,discoveredByPlayer:false,discoveredByCivs:{}}; d.render(); return {x,y}; });
    await page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"]`).click();
    await expect(page.locator('#contextActions')).not.toContainText('Лагерь');
    const hidden = await page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"] .piece.camp`).count();
    expect(hidden).toBe(0);
    const shown = await page.evaluate(({x,y}) => { const d=window.__epohiDebug(), s=d.state, scout=s.units.find(u=>u.type==='scout')||s.units[0]; scout.x=x+1; scout.y=y; d.updateCampDiscovery(s); d.render(); return { known:d.playerKnowsCamp(s,x,y) }; }, setup);
    expect(shown.known).toBeTruthy();
    await expect(page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"] .piece.camp`)).toHaveCount(1);
  });

  test('AI ignores a previously explored but currently undiscovered hidden camp', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, civ=s.rivals[0]; d.activeCampEntries(s).forEach(c=>s.map[c.y][c.x].camp=null); let spot=null; for(let y=0;y<s.mapSize&&!spot;y++) for(let x=0;x<s.mapSize&&!spot;x++){ const t=s.map[y][x]; if(t.terrain==='water'||d.currentRivalSeesTile(civ,x,y)) continue; const far=(civ.cities||[]).concat(civ.units||[]).every(o=>Math.max(Math.abs(o.x-x),Math.abs(o.y-y))>=5); if(far) spot={x,y}; } const {x,y}=spot; const t=s.map[y][x]; t.terrain='plains'; t.owner=null; t.poi=null; t.improvement=null; t.feature=null; t.resource=null; t.camp={campId:'ai-hidden',hp:140,maxHp:140,nextSpawn:8,discoveredByPlayer:false,discoveredByCivs:{}}; civ.explored[`${x},${y}`]=true; civ.visible={}; d.chooseAiGoal(civ); const before={knows:d.civKnowsCamp(civ,x,y), goal:civ.strategicGoal}; const scout=(civ.units||[])[0]; scout.x=x+1; scout.y=y; d.updateCampDiscovery(s); return { before, after:d.civKnowsCamp(civ,x,y) }; });
    expect(r.before.knows).toBeFalsy();
    expect(r.before.goal).not.toBe('уничтожение варварского лагеря');
    expect(r.after).toBeTruthy();
  });

  test('replacement camp excludes the last destroyed tile when another candidate exists', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state; d.activeCampEntries(s).forEach(c=>s.map[c.y][c.x].camp=null); for(let y=0;y<s.mapSize;y++) for(let x=0;x<s.mapSize;x++){ const t=s.map[y][x]; t.terrain='water'; t.camp=null; t.owner=null; t.poi=null; t.improvement=null; t.feature=null; t.resource=null; t.revealed=false; }
      const cap=s.city; for(let x=cap.x;x<=18;x++) s.map[18][x].terrain='plains'; for(let y=cap.y;y<=18;y++) s.map[y][cap.x].terrain='plains'; s.map[1][1].terrain='plains'; s.map[18][18].terrain='plains'; s.map[18][18].owner=null; s.units.forEach(u=>{u.x=cap.x;u.y=cap.y;}); s.barbarianDirector.lastDestroyedCamp={x:1,y:1,turn:20,campId:'old'}; s.turn=30; s.barbarianDirector.nextCampSpawnTurn=30; s.barbarianDirector.lastMaintenanceTurn=null; const spawned=d.maintainBarbarianCamps(s,()=>0,{x:18,y:18}); return { spawned:spawned && {x:spawned.x,y:spawned.y}, oldValid:d.isValidCampSpawnTile(s,1,1), targetValid:!!spawned, count:d.activeCampEntries(s).length }; });
    expect(r.spawned).toEqual({x:18,y:18}); expect(r.oldValid).toBeFalsy(); expect(r.targetValid).toBeTruthy(); expect(r.count).toBe(1);
  });

  test('initial camp creation mutates only the passed newState director, not the current global state', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), old=d.state; old.barbarianDirector.nextCampId=99; const ns=d.createNewGame(20,0,'normal'); return { oldNext:old.barbarianDirector.nextCampId, newNext:ns.barbarianDirector.nextCampId, ids:d.activeCampEntries(ns).map(c=>c.camp.campId), count:d.activeCampEntries(ns).length }; });
    expect(r.oldNext).toBe(99); expect(r.count).toBe(1); expect(new Set(r.ids).size).toBe(r.ids.length); expect(r.newNext).toBeGreaterThan(1);
  });

  test('initial camps respect all capitals and replacement nextSpawn uses normal interval only', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, initial=d.activeCampEntries(s)[0]; const distances=[s.city].concat(...s.rivals.map(c=>c.cities)).map(c=>Math.max(Math.abs(c.x-initial.x),Math.abs(c.y-initial.y))); d.activeCampEntries(s).forEach(c=>s.map[c.y][c.x].camp=null); s.turn=40; s.barbarianDirector.nextCampSpawnTurn=40; s.barbarianDirector.lastMaintenanceTurn=null; const replacement=d.maintainBarbarianCamps(s,()=>0); return { initialNext:initial.camp.nextSpawn, distances, replacementNext:replacement.camp.nextSpawn }; });
    expect(Math.min(...r.distances)).toBeGreaterThanOrEqual(5); expect(r.initialNext).toBeGreaterThanOrEqual(20); expect(r.initialNext).toBeLessThanOrEqual(24); expect(r.replacementNext).toBeGreaterThanOrEqual(8); expect(r.replacementNext).toBeLessThanOrEqual(12);
  });

  test('player and AI camp destruction paths record last destroyed camp and preserve existing barbarians', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, first=d.activeCampEntries(s)[0]; s.barbarians=[{id:'survivor',x:first.x,y:first.y+1,hp:10,maxHp:75,homeX:first.x,homeY:first.y,originCampId:first.camp.campId,last:null}]; d.campReward({resources:s.resources}, s.units[0], first.x, first.y); const player={count:d.activeCampEntries(s).length,next:s.barbarianDirector.nextCampSpawnTurn,last:s.barbarianDirector.lastDestroyedCamp,barbs:s.barbarians.length};
      s.turn=player.next-1; s.barbarianDirector.lastMaintenanceTurn=null; const early=!!d.maintainBarbarianCamps(s,()=>0); const x=1,y=1; s.map[y][x].terrain='plains'; s.map[y][x].camp={campId:'ai-camp',hp:1,maxHp:140,nextSpawn:8,discoveredByPlayer:false,discoveredByCivs:{}}; const civ=s.rivals[0], u=civ.units.find(q=>q.type==='warrior')||civ.units[0]; u.type='warrior'; u.x=x+1; u.y=y; d.processRivals(); return { player, early, aiLast:s.barbarianDirector.lastDestroyedCamp, barbs:s.barbarians.length }; });
    expect(r.player.count).toBe(0); expect(r.player.next - r.player.last.turn).toBeGreaterThanOrEqual(6); expect(r.player.next - r.player.last.turn).toBeLessThanOrEqual(12); expect(r.player.barbs).toBe(1); expect(r.early).toBeFalsy(); expect(r.aiLast).toMatchObject({x:1,y:1,campId:'ai-camp'}); expect(r.barbs).toBe(1);
  });
});
