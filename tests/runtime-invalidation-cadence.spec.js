const { test, expect } = require('@playwright/test');

test('runtime invalidation request storm stays below near-frame-rate flush cadence', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.EpohiRuntimeInvalidation));
  await page.waitForFunction(() => !window.EpohiRuntimeInvalidation.stats().scheduled);

  const result = await page.evaluate(async () => {
    const before = window.EpohiRuntimeInvalidation.stats();
    const started = performance.now();
    while (performance.now() - started < 400) {
      window.EpohiRuntimeInvalidation.request('cadence-regression');
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    const after = window.EpohiRuntimeInvalidation.stats();
    return {
      requests: after.requests - before.requests,
      flushes: after.flushes - before.flushes,
      scheduled: after.scheduled
    };
  });

  expect(result.requests).toBeGreaterThanOrEqual(25);
  expect(result.flushes).toBeLessThanOrEqual(12);
  expect(result.scheduled).toBe(false);
});
