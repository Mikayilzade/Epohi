const { test, expect } = require('@playwright/test');

test('AI goal scoring records visible threats and a later attack opportunity', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const map = Array.from({ length:4 }, () => Array.from({ length:4 }, () => ({ terrain:'plains' })));
    const explored = {};
    for (let y=0; y<4; y++) for (let x=0; x<4; x++) explored[x + ',' + y] = true;
    const civ = {
      visible:{ '1,1':true }, explored, cities:[{}, {}, {}],
      resources:{ gold:0 }, units:[{ type:'warrior' }, { type:'warrior' }],
      decisionHistory:[]
    };
    const game = { map, mapSize:4, turn:20, units:[{ id:'player-unit', type:'scout', x:1, y:1 }] };
    const options = { mapSize:4, knowsCamp:() => false };
    const defense = window.EpohiAiStrategy.chooseGoal(game, civ, options);
    const threats = civ.currentThreats.slice();
    civ.visible = {};
    const attack = window.EpohiAiStrategy.chooseGoal(game, civ, options);
    return { defense, threats, attack, history:civ.decisionHistory.length };
  });
  expect(result).toEqual({ defense:'защита', threats:['player-unit'], attack:'нападение на игрока', history:2 });
});
