const { test, expect } = require('@playwright/test');

test('combat profiles preserve direct, guard and route damage rules', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const rules = window.EpohiCombatRules;
    const tile = { terrain:'forest', improvement:'lumber', pillaged:false };
    return {
      directLow: rules.damage('direct', 20, 10, 0),
      directHigh: rules.damage('direct', 20, 10, 1),
      guardMid: rules.damage('guard', 20, 10, 0.5),
      route: rules.damage('route', 20, 10),
      floor: rules.damage('direct', 1, 100, 0),
      terrainWithSettlement: rules.terrainBonus(tile, 10, true),
      terrainWithoutSettlement: rules.terrainBonus(tile, 10, false),
      routeTerrain: rules.terrainAdjustedDefense(tile, 10)
    };
  });
  expect(result).toEqual({
    directLow:14, directHigh:19, guardMid:17, route:17, floor:4,
    terrainWithSettlement:9, terrainWithoutSettlement:4, routeTerrain:12
  });
});
