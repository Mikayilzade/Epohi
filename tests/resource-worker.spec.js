const { test, expect } = require("@playwright/test");
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require("./helpers");


test.describe('v1.4.2 resource, worker, and inspection checks', () => {
  test('worker uses worker time without spending local city production', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 0, 'small');
    const result = await page.evaluate(() => {
      const d = window.__epohiDebug(); const s = d.state; const cap = s.city;
      s.researched.push('mining');
      s.resources.production = 0; cap.production = 14; cap.food = 9;
      const target = window.EpohiUtils.neighborsOf(cap.x, cap.y, s.map.length).find(point =>
        !s.units.some(unit => unit.x === point.x && unit.y === point.y) &&
        !s.cities.some(city => city.x === point.x && city.y === point.y)
      );
      const worker = { id:'worker-local-pay', type:'worker', x:target.x, y:target.y, moves:1, acted:false, hp:70, maxHp:70 };
      const tile = s.map[worker.y][worker.x];
      tile.terrain = 'forest'; tile.revealed = true; tile.improvement = null; tile.pillaged = false; tile.camp = null; tile.poi = null; tile.owner = cap.id;
      s.units.push(worker);
      d.setResourceViewCity(cap.id);
      d.render();
      return { capProduction: cap.production, globalProduction: s.resources.production, owner: tile.owner, workerId: worker.id, x: worker.x, y: worker.y };
    });
    const workerPiece = page.locator(`.tile[data-x="${result.x}"][data-y="${result.y}"] .piece.unit`).first();
    await expect(workerPiece).toBeVisible();
    await workerPiece.click();
    const build = page.locator('#contextActions [data-context-action="build-improvement"]');
    await expect(build).toBeVisible();
    await expect(build).toContainText('2 действ. рабочего');
    const mobileActions = await page.locator('#contextActions').evaluate(node => {
      const style = getComputedStyle(node);
      return { overflowX: style.overflowX, flexWrap: style.flexWrap, touchAction: style.touchAction };
    });
    expect(mobileActions).toEqual({ overflowX: 'auto', flexWrap: 'nowrap', touchAction: 'pan-x' });
    await build.click();
    await expect(page.locator('[data-worker-time-status]')).toContainText('Выполнено: 1/2 действий рабочего');
    await expect(page.locator('[data-worker-time-status]')).toContainText('осталось: 1');
    await expect(page.locator('[data-worker-time-status]')).toContainText('следующего хода партии');
    await expect(build).toBeDisabled();
    await expect(build).toContainText('2 действ. рабочего');
    await expect(build).toHaveAttribute('title', 'Сначала завершите текущий проект');
    const started = await page.evaluate((id) => {
      const d = window.__epohiDebug();
      const worker = d.state.units.find(unit => unit.id === id);
      return { capProduction: d.state.city.production, globalProduction: d.state.resources.production, project: worker.workerProject, acted: worker.acted };
    }, result.workerId);
    expect(started.capProduction).toBe(14);
    expect(started.globalProduction).toBe(0);
    expect(started.project).toEqual(expect.objectContaining({ improvementId: 'lumber', x: result.x, y: result.y }));
    expect(started.acted).toBe(true);
    expect(result.owner).toBe('player-cap');
    await page.evaluate(() => window.__epohiDebug().saveGame());
    await page.locator('#menuBtn').click();
    await page.locator('#toMainBtn').click();
    await expect(page.locator('[data-continue]')).toBeVisible();
    await page.locator('[data-continue]').first().click();
    expect(await page.evaluate(id => {
      const worker = window.__epohiDebug().state.units.find(unit => unit.id === id);
      return worker.workerProject;
    }, result.workerId)).toEqual(expect.objectContaining({
      improvementId: 'lumber', totalTurns: 2, remainingTurns: 1
    }));
    await page.locator('#endTurnBtn').click();
    await page.waitForFunction(() => !window.__epohiDebug().isTurnProcessing());
    await expect.poll(() => page.evaluate(id => {
      const state = window.__epohiDebug().state;
      const worker = state.units.find(unit => unit.id === id);
      return { improvement: state.map[worker.y][worker.x].improvement, project: worker.workerProject };
    }, result.workerId)).toEqual({ improvement: 'lumber', project: null });
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
    await page.locator(`.tile[data-x="${setup.unitX}"][data-y="${setup.unitY}"] .piece.ai-unit`).click();
    await expect(page.locator('#contextText')).toContainText('атака');
    await page.locator(`.tile[data-x="${setup.cityX}"][data-y="${setup.cityY}"] .piece.ai-city`).click();
    await expect(page.locator('#contextText')).toContainText('Владелец');
    await page.locator(`.tile[data-x="${setup.campX}"][data-y="${setup.campY}"] .piece.camp, .tile[data-x="${setup.campX}"][data-y="${setup.campY}"] .camp-marker`).first().click();
    await expect(page.locator('#contextText')).toContainText('награда');
    await page.locator(`.tile[data-x="${setup.campX}"][data-y="${setup.campY}"]`).click({ position: { x: 4, y: 4 } });
    await expect(page.locator('#contextText')).toContainText(`X ${setup.campX}, Y ${setup.campY}`);
    await page.locator(`.tile[data-x="${setup.campX}"][data-y="${setup.campY}"] .piece.camp, .tile[data-x="${setup.campX}"][data-y="${setup.campY}"] .camp-marker`).first().click();
    const barbarian = page.locator(`.tile[data-x="${setup.barbX}"][data-y="${setup.barbY}"] .piece.enemy`);
    await expect(barbarian).toBeVisible();
    await barbarian.click();
    await expect(page.locator('#contextText')).toContainText('здоровье');
    const ownStillExists = await page.evaluate((id) => window.__epohiDebug().state.units.some(u => u.id === id), setup.ownId);
    expect(ownStillExists).toBeTruthy();
    expect(problems).toEqual([]);
  });
});
