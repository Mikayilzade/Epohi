const { test, expect } = require('@playwright/test');
const { clearStorage, createGame, watchConsole, expectNoConsoleProblems } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'normal');
});

test('city, unit and tile inspection retain the world tree and switch the portrait', async ({ page }) => {
  const problems = watchConsole(page);
  const position = await page.evaluate(() => {
    const debug = window.__epohiDebug();
    const city = debug.state.city;
    debug.state.units[0].x = city.x;
    debug.state.units[0].y = city.y;
    debug.render();
    window.EpohiHumansVisuals.decorate();
    window.__v2FirstTile = document.querySelector('#map .tile');
    window.__v2SpriteRules = document.getElementById('humansVisualSpriteRegistry').sheet.cssRules.length;
    window.__v2MapMutations = 0;
    window.__v2MapObserver = new MutationObserver(records => { window.__v2MapMutations += records.length; });
    window.__v2MapObserver.observe(document.getElementById('map'), { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    return { x: city.x, y: city.y, type: debug.state.units[0].type };
  });
  const tile = page.locator(`.tile[data-x="${position.x}"][data-y="${position.y}"]`);
  await tile.click();
  await page.locator('.inspect-tab[data-inspect-layer="city"]').evaluate(button => button.click());
  await expect(page.locator('#contextPanel')).toHaveAttribute('data-visual-kind', 'capital');
  await page.locator('.inspect-tab[data-inspect-layer="unit"]').evaluate(button => button.click());
  await expect(page.locator('#contextPanel')).toHaveAttribute('data-visual-kind', position.type);
  await page.locator('.inspect-tab[data-inspect-layer="tile"]').evaluate(button => button.click());
  await page.locator('.inspect-tab[data-inspect-layer="city"]').evaluate(button => button.click());
  await expect(page.locator('#contextPanel')).toHaveAttribute('data-visual-kind', 'capital');
  const result = await page.evaluate(() => {
    window.__v2MapMutations += window.__v2MapObserver.takeRecords().length;
    window.__v2MapObserver.disconnect();
    return {
      sameWorld: document.querySelector('#map .tile') === window.__v2FirstTile,
      sameRuleCount: document.getElementById('humansVisualSpriteRegistry').sheet.cssRules.length === window.__v2SpriteRules,
      mapMutations: window.__v2MapMutations,
      portrait: getComputedStyle(document.getElementById('contextPanel'), '::after').backgroundImage
    };
  });
  expect(result.sameWorld).toBe(true);
  expect(result.sameRuleCount).toBe(true);
  expect(result.mapMutations).toBeLessThan(100);
  if (test.info().project.name === 'chromium-desktop') expect(result.portrait).toContain('city-center.png');
  await expectNoConsoleProblems(problems);
});

test('Wiki Unit Atlas shares map sprites and distinguishes future and legacy art', async ({ page }) => {
  await page.locator('#menuBtn').click();
  await page.locator('#wikiBtn').click();
  await expect(page.locator('#unitAtlas .unit-atlas-card')).toHaveCount(8);
  await expect(page.locator('#unitAtlas [data-visual-id="archer"]')).toContainText('PLACEHOLDER');
  await expect(page.locator('#unitAtlas [data-visual-id="rider"]')).toContainText('LEGACY');
  await expect(page.locator('#unitAtlas [data-visual-id="worker"] .piece.unit')).toHaveClass(/canon-raster-worker/);
  await expect(page.locator('#wikiContent .wiki-unit-card .has-art-sprite')).toHaveCount(6);
  await expect(page.locator('#wikiContent')).toContainText('не тратят производство города');
});

test('new terrain and world object art is assigned by map visual decorator', async ({ page }) => {
  const result = await page.evaluate(() => {
    const debug = window.__epohiDebug();
    const state = debug.state;
    const city = state.city;
    const positions = [];
    const items = [
      { terrain: 'plains', feature: 'gems', poi: { type: 'grove', used: false } },
      { terrain: 'swamp', feature: null, poi: { type: 'mine', used: false } },
      { terrain: 'water', feature: 'fish', poi: null },
      { terrain: 'plains', feature: 'wheat', poi: null, improvement: 'lumber' },
      { terrain: 'hill', feature: 'ore', poi: null, improvement: 'mine' }
    ];
    items.forEach((item, index) => {
      const x = city.x + index - 2;
      const y = city.y + 3;
      Object.assign(state.map[y][x], item, { revealed: true, camp: null });
      positions.push({ x, y });
    });
    debug.render();
    window.EpohiHumansVisuals.decorate();
    return positions.map(({ x, y }) => {
      const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
      return { classes: tile.className, poi: tile.querySelector('.piece.poi')?.className,
        feature: tile.querySelector('.feature')?.dataset.artKind,
        improvement: tile.querySelector('.improvement')?.className };
    });
  });
  expect(result[0].classes).toContain('canon-raster-plains');
  expect(result[0].poi).toContain('canon-raster-poi-grove');
  expect(result[0].feature).toBe('gems');
  expect(result[1].classes).toContain('canon-raster-swamp');
  expect(result[1].poi).toContain('canon-raster-poi-mine');
  expect(result[2].feature).toBe('fish');
  expect(result[3].improvement).toContain('canon-raster-lumber');
  expect(result[4].improvement).toContain('canon-raster-mine');
});
