const { test, expect } = require('@playwright/test');
const world = require('../src/humans-world-generation');
const { clearStorage, createGame } = require('./helpers');

test('seed and profile reproduce a valid 28x28 world with terrain-compatible resources', () => {
  for (const profileId of Object.keys(world.PROFILES)) {
    const options = { size: 28, seed: 20261004, profileId, poiIds: ['ruins', 'grove', 'mine'] };
    const first = world.generate(options), second = world.generate(options);
    expect(second.map).toEqual(first.map);
    expect(first.diagnostics.invalid).toBe(0);
    expect(first.diagnostics.poi).toBeGreaterThan(0);
    expect(first.map[14][14].terrain).toBe('plains');
    expect(first.map.flat().filter(tile => tile.terrain === 'water').every(tile => world.WATER_KINDS.includes(tile.waterKind))).toBe(true);
  }
});

test('marine coast/sea and enclosed lake classification is orthogonal and preserves old metadata', () => {
  const map = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ({ terrain: 'plains' })));
  for (const [x, y] of [[0, 2], [1, 2], [2, 2], [0, 3], [1, 3], [2, 3], [0, 4], [1, 4], [2, 4], [4, 5], [5, 5]]) map[y][x].terrain = 'water';
  world.classifyWater(map);
  expect(map[3][1].waterKind).toBe('sea');
  expect(map[2][2].waterKind).toBe('coast');
  expect(map[5][4].waterKind).toBe('lake');
  map[5][4].waterKind = 'river';
  world.classifyWater(map, true);
  expect(map[5][4].waterKind).toBe('river');
  expect(map[5][5].waterKind).toBe('lake');
});

test('new game defaults to balanced and old saves gain only missing water semantics', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'normal');
  const result = await page.evaluate(() => {
    const debug = window.__epohiDebug();
    const original = debug.createNewGame(28, 0, 'off', { seed: 42 });
    const copy = structuredClone(original);
    const before = copy.map.map(row => row.map(tile => [tile.terrain, tile.feature, tile.poi && tile.poi.type]));
    for (const tile of copy.map.flat()) delete tile.waterKind;
    const migrated = debug.migrateState(copy);
    const after = migrated.map.map(row => row.map(tile => [tile.terrain, tile.feature, tile.poi && tile.poi.type]));
    return { profile: original.environmentProfile, seed: original.mapSeed, before, after,
      missing: migrated.map.flat().filter(tile => tile.terrain === 'water' && !tile.waterKind).length,
      reproducible: JSON.stringify(debug.createNewGame(28, 0, 'off', { seed: 42 }).map.map(row => row.map(tile => [tile.terrain, tile.feature, tile.poi && tile.poi.type, tile.camp && tile.camp.campId]))) ===
        JSON.stringify(original.map.map(row => row.map(tile => [tile.terrain, tile.feature, tile.poi && tile.poi.type, tile.camp && tile.camp.campId]))) };
  });
  expect(result.profile).toBe('balanced');
  expect(result.seed).toBe(42);
  expect(result.before).toEqual(result.after);
  expect(result.missing).toBe(0);
  expect(result.reproducible).toBe(true);
});

test('dev URL chooses a profile and seed only for a new game', async ({ page }) => {
  await clearStorage(page);
  await page.goto('/?worldProfile=marshland&worldSeed=314');
  await page.getByRole('button', { name: 'Новая игра' }).click();
  await page.locator('#rivalCount').selectOption('0');
  await page.locator('#partyName').fill('Profile preview');
  await page.getByRole('button', { name: 'Создать мир' }).click();
  await expect(page.locator('#map .tile')).toHaveCount(28 * 28);
  const profile = await page.evaluate(() => {
    const state = window.__epohiDebug().state;
    return { profileId: state.environmentProfile, seed: state.mapSeed,
      waterKindMissing: state.map.flat().filter(tile => tile.terrain === 'water' && !tile.waterKind).length };
  });
  expect(profile).toEqual({ profileId: 'marshland', seed: '314', waterKindMissing: 0 });
});
