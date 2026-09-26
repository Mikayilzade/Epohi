const { test, expect } = require("@playwright/test");

test("camera layout guard does not observe the whole screen subtree", async ({ page }) => {
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(String(error)));

  await page.goto("/");
  await page.waitForFunction(() => window.EpohiCameraLayoutGuard && window.EpohiPerformance);

  const architecture = await page.evaluate(async () => {
    const source = await fetch("/src/humans-camera-layout-guard.js").then(response => response.text());
    return {
      version: window.EpohiCameraLayoutGuard.version,
      hasBroadScreenObserver: /observe\(screen,\s*\{[^}]*subtree\s*:\s*true/.test(source),
      hasDoubleRaf: source.includes("requestAnimationFrame(function ()") && source.includes("requestAnimationFrame(restorePersistedCameraWhileMenuIsOpen)")
    };
  });

  expect(architecture.version).toBeGreaterThanOrEqual(2);
  expect(architecture.hasBroadScreenObserver).toBe(false);
  expect(architecture.hasDoubleRaf).toBe(false);

  const before = await page.evaluate(() => ({
    callbacks: window.EpohiPerformance.snapshot().observerCallbacks,
    guard: window.EpohiCameraLayoutGuard.stats()
  }));

  await page.evaluate(() => {
    const host = document.querySelector("#screenRoot .screen") || document.getElementById("screenRoot");
    const scratch = document.createElement("div");
    host.appendChild(scratch);
    for (let i = 0; i < 80; i += 1) {
      const child = document.createElement("span");
      child.textContent = String(i);
      scratch.appendChild(child);
      child.remove();
    }
    scratch.remove();
  });
  await page.waitForTimeout(200);

  const after = await page.evaluate(() => ({
    callbacks: window.EpohiPerformance.snapshot().observerCallbacks,
    guard: window.EpohiCameraLayoutGuard.stats()
  }));

  expect(after.guard.screenSignals - before.guard.screenSignals).toBeLessThanOrEqual(1);
  expect(after.guard.schedules - before.guard.schedules).toBeLessThanOrEqual(1);
  expect(after.callbacks - before.callbacks).toBeLessThanOrEqual(3);
  expect(errors).toEqual([]);
});
