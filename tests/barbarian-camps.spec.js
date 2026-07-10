const { test, expect } = require("@playwright/test");
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require("./helpers");



test.describe('v1.4.4 living barbarian camps', () => {
  test('new 20x20 map has exactly one active valid camp', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, camps=d.activeCampEntries(s); return { count:camps.length, target:d.targetActiveCampCount(s), valid:camps.every(c=>d.isValidCampSpawnTile(s,c.x,c.y)===false && s.map[c.y][c.x].terrain!=='water' && !!c.camp.campId) }; });
    expect(r).toEqual({ count: 1, target: 1, valid: true });
  });

  test('destroyed camp schedules delayed replacement and does not respawn early', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, c=d.activeCampEntries(s)[0]; d.scheduleNextCampSpawn(s, 20, () => 0); s.turn=20; s.map[c.y][c.x].camp=null; const due=s.barbarianDirector.nextCampSpawnTurn; const early=d.maintainBarbarianCamps(s,()=>0); s.turn=due-1; const before=d.maintainBarbarianCamps(s,()=>0); s.turn=due; const spawned=d.maintainBarbarianCamps(s,()=>0); return { due, early:!!early, before:!!before, after:!!spawned, count:d.activeCampEntries(s).length }; });
    expect(r.due).toBe(26); expect(r.early).toBeFalsy(); expect(r.before).toBeFalsy(); expect(r.after).toBeTruthy(); expect(r.count).toBe(1);
  });

  test('replacement candidate excludes occupied, improved, resource, territory, city and visible tiles', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state; d.activeCampEntries(s).forEach(c=>s.map[c.y][c.x].camp=null); for(let y=0;y<s.mapSize;y++) for(let x=0;x<s.mapSize;x++){ const t=s.map[y][x]; t.terrain='plains'; t.owner=null; t.improvement=null; t.poi=null; t.feature=null; t.resource=null; t.camp=null; t.revealed=false; }
      const bad=[[1,1,'water'],[2,1,'unit'],[3,1,'improvement'],[4,1,'poi'],[5,1,'resource'],[6,1,'owner']]; s.map[1][1].terrain='water'; s.units.push({id:'block',type:'scout',x:2,y:1,hp:1,maxHp:1,moves:0}); s.map[1][3].improvement='farm'; s.map[1][4].poi={type:'ruins',used:false}; s.map[1][5].resource='iron'; s.map[1][6].owner=s.city.id; const candidates=d.findCampSpawnCandidates(s); return { bad:bad.map(([x,y])=>d.isValidCampSpawnTile(s,x,y)), candidates:candidates.length, checks:candidates.every(p=>s.map[p.y][p.x].terrain!=='water'&&!s.map[p.y][p.x].owner&&!s.map[p.y][p.x].improvement&&!s.map[p.y][p.x].poi&&!s.map[p.y][p.x].resource && !s.units.some(u=>u.x===p.x&&u.y===p.y) && Math.max(Math.abs(p.x-s.city.x),Math.abs(p.y-s.city.y))>=5) }; });
    expect(r.bad).toEqual([false,false,false,false,false,false]); expect(r.candidates).toBeGreaterThan(0); expect(r.checks).toBeTruthy();
  });

  test('no valid tile postpones next camp check by three turns', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state; d.activeCampEntries(s).forEach(c=>s.map[c.y][c.x].camp=null); s.map.forEach(row=>row.forEach(t=>{t.terrain='water';t.camp=null;})); s.turn=40; s.barbarianDirector.nextCampSpawnTurn=40; s.barbarianDirector.lastMaintenanceTurn=null; const out=d.maintainBarbarianCamps(s,()=>0); return { out:!!out, count:d.activeCampEntries(s).length, next:s.barbarianDirector.nextCampSpawnTurn }; });
    expect(r).toEqual({ out:false, count:0, next:43 });
  });

  test('maintenance is idempotent in a single turn and respects target count', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state; d.activeCampEntries(s).forEach(c=>s.map[c.y][c.x].camp=null); s.turn=30; s.barbarianDirector.nextCampSpawnTurn=30; s.barbarianDirector.lastMaintenanceTurn=null; d.maintainBarbarianCamps(s,()=>0); d.maintainBarbarianCamps(s,()=>0); d.maintainBarbarianCamps(s,()=>0); return { count:d.activeCampEntries(s).length, target:d.targetActiveCampCount(s) }; });
    expect(r.count).toBeLessThanOrEqual(r.target); expect(r.count).toBe(1);
  });

  test('camp produces at most two living barbarians and reopens after one dies', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, e=d.activeCampEntries(s)[0], camp=e.camp; s.turn=50; camp.nextSpawn=0; s.barbarians=[]; d.processBarbarians(); camp.nextSpawn=0; d.processBarbarians(); const two=s.barbarians.filter(b=>b.originCampId===camp.campId).length; camp.nextSpawn=0; d.processBarbarians(); const still=s.barbarians.filter(b=>b.originCampId===camp.campId).length; const fromCamp=s.barbarians.filter(b=>b.originCampId===camp.campId); s.barbarians=s.barbarians.filter(b=>b.id!==fromCamp[0].id); camp.nextSpawn=0; d.processBarbarians(); return { two, still, after:s.barbarians.filter(b=>b.originCampId===camp.campId).length, ids:s.barbarians.every(b=>b.originCampId===camp.campId) }; });
    expect(r).toEqual({ two:2, still:2, after:2, ids:true });
  });

  test('save/load preserves director timing and does not duplicate camps', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, c=d.activeCampEntries(s)[0]; s.map[c.y][c.x].camp=null; d.scheduleNextCampSpawn(s, s.turn, () => 0.5); const raw=JSON.parse(JSON.stringify(s)); const migrated=d.migrateState(raw); return { turn:s.barbarianDirector.nextCampSpawnTurn, loaded:migrated.barbarianDirector.nextCampSpawnTurn, count:d.activeCampEntries(migrated).length, nextId:migrated.barbarianDirector.nextCampId }; });
    expect(r.loaded).toBe(r.turn); expect(r.count).toBe(0); expect(r.nextId).toBeGreaterThan(1);
  });

  test('legacy migration handles saves with and without camps without duplicates', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), base=JSON.parse(JSON.stringify(d.state)); delete base.barbarianDirector; base.map.forEach(row=>row.forEach(t=>{ if(t.camp) delete t.camp.campId; })); const withCamp=d.migrateState(JSON.parse(JSON.stringify(base))); const noCampRaw=JSON.parse(JSON.stringify(base)); noCampRaw.map.forEach(row=>row.forEach(t=>t.camp=null)); delete noCampRaw.barbarianDirector; const noCamp=d.migrateState(noCampRaw); const again=d.migrateState(JSON.parse(JSON.stringify(noCamp))); return { withCount:d.activeCampEntries(withCamp).length, withIds:d.activeCampEntries(withCamp).every(e=>!!e.camp.campId), noCount:d.activeCampEntries(noCamp).length, same:noCamp.barbarianDirector.nextCampSpawnTurn===again.barbarianDirector.nextCampSpawnTurn }; });
    expect(r).toEqual({ withCount:1, withIds:true, noCount:0, same:true });
  });
});
