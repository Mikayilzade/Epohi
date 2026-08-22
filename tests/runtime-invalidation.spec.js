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
    observer: window.EpohiHumansObserver && window.EpohiHumansObserver.stats(),
    feedbackVersion: window.EpohiPlayerFeedbackStabilization && window.EpohiPlayerFeedbackStabilization.version,
    hasStackSync: !!(window.EpohiPlayerFeedbackStabilization && window.EpohiPlayerFeedbackStabilization.addStackSelectionAcknowledgement)
  }));

  expect(initial.invalidation.broadObservers).toBe(0);
  expect(initial.safety.observerSuppressedHeavy).toBeGreaterThanOrEqual(4);
  expect(initial.observer && initial.observer.broadObservers).toBe(0);
  expect(initial.feedbackVersion).toBeGreaterThanOrEqual(5);
  expect(initial.hasStackSync).toBe(true);

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
  expect(settled.invalidation.feedbackSyncs).toBeGreaterThan(0);
  expect(settled.invalidation.feedbackSyncs).toBeLessThanOrEqual(settled.invalidation.flushes);
  expect(settled.invalidation.scheduled).toBe(false);

  const feedbackBefore = settled.invalidation.feedbackSyncs;
  await page.evaluate(() => {
    const title = document.getElementById("contextTitle");
    const text = document.getElementById("contextText");
    if (title && text) {
      title.textContent = "Клетка тест";
      text.textContent = "Описание · Стоимость движения: 99";
    }
    window.EpohiRuntimeInvalidation.request("feedback-regression");
  });
  await page.waitForTimeout(100);
  const feedbackAfter = await page.evaluate(() => window.EpohiRuntimeInvalidation.stats());
  expect(feedbackAfter.feedbackSyncs).toBeGreaterThan(feedbackBefore);

  const observerBeforeOutcomeChurn = await page.evaluate(() => window.EpohiPerformance.snapshot().observerCallbacks);
  await page.evaluate(() => {
    const content = document.getElementById("victoryContent");
    if (!content) return;
    for (let i = 0; i < 40; i += 1) {
      const button = document.createElement("button");
      button.id = i % 2 ? "outcomeGoalsBtn" : "outcomeMapBtn";
      button.textContent = "transient";
      content.appendChild(button);
    }
    window.EpohiRuntimeInvalidation.request("outcome-content-churn");
  });
  await page.waitForTimeout(250);
  const outcomeState = await page.evaluate(() => ({
    callbacks: window.EpohiPerformance.snapshot().observerCallbacks,
    duplicateOutcomeButtons: document.querySelectorAll("#victoryContent #outcomeGoalsBtn, #victoryContent #outcomeMapBtn").length,
    scheduled: window.EpohiRuntimeInvalidation.stats().scheduled
  }));
  expect(outcomeState.duplicateOutcomeButtons).toBe(0);
  expect(outcomeState.callbacks - observerBeforeOutcomeChurn).toBeLessThanOrEqual(3);
  expect(outcomeState.scheduled).toBe(false);

  const beforeIdle = await page.evaluate(() => window.EpohiRuntimeInvalidation.stats().flushes);
  await page.waitForTimeout(1200);
  const afterIdle = await page.evaluate(() => window.EpohiRuntimeInvalidation.stats().flushes);
  expect(afterIdle - beforeIdle).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
