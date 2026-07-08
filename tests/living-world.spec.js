const { test, expect } = require("@playwright/test");
const {
  watchConsole,
  expectNoConsoleProblems,
  clearStorage,
  createGame
} = require("./helpers");


test.describe('v1.4.1 living world checks', () => {
  test('barbarian activity selector starts normal game and grace period blocks raids', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await page.getByRole('button', { name: 'Новая игра' }).click();
    await page.locator('#partySize').selectOption('normal');
    await page.locator('#rivalCount').selectOption('1');
    await page.locator('#barbarianActivity').selectOption('normal');
    await page.locator('#partyName').fill(`Living ${Date.now()}`);
    await page.getByRole('button', { name: 'Создать мир' }).click();
    await expect(page.locator('#gameApp')).toBeVisible();
    const ok = await page.evaluate(() => {
      const d = window.__epohiDebug();
      const before = d.state.barbarians.length;
      for (let i = 0; i < 10; i++) d.processBarbarians();
      return d.state.turn < 12 && d.state.barbarians.length === before && d.state.barbarianActivity === 'normal';
    });
    expect(ok).toBeTruthy();
    expect(problems).toEqual([]);
  });

  test('barbarians and AI interact: raider targets AI, AI attacks raider and can clear camp', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 1, 'normal');
    const result = await page.evaluate(() => {
      const d = window.__epohiDebug();
      const s = d.state;
      s.turn = 12;
      const civ = s.rivals[0];
      const u = civ.units.find(x => x.type === 'warrior') || civ.units[0];
      s.barbarians = [{ id:'bt', x:u.x+1, y:u.y, hp:40, maxHp:75, homeX:u.x+2, homeY:u.y, last:null }];
      d.processBarbarians();
      const attacked = s.eventLog.some(e => e.eventType === 'barbarian-attacked-rival');
      s.barbarians = [{ id:'bt2', x:u.x+1, y:u.y, hp:8, maxHp:75, homeX:u.x+2, homeY:u.y, last:null }];
      d.processRivals();
      const killed = s.eventLog.some(e => e.eventType === 'rival-destroyed-barbarian');
      const cx = u.x+1, cy = u.y;
      s.map[cy][cx].camp = { hp: 1, maxHp: 140, nextSpawn: 9 };
      d.processRivals();
      const camp = s.eventLog.some(e => e.eventType === 'rival-destroyed-camp');
      return { attacked, killed, camp };
    });
    expect(result).toEqual({ attacked: true, killed: true, camp: true });
    expect(problems).toEqual([]);
  });

  test('two AI civilizations can enter war after turn 20', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 2, 'normal');
    const war = await page.evaluate(() => { const d=window.__epohiDebug(); d.state.turn=20; d.processRivals(); return d.state.eventLog.some(e=>e.eventType==='rival-war-declared'); });
    expect(war).toBeTruthy();
    expect(problems).toEqual([]);
  });

  test('player settler founds a city with its own queue and local production', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 1, 'normal');
    const result = await page.evaluate(() => {
      window.prompt = () => 'Тестград';
      const d = window.__epohiDebug();
      const s = d.state;
      s.researched.push('trade','mining');
      const cap = s.city;
      const beforeIds = new Set(s.cities.map(c => c.id));
      let spot = null;
      for (let dy = -6; dy <= 6 && !spot; dy++) {
        for (let dx = -6; dx <= 6 && !spot; dx++) {
          const x = cap.x + dx, y = cap.y + dy;
          if (!s.map[y] || !s.map[y][x]) continue;
          const t = s.map[y][x];
          t.terrain = 'plains'; t.revealed = true; t.camp = null; t.poi = null; t.improvement = null;
          const settler = { id:'settle-test', type:'settler', x, y, moves:1, acted:false, hp:70, maxHp:70 };
          s.units = s.units.filter(u => u.id !== 'settle-test').concat([settler]);
          if (d.canFoundCity(settler)) spot = { x, y };
        }
      }
      if (!spot) return { error: 'no founding spot' };
      d.foundCity('settle-test');
      const city = s.cities.find(c => !beforeIds.has(c.id));
      d.setActiveCity(city.id);
      const capProductionBeforeQueue = cap.production;
      city.production = 3;
      d.queueProject('unit', 'scout');
      const queueDidNotChangeCapitalBeforeTurn = cap.production === capProductionBeforeQueue;
      const progressBefore = city.queue.progress;
      const cityProductionBeforeTurn = city.production;
      const capProductionBeforeTurn = cap.production;
      const cityIncome = d.cityIncome(city);
      const capIncome = d.cityIncome(cap);
      d.endTurn();
      return new Promise(resolve => setTimeout(() => resolve({
        cities:s.cities.length,
        cityId:city.id,
        queueDidNotChangeCapitalBeforeTurn,
        cityProgress:city.queue && city.queue.progress,
        expectedProgressAfter:progressBefore + cityIncome.production,
        cityProductionAfterTurn:city.production,
        expectedCityProductionAfterTurn:cityProductionBeforeTurn,
        capProductionAfterTurn:cap.production,
        expectedCapProductionAfterTurn:capProductionBeforeTurn + capIncome.production,
        globalProduction:s.resources.production
      }), 250));
    });
    expect(result.error).toBeFalsy();
    expect(result.cities).toBeGreaterThan(1);
    expect(result.queueDidNotChangeCapitalBeforeTurn).toBeTruthy();
    expect(result.cityProgress).toBe(result.expectedProgressAfter);
    expect(result.cityProductionAfterTurn).toBe(result.expectedCityProductionAfterTurn);
    expect(result.capProductionAfterTurn).toBe(result.expectedCapProductionAfterTurn);
    expect(result.globalProduction).toBe(0);
    expect(problems).toEqual([]);
  });

  test('save/load supports multiple cities and legacy outpost shape', async ({ page }) => {
    const problems = watchConsole(page);
    await clearStorage(page);
    await createGame(page, 0, 'small');
    const migrated = await page.evaluate(() => {
      const d=window.__epohiDebug(); const s=d.state;
      s.settlements.push({x:s.city.x+3,y:s.city.y+3,name:'Старый форпост'});
      const raw=JSON.parse(JSON.stringify(s)); delete raw.cities; raw.resources.food=5; raw.resources.production=7;
      localStorage.setItem('legacy-check', JSON.stringify(raw));
      return true;
    });
    expect(migrated).toBeTruthy();
    await page.locator('#menuBtn').click();
    await page.locator('#saveAsBtn').click();
    await page.locator('#saveQuickFromManager').click();
    await expect(page.locator('#screenRoot')).toContainText('Быстрое сохранение');
    expect(problems).toEqual([]);
  });
});
