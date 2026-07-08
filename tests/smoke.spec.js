const { test, expect } = require('@playwright/test');
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require('./helpers');



test.describe('v1.4.5 mobile context card and AI notices', () => {
  test('camp description is complete and internally scrollable without two-line clamp', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const setup = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state; const e=d.activeCampEntries(s)[0]; const t=s.map[e.y][e.x]; t.revealed=true; t.camp.discoveredByPlayer=true; d.render(); return {x:e.x,y:e.y}; });
    await page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"]`).click();
    await page.locator('#contextTabs .inspect-tab[data-inspect-layer="camp"]').click();
    await expect(page.locator('#contextText')).toContainText('здоровье:');
    await expect(page.locator('#contextText')).toContainText('награда: золото, наука и опыт для атакующего юнита');
    await expect(page.locator('#contextText')).toContainText('отряды лагеря:');
    await expect(page.locator('#contextText')).toContainText('опасность: может порождать налётчиков');
    const metrics = await page.locator('#contextText').evaluate((el) => {
      el.style.maxHeight = '20px';
      const style = getComputedStyle(el);
      const before = el.scrollTop;
      el.scrollTop = 12;
      return { clamp: style.webkitLineClamp, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, before, after: el.scrollTop };
    });
    expect(metrics.clamp === 'none' || metrics.clamp === '').toBeTruthy();
    expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.clientHeight);
    expect(metrics.after).toBeGreaterThan(metrics.before);
  });

  test('unit description exposes the final AI relation text above action buttons', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1, 'small');
    const setup = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, civ=s.rivals[0], u=civ.units[0]; civ.met=true; civ.relation='neutral'; u.aiTarget={x:u.x+4,y:u.y+3, reason:'очень длинная разведывательная цель'}; s.map[u.y][u.x].revealed=true; d.render(); return {x:u.x,y:u.y}; });
    await page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"]`).click();
    await page.locator('#contextTabs .inspect-tab[data-inspect-layer="unit"]').click();
    await expect(page.locator('#contextText')).toContainText('цель ИИ');
    await expect(page.locator('#contextText')).toContainText('отношения: нейтральные отношения');
    const rects = await page.evaluate(() => { const text=document.querySelector('#contextText').getBoundingClientRect(); const actions=document.querySelector('#contextActions').getBoundingClientRect(); return { textBottom:text.bottom, actionsTop:actions.top }; });
    expect(rects.textBottom).toBeLessThanOrEqual(rects.actionsTop + 1);
  });

  test('inspect tabs and actions use separate containers and empty containers collapse', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, u=s.units[0]; u.x=s.city.x; u.y=s.city.y; d.render(); return {x:u.x,y:u.y}; });
    await page.locator(`.tile[data-x="${r.x}"][data-y="${r.y}"]`).click();
    await expect(page.locator('#contextTabs .inspect-tab')).toHaveCount(3);
    await expect(page.locator('#contextActions .inspect-tab')).toHaveCount(0);
    expect(await page.locator('#contextTabs').evaluate(el => el.parentElement.id)).toBe('contextPanel');
    await page.evaluate(() => { document.querySelector('#contextTabs').innerHTML=''; document.querySelector('#contextActions').innerHTML=''; });
    const displays = await page.evaluate(() => ({ tabs:getComputedStyle(document.querySelector('#contextTabs')).display, actions:getComputedStyle(document.querySelector('#contextActions')).display }));
    expect(displays).toEqual({ tabs: 'none', actions: 'none' });
  });

  test('two own units never create duplicate select buttons and cycle one unit at a time', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');

    const setup = await page.evaluate(() => {
      const d = window.__epohiDebug();
      const s = d.state;
      const cap = s.city;
      const active = s.units[0];
      const firstOnTile = s.units[1];
      const x = cap.x + 1;
      const y = cap.y;
      active.x = cap.x;
      active.y = cap.y;
      firstOnTile.x = x;
      firstOnTile.y = y;
      const tile = s.map[y][x];
      tile.terrain = 'plains';
      tile.revealed = true;
      tile.camp = null;
      tile.poi = null;
      tile.improvement = null;
      s.units.push({ id:'second-on-tile', type:'warrior', x, y, moves:1, acted:false, hp:90, maxHp:90 });
      d.render();
      return { x, y, activeId: active.id };
    });

    await page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"]`).click();
    await expect(page.locator('#contextActions [data-context-action="select-unit"]')).toHaveCount(1);
    await expect(page.locator('#contextActions [data-context-action="cycle-unit"]')).toHaveCount(0);

    await page.locator('#contextActions [data-context-action="select-unit"]').click();
    const selectedOnTile = await page.evaluate(({ x, y }) => {
      const d = window.__epohiDebug();
      const selectedId = d.getSelectedUnitId();
      const unit = d.state.units.find(u => u.id === selectedId);
      return { selectedId, onTile: unit && unit.x === x && unit.y === y };
    }, setup);
    expect(selectedOnTile.selectedId).not.toBe(setup.activeId);
    expect(selectedOnTile.onTile).toBeTruthy();
    await expect(page.locator('#contextActions [data-context-action="select-unit"]')).toHaveCount(0);
    await expect(page.locator('#contextActions [data-context-action="cycle-unit"]')).toHaveCount(1);

    const before = await page.evaluate(() => window.__epohiDebug().getSelectedUnitId());
    await page.locator('#contextActions [data-context-action="cycle-unit"]').click();
    const after = await page.evaluate(() => window.__epohiDebug().getSelectedUnitId());
    expect(after).not.toBe(before);
    await page.evaluate(() => window.__epohiDebug().renderContext());
    await page.evaluate(() => window.__epohiDebug().renderContext());
    await expect(page.locator('#contextActions [data-context-action="select-unit"]')).toHaveCount(0);
    await expect(page.locator('#contextActions [data-context-action="cycle-unit"]')).toHaveCount(1);

    const activeHereSetup = await page.evaluate(({ x, y }) => {
      const d = window.__epohiDebug();
      d.state.units[0].x = x;
      d.state.units[0].y = y;
      d.render();
      return { selectedId: d.getSelectedUnitId() };
    }, setup);
    await page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"]`).click();
    await expect(page.locator('#contextActions [data-context-action="select-unit"]')).toHaveCount(0);
    await expect(page.locator('#contextActions [data-context-action="cycle-unit"]')).toHaveCount(1);
    expect(activeHereSetup.selectedId).toBeTruthy();
  });

  test('AI unit entering vision creates one unit-spotted notice and visible movement does not repeat', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1, 'small');
    const result = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, civ=s.rivals[0], u=civ.units[0], cap=s.city; for(let y=0;y<s.mapSize;y++) for(let x=0;x<s.mapSize;x++){ s.map[y][x].terrain='plains'; s.map[y][x].revealed=false; } s.units.forEach(unit=>{ unit.x=cap.x; unit.y=cap.y; }); u.x=cap.x+3; u.y=cap.y; u.last=null; u.moves=3; s.turn=77; d.render(); const before=s.eventLog.filter(e=>e.eventType==='unit-spotted').length; d.stepToward(u,{x:cap.x+1,y:cap.y},civ); d.stepToward(u,{x:cap.x,y:cap.y},civ); d.stepToward(u,{x:cap.x+1,y:cap.y},civ); const spots=s.eventLog.filter(e=>e.eventType==='unit-spotted'); return { added:spots.length-before, event:spots[0] }; });
    expect(result.added).toBe(1);
    expect(result.event).toMatchObject({ eventType: 'unit-spotted', actorType: 'civilization' });
    expect(result.event.text).toMatch(/замечен/);
    expect(result.event.coordinates).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
    expect(result.event.coordinates.x).toBeGreaterThanOrEqual(0);
    expect(result.event.coordinates.y).toBeGreaterThanOrEqual(0);
  });

  test('hidden AI movement outside current vision does not enter player chronicle', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1, 'small');
    const result = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, civ=s.rivals[0], u=civ.units[0]; for(let y=0;y<s.mapSize;y++) for(let x=0;x<s.mapSize;x++){ s.map[y][x].terrain='plains'; s.map[y][x].revealed=false; } u.x=1; u.y=1; u.moves=2; u.last=null; s.turn=12; const before=s.eventLog.length; d.stepToward(u,{x:3,y:1},civ); return { added:s.eventLog.length-before, moved:u.x!==1 || u.y!==1, text:s.eventLog.map(e=>e.message).join('\n') }; });
    expect(result.moved).toBeTruthy();
    expect(result.added).toBe(0);
    expect(result.text).not.toContain('юнит замечен в движении');
  });

  test('mobile 390x844 layout keeps context, toolbar, and horizontal scrollers usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await clearStorage(page); await createGame(page, 0, 'small');
    const setup = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, u=s.units[0]; u.x=s.city.x; u.y=s.city.y; d.render(); return {x:u.x,y:u.y}; });
    await page.locator(`.tile[data-x="${setup.x}"][data-y="${setup.y}"]`).click();
    const metrics = await page.evaluate(() => { const panel=document.querySelector('#contextPanel').getBoundingClientRect(); const toolbar=document.querySelector('.toolbar').getBoundingClientRect(); const map=document.querySelector('.map-shell').getBoundingClientRect(); const tabs=getComputedStyle(document.querySelector('#contextTabs')); const actions=getComputedStyle(document.querySelector('#contextActions')); return { panel, toolbar, mapHeight:map.height, tabsOverflow:tabs.overflowX, actionsOverflow:actions.overflowX, overlap:panel.bottom > toolbar.top }; });
    expect(metrics.panel.top).toBeGreaterThanOrEqual(0);
    expect(metrics.panel.bottom).toBeLessThanOrEqual(844);
    expect(metrics.toolbar.bottom).toBeLessThanOrEqual(844);
    expect(metrics.mapHeight).toBeGreaterThan(50);
    expect(metrics.overlap).toBeFalsy();
    expect(metrics.tabsOverflow).toBe('auto');
    expect(metrics.actionsOverflow).toBe('auto');
  });
});

test.describe('v1.4.5.1 turn unlock hotfix', () => {
  test('turn 130 advances to 131', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await page.evaluate(() => {
      const d = window.__epohiDebug();
      d.state.turn = 130;
      d.render();
    });
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('131');
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
  });

  test('rejected autosave does not leave the end turn button disabled', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await page.evaluate(() => {
      window.__epohiDebug().setAutoSaveForTests(() => Promise.reject(new Error('autosave failed for test')));
    });
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('2');
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
  });

  test('pending autosave does not prevent the next turn after calculation finishes', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await page.evaluate(() => {
      window.__epohiDebug().setAutoSaveForTests(() => new Promise(() => {}));
    });
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('2');
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('3');
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
  });

  test('canSaveNow returns true after turn calculation while autosave is still pending', async ({ page }) => {
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await page.evaluate(() => {
      window.__epohiDebug().setAutoSaveForTests(() => new Promise(() => {}));
    });
    await page.locator('#endTurnBtn').click();
    await expect(page.locator('#turnValue')).toHaveText('2');
    await expect.poll(() => page.evaluate(() => window.__epohiDebug().canSaveNow())).toBe(true);
    await expect(page.locator('#endTurnBtn')).toBeEnabled();
  });
});
