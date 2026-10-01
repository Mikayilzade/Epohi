const { test, expect } = require('@playwright/test');

test('barbarian keeps civilian priority while scanning candidate tiles once', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const map = Array.from({ length:6 }, () => Array.from({ length:6 }, () => ({ terrain:'plains' })));
    map[1][2].improvement = 'farm';
    let scans = 0;
    map.forEach = function (callback) {
      scans += 1;
      return Array.prototype.forEach.call(this, callback);
    };
    const state = {
      map, settlements:[], rivals:[], city:{ x:5, y:5 },
      units:[
        { id:'soldier', type:'warrior', x:2, y:2 },
        { id:'civilian', type:'worker', x:4, y:4 }
      ]
    };
    const target = window.EpohiBarbarianTargeting.nearestTarget(state,
      { x:0, y:0, homeX:0, homeY:0 }, () => { throw new Error('random target unexpected'); });
    return { kind:target.kind, id:target.unit.id, scans };
  });
  expect(result).toEqual({ kind:'civilian', id:'civilian', scans:1 });
});

test('barbarian wandering consumes exactly two random draws', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const state = { map:[[{ terrain:'plains' }]], settlements:[], rivals:[],
      units:[], city:{ x:20, y:20 } };
    const values = [0, 0.9];
    const target = window.EpohiBarbarianTargeting.nearestTarget(state,
      { x:5, y:5, homeX:5, homeY:5 }, () => values.shift());
    return { target, remaining:values.length };
  });
  expect(result).toEqual({ target:{ x:4, y:6 }, remaining:0 });
});
