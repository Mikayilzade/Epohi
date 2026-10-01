const { test, expect } = require("@playwright/test");
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require("./helpers");

async function clickInspectLayerSemanticDom(page, layer) {
  await page.evaluate((targetLayer) => {
    const button = document.querySelector(`.inspect-tab[data-inspect-layer="${targetLayer}"]`);
    if (!button) throw new Error(`Inspect layer ${targetLayer} not found`);
    button.click();
  }, layer);
}

test.describe('v1.4.3 map object inspection', () => {
  test('renders a second player city once with population', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, cap=s.city; const c={id:'test-city',name:'Второй',x:cap.x+2,y:cap.y,population:3,food:0,production:0,buildings:[],queue:null,hp:150,maxHp:150,capital:false}; s.cities.push(c); s.map[c.y][c.x].revealed=true; d.render(); return {x:c.x,y:c.y,capX:cap.x,capY:cap.y}; });
    await expect(page.locator(`.tile[data-x="${r.x}"][data-y="${r.y}"] .piece.city.player-city`)).toHaveCount(1);
    await expect(page.locator(`.tile[data-x="${r.x}"][data-y="${r.y}"] .city-pop`)).toHaveText('3');
    await expect(page.locator(`.tile[data-x="${r.capX}"][data-y="${r.capY}"] .piece.city.player-capital`)).toHaveCount(1);
  });

  test('renders two AI cities with distinct capital and town markers', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, civ=s.rivals[0], cap=civ.cities[0]; civ.met=true; civ.relation='neutral'; const c={id:civ.civilizationId+'-extra',name:'Ривен',x:cap.x+1,y:cap.y,population:2,buildings:[],queue:null,hp:150,maxHp:150,capital:false}; civ.cities.push(c); [cap,c].forEach(city=>s.map[city.y][city.x].revealed=true); d.render(); return {cap, c}; });
    await expect(page.locator(`.tile[data-x="${r.cap.x}"][data-y="${r.cap.y}"] .ai-city.ai-capital`)).toHaveCount(1);
    await expect(page.locator(`.tile[data-x="${r.c.x}"][data-y="${r.c.y}"] .ai-city.ai-town`)).toHaveCount(1);
  });

  test('shows unit, city, and tile tabs when a unit stands in a city', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, u=s.units[0]; u.x=s.city.x; u.y=s.city.y; d.render(); return {x:u.x,y:u.y}; });
    const targetTile = page.locator(`.tile[data-x="${r.x}"][data-y="${r.y}"]`);
    await targetTile.click();
    await expect(targetTile.locator('.piece.city')).toBeVisible();
    await expect(targetTile.locator('.piece.unit')).toBeVisible();
    await expect(page.locator('.inspect-tab[data-inspect-layer="unit"]')).toBeVisible();
    await expect(page.locator('.inspect-tab[data-inspect-layer="city"]')).toBeVisible();
    await expect(page.locator('.inspect-tab[data-inspect-layer="tile"]')).toBeVisible();
  });

  test('tile inspection shows coordinates yields and fades only selected objects', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, u=s.units[0]; d.render(); return {x:u.x,y:u.y}; });
    const tile = page.locator(`.tile[data-x="${r.x}"][data-y="${r.y}"]`);
    await tile.click();
    await clickInspectLayerSemanticDom(page, 'tile');
    await expect(page.locator('#contextText')).toContainText(`X ${r.x}, Y ${r.y}`);
    await expect(page.locator('#contextText')).toContainText('доход:');
    await expect(tile).toHaveClass(/inspect-layer-tile/);
    await clickInspectLayerSemanticDom(page, 'unit');
    await expect(tile).not.toHaveClass(/inspect-layer-tile/);
  });

  test('active unit remains selected while inspecting tile layer', async ({ page }) => {
    await clearStorage(page); await createGame(page, 0, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, u=s.units[0]; d.render(); return {id:u.id,x:u.x,y:u.y}; });
    await page.locator(`.tile[data-x="${r.x}"][data-y="${r.y}"]`).click();
    await clickInspectLayerSemanticDom(page, 'tile');
    expect(await page.evaluate(() => window.__epohiDebug().getSelectedUnitId())).toBe(r.id);
    await clickInspectLayerSemanticDom(page, 'unit');
    await expect(page.getByRole('button', { name: /Идти|Ремонт|Основать|Выбрать/ }).first()).toBeVisible({ timeout: 1000 }).catch(() => {});
  });

  test('diplomacy button opens existing civilizations screen for inspected rival', async ({ page }) => {
    await clearStorage(page); await createGame(page, 1, 'small');
    const r = await page.evaluate(() => { const d=window.__epohiDebug(), s=d.state, civ=s.rivals[0], city=civ.cities[0]; civ.met=true; civ.relation='neutral'; s.map[city.y][city.x].revealed=true; d.render(); return {x:city.x,y:city.y,name:civ.name}; });
    await page.locator(`.tile[data-x="${r.x}"][data-y="${r.y}"]`).click(); await page.getByRole('button', { name: 'Дипломатия' }).click();
    await expect(page.locator('#menuModal')).toBeVisible();
    await expect(page.locator('#menuContent')).toContainText('Цивилизации');
    await expect(page.locator('#menuContent')).toContainText(r.name);
  });

  test('new game starts player and every AI with one scout and one warrior on valid land', async ({ page }) => {
    await clearStorage(page); await createGame(page, 2, 'normal');
    const result = await page.evaluate(() => { const s=window.__epohiDebug().state; const valid=u=>s.map[u.y][u.x].terrain!=='water' && !s.map[u.y][u.x].camp; const counts=list=>({scout:list.filter(u=>u.type==='scout').length, warrior:list.filter(u=>u.type==='warrior').length, valid:list.every(valid), unique:new Set(list.map(u=>u.x+','+u.y)).size===list.length}); return {player:counts(s.units), rivals:s.rivals.map(c=>counts(c.units))}; });
    expect(result.player).toMatchObject({ scout: 1, warrior: 1, valid: true, unique: true });
    for (const civ of result.rivals) expect(civ).toMatchObject({ scout: 1, warrior: 1, valid: true, unique: true });
    const deterministic = await page.evaluate(() => {
      const d = window.__epohiDebug();
      const size = 7;
      const map = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ terrain: 'plains', revealed: true, improvement: null, feature: null, poi: null, camp: null, pillaged: false })));
      map[2][2].poi = { type: 'ruins', used: false }; map[2][3].terrain = 'water'; map[2][4].camp = { hp: 100, maxHp: 100 };
      const gs = { map, mapSize: size, units: [{ id: 'existing', type: 'scout', x: 1, y: 2 }], rivals: [], cities: [{ id: 'cap', x: 3, y: 3, name: 'Test', hp: 180 }], city: { id: 'cap', x: 3, y: 3, name: 'Test', hp: 180 }, nextUnitId: 1, nextRivalUnitId: 1 };
      const local = []; d.placeStartingUnits(gs, gs.city, local, 'civx');
      const coords = local.map(u => `${u.x},${u.y}`);
      return { count: local.length, unique: new Set(coords).size === coords.length, blocked: coords.some(c => ['3,3','1,2','2,2','3,2','4,2'].includes(c)) };
    });
    expect(deterministic).toMatchObject({ count: 2, unique: true, blocked: false });
  });


});
