const { test, expect } = require('@playwright/test');

test('terrain uses genuine cached compositions before supplementary mirroring', async ({ page }) => {
  await page.goto('/');
  const sources = await page.evaluate(() => {
    const result = {};
    for (const terrain of ['forest', 'hill', 'swamp', 'dead']) {
      result[terrain] = [];
      for (let variant = 0; variant < 4; variant++) {
        const tile = document.createElement('div');
        tile.className = `tile painted-tile canon-raster-${terrain}`;
        tile.dataset.canonVariant = String(variant);
        document.body.appendChild(tile);
        const style = getComputedStyle(tile, '::before');
        result[terrain].push({ image: style.backgroundImage, transform: style.transform });
        tile.remove();
      }
    }
    return result;
  });
  expect(new Set(sources.forest.map(entry => entry.image)).size).toBe(3);
  expect(new Set(sources.hill.map(entry => entry.image)).size).toBe(3);
  expect(new Set(sources.swamp.map(entry => entry.image)).size).toBe(3);
  expect(new Set(sources.dead.map(entry => entry.image)).size).toBe(2);
  expect(sources.forest[0].image).toContain('forest-cluster.png');
  expect(sources.hill[0].image).toContain('hill-relief.png');
});
