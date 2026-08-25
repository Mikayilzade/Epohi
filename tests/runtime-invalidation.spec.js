const { test, expect } = require("@playwright/test");
const { clearStorage, createGame } = require("./helpers");

test("runtime invalidation replaces broad visual/context polling with bounded flushes", async ({ page }) => {
  const errors = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push(String(err)));

  await page.goto("/");
  await page.waitForFunction(() => window.EpohiRuntimeInvalidation && window.EpohiPerformance);

  const architecture = await page.evaluate(async () => {
    const [contextSource, observerSource, visualSource] = await Promise.all([
      fetch("/src/humans-context-review-cleanup.js").then(r => r.text()),
      fetch("/src/humans-observer.js").then(r => r.text()),
      fetch("/src/humans-visuals.js").then(r => r.text())
    ]);
    return {
      hasBroadContextObserver: contextSource.includes("new MutationObserver") || contextSource.includes("observer.observe(document.body"),
      contextVersion: window.EpohiContextReviewCleanup && window.EpohiContextReviewCleanup.version,
      hasGlobalObserverClickPolling: observerSource.includes('document.addEventListener("click"'),
      observerVersion: window.EpohiHumansObserver && window.EpohiHumansObserver.version,
      hasBroadVisualObserver: visualSource.includes("new MutationObserver"),
      hasVisualClickPolling: visualSource.includes('document.addEventListener("click"') || visualSource.includes("setTimeout(schedule") || visualSource.includes("requestAnimationFrame(decorate)"),
      visualVersion: window.EpohiHumansVisuals && window.EpohiHumansVisuals.version
    };
  });
  expect(architecture.hasBroadContextObserver).toBe(false);
  expect(architecture.contextVersion).toBeGreaterThanOrEqual(3);
  expect(architecture.hasGlobalObserverClickPolling).toBe(false);
  expect(architecture.observerVersion).toBeGreaterThanOrEqual(3);
  expect(architecture.hasBroadVisualObserver).toBe(false);
  expect(architecture.hasVisualClickPolling).toBe(false);
  expect(architecture.visualVersion).toBeGreaterThanOrEqual(2);

  const initial = await page.evaluate(() => ({
    safety: window.EpohiPerformance.snapshot(),
    invalidation: window.EpohiRuntimeInvalidation.stats(),
    observer: window.EpohiHumansObserver && window.EpohiHumansObserver.stats(),
    feedbackVersion: window.EpohiPlayerFeedbackStabilization && window.EpohiPlayerFeedbackStabilization.version,
    hasStackSync: !!(window.EpohiPlayerFeedbackStabilization && window.EpohiPlayerFeedbackStabilization.addStackSelectionAcknowledgement),
    hasProtectedBridge: !!(window.EpohiObserverSafety && typeof window.EpohiObserverSafety.runProtected === "function"),
    safetyMode: window.EpohiObserverSafety && window.EpohiObserverSafety.mode
  }));

  expect(initial.invalidation.broadObservers).toBe(0);
  expect(initial.observer && initial.observer.broadObservers).toBe(0);
  expect(initial.observer && initial.observer.clickSignals).toBe(0);
  expect(initial.feedbackVersion).toBeGreaterThanOrEqual(5);
  expect(initial.hasStackSync).toBe(true);
  expect(initial.hasProtectedBridge).toBe(true);
  expect(initial.safetyMode).toBe("observer-local");

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
  expect(settled.invalidation.visualSyncs).toBeGreaterThan(0);
  expect(settled.invalidation.visualSyncs).toBeLessThanOrEqual(settled.invalidation.flushes);
  expect(settled.invalidation.feedbackSyncs).toBeGreaterThan(0);
  expect(settled.invalidation.feedbackSyncs).toBeLessThanOrEqual(settled.invalidation.flushes);
  expect(settled.invalidation.protectedFlushes).toBe(0);
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
  expect(bridgeAfter.protectedFlushes).toBe(bridgeBefore.protectedFlushes);
  expect(bridgeAfter.protectedFlushes).toBe(0);
  expect(bridgeAfter.callbacks - bridgeBefore.callbacks).toBeLessThanOrEqual(3);
  expect(bridgeAfter.scheduled).toBe(false);

  // The bounded synthetic invalidation assertions above intentionally run on the quiet
  // main menu. Enter gameplay only for the interaction checks so their target controls
  // are visible without contaminating the strict coalescing thresholds with startup work.
  await clearStorage(page);
  await createGame(page, 0, "small");
  await page.waitForFunction(() => window.EpohiRuntimeInvalidation && window.EpohiPerformance);
  await page.waitForTimeout(100);

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
  expect(clickAfter.invalidation.visualSyncs - clickBefore.invalidation.visualSyncs).toBeLessThanOrEqual(2);
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

  const idleBefore = await page.evaluate(() => ({
    flushes: window.EpohiRuntimeInvalidation.stats().flushes,
    visualSyncs: window.EpohiRuntimeInvalidation.stats().visualSyncs,
    callbacks: window.EpohiPerformance.snapshot().observerCallbacks
  }));
  await page.waitForTimeout(1200);
  const idleAfter = await page.evaluate(() => ({
    flushes: window.EpohiRuntimeInvalidation.stats().flushes,
    visualSyncs: window.EpohiRuntimeInvalidation.stats().visualSyncs,
    callbacks: window.EpohiPerformance.snapshot().observerCallbacks
  }));
  expect(idleAfter.flushes - idleBefore.flushes).toBeLessThanOrEqual(1);
  expect(idleAfter.visualSyncs - idleBefore.visualSyncs).toBeLessThanOrEqual(1);
  expect(idleAfter.callbacks - idleBefore.callbacks).toBeLessThanOrEqual(3);
  expect(errors).toEqual([]);
});
