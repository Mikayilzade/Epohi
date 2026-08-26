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

test('observer safety yields under cross-observer feedback instead of starving timers', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.EpohiObserverSafety && window.EpohiPerformance));

  const result = await page.evaluate(async () => {
    const left = document.createElement('div');
    const right = document.createElement('div');
    document.body.append(left, right);

    let leftCallbacks = 0;
    let rightCallbacks = 0;
    const leftObserver = new MutationObserver(() => {
      leftCallbacks += 1;
      right.setAttribute('data-feedback', String(leftCallbacks));
    });
    const rightObserver = new MutationObserver(() => {
      rightCallbacks += 1;
      left.setAttribute('data-feedback', String(rightCallbacks));
    });
    leftObserver.observe(left, { attributes: true });
    rightObserver.observe(right, { attributes: true });

    let timerFired = false;
    const yieldTimer = new Promise(resolve => setTimeout(() => {
      timerFired = true;
      resolve();
    }, 25));

    left.setAttribute('data-feedback', 'start');
    await yieldTimer;
    const callbacksAtYield = leftCallbacks + rightCallbacks;
    await new Promise(resolve => setTimeout(resolve, 120));
    const callbacksAfterSettle = leftCallbacks + rightCallbacks;

    leftObserver.disconnect();
    rightObserver.disconnect();
    left.remove();
    right.remove();
    return { timerFired, callbacksAtYield, callbacksAfterSettle };
  });

  expect(result.timerFired).toBe(true);
  expect(result.callbacksAtYield).toBeLessThanOrEqual(4);
  expect(result.callbacksAfterSettle).toBeLessThanOrEqual(8);
});
