const { test, expect } = require('@playwright/test');

test('runtime invalidation cadence stays bounded across consecutive storms', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.EpohiRuntimeInvalidation));
  await page.waitForFunction(() => !window.EpohiRuntimeInvalidation.stats().scheduled);

  const samples = await page.evaluate(async () => {
    async function runStorm() {
      const before = window.EpohiRuntimeInvalidation.stats();
      const started = performance.now();
      while (performance.now() - started < 400) {
        window.EpohiRuntimeInvalidation.request('repeat-cadence-regression');
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      await new Promise(resolve => setTimeout(resolve, 120));
      const after = window.EpohiRuntimeInvalidation.stats();
      return {
        requests: after.requests - before.requests,
        flushes: after.flushes - before.flushes,
        scheduled: after.scheduled
      };
    }

    return [await runStorm(), await runStorm()];
  });

  for (const sample of samples) {
    expect(sample.requests).toBeGreaterThanOrEqual(25);
    expect(sample.flushes).toBeLessThanOrEqual(12);
    expect(sample.scheduled).toBe(false);
  }
});
