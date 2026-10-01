const { test, expect } = require("@playwright/test");

test("central invalidation owns useful strategy and player-feedback refresh work", async ({ page }) => {
  const errors = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", error => errors.push(String(error)));

  await page.goto("/");
  await page.waitForFunction(() => window.EpohiRuntimeInvalidation && window.EpohiStrategyUX && window.EpohiPlayerFeedback);
  await page.waitForTimeout(150);

  const before = await page.evaluate(() => window.EpohiRuntimeInvalidation.stats());
  await page.evaluate(() => {
    for (let i = 0; i < 30; i += 1) window.EpohiRuntimeInvalidation.request("legacy-refresh-bridge-regression");
  });
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => window.EpohiRuntimeInvalidation.stats());

  expect(after.flushes).toBeGreaterThan(before.flushes);
  expect(after.strategySyncs).toBeGreaterThan(before.strategySyncs);
  expect(after.playerFeedbackSyncs).toBeGreaterThan(before.playerFeedbackSyncs);
  expect(after.strategySyncs - before.strategySyncs).toBeLessThanOrEqual(after.flushes - before.flushes);
  expect(after.playerFeedbackSyncs - before.playerFeedbackSyncs).toBeLessThanOrEqual(after.flushes - before.flushes);
  expect(after.scheduled).toBe(false);
  expect(errors).toEqual([]);
});
