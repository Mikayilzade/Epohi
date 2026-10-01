const { test, expect } = require('@playwright/test');

test('rival production heals, earns city income, then rushes a threatened queue', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const civ = {
      civilizationId: 'civ-test', name: 'Test', relation: 'neutral',
      resources: { gold: 20, science: 0 },
      units: [{ id:'hurt', type:'warrior', x:2, y:2, hp:20, maxHp:100 }],
      cities: [{ name:'Capital', x:2, y:2, food:0,
        queue:{ type:'unit', id:'warrior', progress:10, cost:30 } }]
    };
    const state = { barbarians:[{ x:3, y:2 }], units:[], nextRivalUnitId:1 };
    const events = [];
    window.EpohiAiProduction.produceForAi(state, civ, {
      cityIncome: () => ({ food:2, gold:9, science:1, production:3 }),
      recordCompletion: () => { throw new Error('queue should remain open'); },
      logEvent: (_state, type) => events.push(type)
    });
    return { gold:civ.resources.gold, science:civ.resources.science,
      hp:civ.units[0].hp, food:civ.cities[0].food,
      progress:civ.cities[0].queue.progress, events };
  });
  expect(result).toEqual({ gold:1, science:1, hp:55, food:2,
    progress:21, events:['rival-emergency-heal', 'rival-production-rush'] });
});

test('rival production completes a unit and records experience once', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const civ = {
      civilizationId:'civ-test', name:'Test', relation:'neutral',
      resources:{ gold:0, science:0 }, units:[],
      cities:[{ name:'Capital', x:2, y:2, food:0,
        queue:{ type:'unit', id:'scout', progress:9, cost:10 } }]
    };
    const state = { barbarians:[], units:[], nextRivalUnitId:7 };
    const completions = [], events = [];
    window.EpohiAiProduction.produceForAi(state, civ, {
      cityIncome: () => ({ food:0, gold:0, science:0, production:1 }),
      recordCompletion: (_civ, kind, id) => completions.push([kind, id]),
      logEvent: (_state, type) => events.push(type)
    });
    return { id:civ.units[0].id, moves:civ.units[0].moves,
      queue:civ.cities[0].queue, nextId:state.nextRivalUnitId,
      completions, events };
  });
  expect(result).toEqual({ id:'ru7', moves:0, queue:null, nextId:8,
    completions:[['unit', 'scout']], events:['city-production-completed'] });
});
