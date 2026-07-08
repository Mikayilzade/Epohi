const { test, expect } = require("@playwright/test");
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require("./helpers");


test.describe('v1.4.2 resource, worker, and inspection checks', () => {
  test('resource switcher uses local city stocks and worker spends local production', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 0, 'small');
    await expect(page.locator('#resourceScope')).toHaveText('Вся империя');
    const result = await page.evaluate(() => {
      const d = window.__epohiDebug(); const s = d.state; const cap = s.city;
      s.researched.push('mining');
      s.resources.production = 0; cap.production = 14; cap.food = 9;
      const worker = { id:'worker-local-pay', type:'worker', x:cap.x-1, y:cap.y, moves:1, acted:false, hp:70, maxHp:70 };
      const tile = s.map[worker.y][worker.x];
      tile.terrain = 'forest'; tile.revealed = true; tile.improvement = null; tile.pillaged = false; tile.camp = null; tile.poi = null; tile.owner = cap.id;
      s.units.push(worker);
      d.setResourceViewCity(cap.id);
      d.render();
      d.buildImprovementWithWorker(worker.id, 'lumber');
      return { capProduction: cap.production, globalProduction: s.resources.production, improvement: tile.improvement, owner: tile.owner };
    });
    await expect(page.locator('#resourceScope')).toContainText('Ардена');
    expect(result).toEqual({ capProduction: 4, globalProduction: 0, improvement: 'lumber', owner: 'player-cap' });
    await page.locator('#resourcePrev').click();
    await expect(page.locator('#resourceScope')).toHaveText('Вся империя');
    expect(problems).toEqual([]);
  });

  test('visible rival objects and barbarian camps can be inspected without losing own unit', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 1, 'normal');
    const setup = await page.evaluate(() => {
      const d = window.__epohiDebug(); const s = d.state; const cap = s.city; const civ = s.rivals[0];
      const own = s.units[0]; own.x = cap.x; own.y = cap.y - 1; s.map[own.y][own.x].revealed = true;
      const unit = civ.units[0]; unit.x = cap.x + 1; unit.y = cap.y; unit.hp = unit.maxHp || 60; s.map[unit.y][unit.x].revealed = true;
      const city = civ.cities[0]; city.x = cap.x + 2; city.y = cap.y; city.hp = city.maxHp || 150; s.map[city.y][city.x].revealed = true;
      const campX = cap.x + 1, campY = cap.y + 1; s.map[campY][campX].terrain = 'plains'; s.map[campY][campX].revealed = true; s.map[campY][campX].camp = { hp: 20, maxHp: 140, nextSpawn: 8 };
      s.barbarians = [{ id:'inspect-barb', x:cap.x-1, y:cap.y, hp:40, maxHp:75, homeX:campX, homeY:campY, last:null }]; s.map[cap.y][cap.x-1].revealed = true;
      d.render();
      return { ownId: own.id, unitX: unit.x, unitY: unit.y, cityX: city.x, cityY: city.y, campX, campY, barbX: cap.x-1, barbY: cap.y };
    });
    await page.locator(`.tile[data-x="${setup.unitX}"][data-y="${setup.unitY}"]`).click();
    await expect(page.locator('#contextText')).toContainText('атака');
    await page.locator(`.tile[data-x="${setup.cityX}"][data-y="${setup.cityY}"]`).click();
    await expect(page.locator('#contextText')).toContainText('Владелец');
    await page.locator(`.tile[data-x="${setup.campX}"][data-y="${setup.campY}"]`).click();
    await expect(page.locator('#contextText')).toContainText('награда');
    await expect(page.locator('[data-inspect-layer="camp"]')).toHaveText('Лагерь');
    await page.locator('[data-inspect-layer="tile"]').click();
    await expect(page.locator('#contextText')).toContainText(`X ${setup.campX}, Y ${setup.campY}`);
    await page.locator('[data-inspect-layer="camp"]').click();
    await page.locator(`.tile[data-x="${setup.barbX}"][data-y="${setup.barbY}"]`).click();
    await expect(page.locator('#contextText')).toContainText('здоровье');
    const ownStillExists = await page.evaluate((id) => window.__epohiDebug().state.units.some(u => u.id === id), setup.ownId);
    expect(ownStillExists).toBeTruthy();
    expect(problems).toEqual([]);
  });
});
