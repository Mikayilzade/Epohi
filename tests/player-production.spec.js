const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('player city completion and growth are applied in one turn', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');
  const before = await page.evaluate(() => {
    const debug = window.__epohiDebug();
    const state = debug.state;
    const city = state.cities[0];
    const income = debug.cityIncome(city);
    city.queue = { type:'building', id:'monument', progress:17, cost:18, upfront:{} };
    city.food = window.EpohiUtils.growthNeed(city.population) - income.food;
    state.barbarianActivity = 'off';
    return { turn:state.turn, experience:state.experience.buildings.monument || 0 };
  });
  await page.evaluate(() => window.__epohiDebug().endTurn());
  await page.waitForFunction(turn => window.__epohiDebug().state.turn > turn
    && !window.__epohiDebug().isTurnProcessing(), before.turn);
  const after = await page.evaluate(() => {
    const state = window.__epohiDebug().state;
    const city = state.cities[0];
    return {
      population:city.population,
      queue:city.queue,
      completed:city.buildings.includes('monument'),
      experience:state.experience.buildings.monument || 0,
      events:state.eventLog.filter(item => ['city-growth','city-production-completed']
        .includes(item.eventType)).slice(0,2).map(item => item.eventType)
    };
  });
  expect(after).toEqual({
    population:2, queue:null, completed:true,
    experience:before.experience + 1,
    events:['city-growth','city-production-completed']
  });
});

test('queue commands charge, refund and rush from structured state', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');
  const result = await page.evaluate(() => {
    const state = window.__epohiDebug().state;
    const city = state.cities[0];
    const production = window.EpohiPlayerProduction;
    const events = [];
    const options = {
      logEvent:(_state,type) => events.push(type),
      makePlayerUnit:() => { throw new Error('No unit expected'); },
      revealAround:() => {}
    };
    state.researched.push('writing');
    state.resources.gold = 8;
    const started = production.startQueue(state,city,'building','library',options);
    const charged = state.resources.gold;
    const busy = production.startQueue(state,city,'building','monument',options);
    const cancelled = production.cancelQueue(state,city);
    const refunded = state.resources.gold;
    production.startQueue(state,city,'building','monument',options);
    city.production = city.queue.cost;
    const rushed = production.rushQueue(state,city,options);
    return { started, charged, busy, cancelled, refunded,
      completed:rushed.completed.text, queue:city.queue, production:city.production,
      built:city.buildings.includes('monument'), events };
  });
  expect(result).toMatchObject({ started:'started', charged:2, busy:'busy',
    cancelled:true, refunded:8, queue:null, production:0, built:true,
    events:['city-production-started','city-production-started','city-production-completed'] });
  expect(result.completed).toContain('Монумент');
});
