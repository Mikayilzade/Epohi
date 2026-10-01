const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('full administration capacity rejects founding before the name prompt', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');
  const result = await page.evaluate(() => {
    const debug = window.__epohiDebug();
    const state = debug.state;
    const settler = { id:'capacity-test', type:'settler', x:state.city.x,
      y:state.city.y, acted:false, moves:1, hp:70, maxHp:70 };
    state.units.push(settler);
    state.cityCapacity = state.cities.length;
    const before = { cities:state.cities.length, units:state.units.length,
      events:state.eventCounter };
    window.prompt = () => { throw new Error('Blocked founding opened name prompt'); };
    const reason = debug.foundCityBlockReason(settler);
    const founded = debug.foundCity(settler.id);
    return { reason, founded, before, after:{ cities:state.cities.length,
      units:state.units.length, events:state.eventCounter } };
  });
  expect(result.reason).toContain('административная ёмкость исчерпана');
  expect(result.founded).toBe(false);
  expect(result.after).toEqual(result.before);
});
