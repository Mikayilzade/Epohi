const { test, expect } = require('@playwright/test');

test.describe('Fresh-game explicit settled lifecycle', () => {
  test('settled signal is delivered only after the new campaign state exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#newGameScreenBtn')).toBeVisible();

    await page.evaluate(() => {
      window.__freshGameSettledProbe = [];
      document.addEventListener('epohi:humans-ui-settled', event => {
        const debug = typeof window.__epohiDebug === 'function' ? window.__epohiDebug() : null;
        window.__freshGameSettledProbe.push({
          hasState: Boolean(debug && debug.state),
          source: event.detail && event.detail.source ? event.detail.source : null
        });
      });
    });

    await page.locator('#newGameScreenBtn').click();
    await page.locator('#partySize').selectOption('small');
    await page.locator('#barbarianActivity').selectOption('off');
    await page.locator('#rivalCount').selectOption('0');
    await page.locator('#partyName').fill('Lifecycle regression');
    await page.locator('#createParty').click();

    await page.waitForFunction(() => window.__freshGameSettledProbe.some(item =>
      item.hasState && item.source === 'new-game-created-post-transition'
    ));

    const probe = await page.evaluate(() => window.__freshGameSettledProbe.slice());
    expect(probe.some(item => item.hasState && item.source === 'new-game-created-post-transition')).toBe(true);

    // The autonomy module consumes the same canonical boundary. Keep the existing
    // 1-second actionability contract while proving the explicit lifecycle reaches it.
    await expect(page.locator('#autonomyReportBtn')).toHaveCount(1, { timeout: 1000 });
  });
});
