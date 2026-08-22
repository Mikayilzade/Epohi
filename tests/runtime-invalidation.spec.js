const { test, expect } = require("@playwright/test");

test("runtime invalidation replaces broad visual/context polling with bounded flushes", async ({ page }) => {
  const errors = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(String(err)));

  await page.goto("/");
  await page.waitForFunction(() => window.EpohiRuntimeInvalidation && window.EpohiPerformance);

  const architecture = await page.evaluate(async () => {
    const [contextSource, observerSource] = await Promise.all([
      fetch("/src/humans-context-review-cleanup.js").then(r => r.text()),
      fetch("/src/humans-observer.js").then(r => r.text())
    ]);
    return {
      hasBroadContextObserver: contextSource.includes("new MutationObserver") || contextSource.includes("observer.observe(document.body"),
      contextVersion: window.EpohiContextReviewCleanup && window.EpohiContextReviewCleanup.version,
      hasGlobalObserverClickPolling: observerSource.includes('document.addEventListener("click"'),
      observerVersion: window.EpohiHumansObserver && window.EpohiHumansObserver.version
    };
  });
  expect(architecture.hasBroadContextObserver).toBe(false);
  expect(architecture.contextVersion).toBeGreaterThanOrEqual(3);
  expect(architecture.hasGlobalObserverClickPolling).toBe(false);
  expect(architecture.observerVersion).toBeGreaterThanOrEqual(3);

  const initial = await page.evaluate(() => ({
    safety: window.EpohiPerformance.snapshot(),
    invalidation: window.EpohiRuntimeInvalidation.stats(),
    observer: window.EpohiHumansObserver && window.EpohiHumansObserver.stats(),
    feedbackVersion: window.EpohiPlayerFeedbackStabilization && window.EpohiPlayerFeedbackStabilization.version,
    hasStackSync: !!(window.EpohiPlayerFeedbackStabilization && window.EpohiPlayerFeedbackStabilization.addStackSelectionAcknowledgement),
    hasProtectedBridge: !!(window.EpohiObserverSafety && typeof window.EpohiObserverSafety.runProtected === "function")
  }));

  expect(initial.invalidation.broadObservers).toBe(0);
  expect(initial.safety.observerSuppressedHeavy).toBeGreaterThanOrEqual(2);
  expect(initial.observer && initial.observer.broadObservers).toBe(0);
  expect(initial.observer && initial.observer.clickSignals).toBe(0);
  expect(initial.feedbackVersion).toBeGreaterThanOrEqual(5);
  expect(initial.hasStackSync).toBe(true);
  expect(initial.hasProtectedBridge).toBe(true);

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
  expect(settled.invalidation.protectedFlushes).toBeGreaterThan(0);
  expect(settled.invalidation.protectedFlushes).toBeLessThanOrEqual(settled.invalidation.flushes);
  expect(settled.invalidation.scheduled).toBe(false);

  const bridgeBefore = await page.evaluate(() => ({
    callbacks: window.EpohiPerformance.snapshot().observerCallbacks,
    protectedFlushes: window.EpohiRuntimeInvalidation.stats().protectedFlushes
  }));
  await page.evaluate(() => {
    for (let i = 0; i < 30; i += 1) window.EpohiRuntimeInvalidation.request("protected-render-churn");
  });
  await page.waitForTimeout(200);
  const bridgeAfter = await page.evaluate(() => ({
    callbacks: window.EpohiPerformance.snapshot().observerCallbacks,
    protectedFlushes: window.EpohiRuntimeInvalidation.stats().protectedFlushes,
    scheduled: window.EpohiRuntimeInvalidation.stats().scheduled
  }));
  expect(bridgeAfter.protectedFlushes).toBeGreaterThan(bridgeBefore.protectedFlushes);
  expect(bridgeAfter.callbacks - bridgeBefore.callbacks).toBeLessThanOrEqual(3);
  expect(bridgeAfter.scheduled).toBe(false);

  const clickBefore = await page.evaluate(() => ({
    observer: window.EpohiHumansObserver.stats(),
    invalidation: window.EpohiRuntimeInvalidation.stats()
  }));
  await page.locator("#menuBtn").click();
  await page.waitForTimeout(120);
  const clickAfter = await page.evaluate(() => ({
    observer: window.EpohiHumansObserver.stats(),
    invalidation: window.EpohiRuntimeInvalidation.stats()
  }));
  expect(clickAfter.observer.clickSignals - clickBefore.observer.clickSignals).toBe(0);
  expect(clickAfter.invalidation.actionSignals - clickBefore.invalidation.actionSignals).toBe(1);
  expect(clickAfter.invalidation.flushes - clickBefore.invalidation.flushes).toBeLessThanOrEqual(2);
  await page.locator('[data-close="menuModal"]').click();

  const feedbackBefore = clickAfter.invalidation.feedbackSyncs;
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

  const contextBefore = await page.evaluate(() => ({
    count: document.getElementById("contextActions").dataset.actionCount || "",
    requests: window.EpohiRuntimeInvalidation.stats().requests
  }));
  await page.evaluate(() => {
    const actions = document.getElementById("contextActions");
    const button = document.createElement("button");
    button.className = "context-btn";
    button.dataset.contextAction = "test-explicit-sync";
    button.textContent = "Test";
    actions.appendChild(button);
    window.EpohiRuntimeInvalidation.request("context-explicit-sync");
  });
  await page.waitForTimeout(120);
  const contextAfter = await page.evaluate(() => ({
    count: document.getElementById("contextActions").dataset.actionCount,
    requests: window.EpohiRuntimeInvalidation.stats().requests,
    scheduled: window.EpohiRuntimeInvalidation.stats().scheduled
  }));
  expect(Number(contextAfter.count)).toBeGreaterThan(Number(contextBefore.count || 0));
  expect(contextAfter.requests).toBeGreaterThan(contextBefore.requests);
  expect(contextAfter.scheduled).toBe(false);

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