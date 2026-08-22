const { test, expect } = require("@playwright/test");

test("runtime invalidation replaces broad visual/context polling with bounded flushes", async ({ page }) => {
  const errors = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(String(err)));

  await page.goto("/");
  await page.waitForFunction(() => window.EpohiRuntimeInvalidation && window.EpohiPerformance);

  const initial = await page.evaluate(() => ({
    safety: window.EpohiPerformance.snapshot(),
    invalidation: window.EpohiRuntimeInvalidation.stats(),
    observer: window.EpohiHumansObserver && window.EpohiHumansObserver.stats()
  }));

  expect(initial.invalidation.broadObservers).toBe(0);
  expect(initial.safety.observerSuppressedHeavy).toBeGreaterThanOrEqual(4);
  expect(initial.observer && initial.observer.broadObservers).toBe(0);

  for (let i = 0; i < 40; i += 1) {
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent("epohi:humans-ui-settled", {
        detail: { source: "test", reason: "cycle" }
      }));
      window.EpohiRuntimeInvalidation.request("test-cycle");
    });
  }

  await page.waitForTimeout(250);

  const settled = await page.evaluate(() => ({
    invalidation: window.EpohiRuntimeInvalidation.stats(),
    safety: window.EpohiPerformance.snapshot()
  }));

  expect(settled.invalidation.requests).toBeGreaterThanOrEqual(40);
  expect(settled.invalidation.flushes).toBeLessThan(15);
  expect(settled.invalidation.scheduled).toBe(false);

  const beforeIdle = settled.invalidation.flushes;
  await page.waitForTimeout(1200);
  const afterIdle = await page.evaluate(() => window.EpohiRuntimeInvalidation.stats().flushes);
  expect(afterIdle - beforeIdle).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});