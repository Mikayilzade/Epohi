const { test, expect } = require('@playwright/test');

test('observer safety drains a queued mutation before the next animation frame', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.EpohiObserverSafety && window.EpohiPerformance));

  const result = await page.evaluate(async () => {
    const probe = document.createElement('div');
    document.body.appendChild(probe);
    let callbacks = 0;
    const observer = new MutationObserver(() => { callbacks += 1; });
    observer.observe(probe, { attributes: true });

    probe.setAttribute('data-observer-delivery-probe', '1');
    await Promise.resolve();
    await Promise.resolve();
    const afterMicrotasks = callbacks;

    await new Promise(resolve => requestAnimationFrame(() => resolve()));
    const afterFrame = callbacks;
    observer.disconnect();
    probe.remove();
    return { afterMicrotasks, afterFrame };
  });

  expect(result.afterMicrotasks).toBe(1);
  expect(result.afterFrame).toBe(1);
});
