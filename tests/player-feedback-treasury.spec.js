const { test, expect } = require('@playwright/test');
const { clearStorage, createGame, watchConsole, expectNoConsoleProblems } = require('./helpers');

async function ready(page, rivals = 3) {
  await clearStorage(page);
  await createGame(page, rivals);
  await page.waitForFunction(() => window.EpohiPlayerFeedback && window.__epohiDebug && window.__epohiDebug().state);
}

test.describe('Player feedback stabilization and treasury', () => {
  test('дар списывает 10 золота и добавляет доверие один раз', async ({ page }) => {
    const problems = watchConsole(page);
    await ready(page, 1);
    const before = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      const civ = gs.rivals[0];
      civ.met = true;
      civ.relation = 'neutral';
      gs.resources.gold = 50;
      window.EpohiLivingCivilizations.migrate(gs);
      window.__epohiDebug().render();
      window.EpohiStrategyUX.openDiplomacy(civ.civilizationId);
      return { gold: gs.resources.gold, trust: civ.diplomacy.trust, civId: civ.civilizationId };
    });
    await page.locator(`[data-dip-action="gift"][data-civ-id="${before.civId}"]`).click();
    const after = await page.evaluate((civId) => {
      const gs = window.__epohiDebug().state;
      const civ = gs.rivals.find(item => item.civilizationId === civId);
      return {
        gold: gs.resources.gold,
        trust: civ.diplomacy.trust,
        matchingHistory: civ.diplomacy.history.filter(line => line.includes('отправила дар')).length,
        latest: civ.diplomacy.history[0]
      };
    }, before.civId);
    expect(after.gold).toBe(before.gold - 10);
    expect(after.trust).toBe(before.trust + 14);
    expect(after.matchingHistory).toBe(1);
    expect(after.latest).toContain('−10 золота, +14 доверия');
    await expectNoConsoleProblems(problems);
  });

  test('торговля требует технологии и создаёт договор на восемь ходов', async ({ page }) => {
    await ready(page, 1);
    const setup = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      const civ = gs.rivals[0];
      civ.met = true;
      civ.relation = 'neutral';
      civ.technologies = ['trade'];
      gs.researched = Array.from(new Set([...(gs.researched || []), 'trade']));
      window.EpohiLivingCivilizations.migrate(gs);
      civ.diplomacy.trust = 70;
      civ.diplomacy.grievances = 0;
      civ.diplomacy.score = 25;
      gs.resources.gold = 40;
      const proposal = window.EpohiLivingCivilizations.createProposal(gs, civ, 'trade', 'Откроем торговый путь.');
      window.__epohiDebug().render();
      return { id: proposal.id, gold: gs.resources.gold, trust: civ.diplomacy.trust, civId: civ.civilizationId };
    });
    await page.locator(`[data-proposal="${setup.id}"][data-answer="yes"]`).click();
    const accepted = await page.evaluate((civId) => {
      const gs = window.__epohiDebug().state;
      const civ = gs.rivals.find(item => item.civilizationId === civId);
      const route = window.EpohiPlayerFeedback.activeTradeRoute(gs, civId);
      return { gold: gs.resources.gold, trust: civ.diplomacy.trust, route };
    }, setup.civId);
    expect(accepted.gold).toBe(setup.gold);
    expect(accepted.trust).toBe(setup.trust + 7);
    expect(accepted.route.remainingTurns).toBe(8);

    const paid = await page.evaluate((civId) => {
      const gs = window.__epohiDebug().state;
      const before = gs.resources.gold;
      gs.turn += 1;
      window.EpohiPlayerFeedback.processTurn(gs);
      const route = window.EpohiPlayerFeedback.activeTradeRoute(gs, civId);
      return { gain: gs.resources.gold - before, remaining: route.remainingTurns };
    }, setup.civId);
    expect(paid.gain).toBe(2);
    expect(paid.remaining).toBe(7);
  });

  test('торговое предложение недоступно без технологии или при враждебности', async ({ page }) => {
    await ready(page, 1);
    const result = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      const civ = gs.rivals[0];
      civ.met = true;
      civ.relation = 'neutral';
      window.EpohiLivingCivilizations.migrate(gs);
      civ.diplomacy.trust = 80;
      civ.diplomacy.score = 30;
      civ.diplomacy.grievances = 0;
      const withoutTech = window.EpohiPlayerFeedback.canTrade(gs, civ);
      gs.researched.push('trade');
      civ.technologies.push('trade');
      const withTech = window.EpohiPlayerFeedback.canTrade(gs, civ);
      civ.diplomacy.score = -20;
      const hostile = window.EpohiPlayerFeedback.canTrade(gs, civ);
      return { withoutTech, withTech, hostile };
    });
    expect(result.withoutTech).toBe(false);
    expect(result.withTech).toBe(true);
    expect(result.hostile).toBe(false);
  });

  test('города соперников расходуют еду и растут', async ({ page }) => {
    await ready(page, 1);
    const result = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      const city = gs.rivals[0].cities[0];
      city.population = 1;
      city.food = window.EpohiUtils.growthNeed(1);
      window.EpohiPlayerFeedback.processRivalGrowth(gs);
      return { population: city.population, food: city.food, events: gs.eventLog.map(item => item.eventType) };
    });
    expect(result.population).toBe(2);
    expect(result.food).toBe(0);
    expect(result.events).toContain('rival-city-growth');
  });

  test('находка открывается сразу при прибытии последним очком хода', async ({ page }) => {
    await ready(page, 0);
    const result = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      const unit = gs.units[0];
      unit.x = 5; unit.y = 5; unit.moves = 1; unit.acted = false;
      gs.map[5][5].terrain = 'plains'; gs.map[5][5].revealed = true;
      gs.map[5][6].terrain = 'plains'; gs.map[5][6].revealed = true;
      gs.map[5][6].poi = { type: 'depot', used: false };
      gs.barbarians = [];
      window.__epohiDebug().render();
      const destination = window.EpohiHumansPathing.targetFromTile(gs, 6, 5);
      const assigned = window.EpohiHumansPathing.assignTravelOrder(unit.id, destination);
      return { assigned, status: unit.travelOrder && unit.travelOrder.status, x: unit.x, y: unit.y };
    });
    expect(result.assigned).toBe(true);
    expect(result.x).toBe(6);
    expect(result.y).toBe(5);
    expect(result.status).toBe('awaiting-choice');
    await expect(page.locator('#routePoiModal')).toHaveClass(/show/);
  });

  test('осмотр чужого юнита не оставляет приказы выбранного отряда', async ({ page }) => {
    await ready(page, 1);
    await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      const own = gs.units[0];
      const rival = gs.rivals[0].units[0];
      own.x = 5; own.y = 5; own.moves = 1; own.acted = false;
      rival.x = 7; rival.y = 5; rival.hp = rival.maxHp;
      gs.rivals[0].met = true;
      gs.map[5][5].terrain = 'plains'; gs.map[5][5].revealed = true;
      gs.map[5][6].terrain = 'plains'; gs.map[5][6].revealed = true;
      gs.map[5][7].terrain = 'plains'; gs.map[5][7].revealed = true;
      window.EpohiHumansPathing.assignTravelOrder(own.id, { type:'move', targetKind:'tile', targetId:null, x:6, y:5 });
      window.__epohiDebug().render();
    });
    await page.locator('#map .tile[data-x="7"][data-y="5"]').click();
    await page.waitForTimeout(60);
    await expect(page.locator('#contextActions')).toContainText('Дипломатия');
    await expect(page.locator('#contextActions')).not.toContainText('Охранять');
    await expect(page.locator('#contextActions')).not.toContainText('Отменить');
    await expect(page.locator('#contextActions')).not.toContainText('Идти');
  });

  test('казна нанимает отряд без городской очереди', async ({ page }) => {
    await ready(page, 0);
    const before = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      gs.resources.gold = 100;
      return { units: gs.units.length, gold: gs.resources.gold };
    });
    await page.evaluate(() => window.EpohiPlayerFeedback.openTreasury());
    await page.locator('[data-treasury-action="mercenary"][data-type="scout"]').click();
    const after = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      return { units: gs.units.length, gold: gs.resources.gold, last: gs.units[gs.units.length - 1] };
    });
    expect(after.units).toBe(before.units + 1);
    expect(after.gold).toBe(before.gold - 56);
    expect(after.last.name).toContain('Разведчики вольных земель');
  });

  test('крупные события видны на основном экране', async ({ page }) => {
    await ready(page, 0);
    await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      gs.eventLog.unshift({ eventId:'visible-event', turn:gs.turn, eventType:'city-growth', text:'Ардена выросла до населения 4.', coordinates:{x:gs.city.x,y:gs.city.y} });
      window.__epohiDebug().render();
    });
    await expect(page.locator('#feedbackWorldEvents')).toHaveClass(/show/);
    await expect(page.locator('#feedbackWorldEvents')).toContainText('Ардена выросла');
  });

  test('кнопка возвращения к карте разрешает продолжить после победы', async ({ page }) => {
    await ready(page, 0);
    const turn = await page.evaluate(() => {
      const gs = window.__epohiDebug().state;
      gs.outcome = { version:1, status:'victory', type:'statehood', turn:gs.turn, title:'Государство создано!', summary:'Проверка продолжения.' };
      gs.victory = true;
      window.EpohiHumansOutcomes.sync({ announce:true });
      return gs.turn;
    });
    await expect(page.locator('#victoryModal')).toHaveClass(/show/);
    await page.locator('#outcomeMapBtn').click();
    await expect(page.locator('#victoryModal')).not.toHaveClass(/show/);
    const continued = await page.evaluate(() => window.__epohiDebug().state.continueAfterOutcome);
    expect(continued).toBe(true);
    await page.getByRole('button', { name: /Завершить ход/i }).click();
    await page.waitForFunction(() => !window.__epohiDebug().isTurnProcessing());
    const nextTurn = await page.evaluate(() => window.__epohiDebug().state.turn);
    expect(nextTurn).toBe(turn + 1);
  });
});
