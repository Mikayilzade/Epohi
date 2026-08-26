const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

test("legacy decorator roots stay quarantined while explicit invalidation owns UI refresh", async ({ page }) => {
  const errors = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", error => errors.push(String(error)));

  await page.goto("/");
  await page.waitForFunction(() => window.EpohiPerformance && window.EpohiObserverSafety);

  const versions = await page.evaluate(() => ({
    performance: window.EpohiPerformance.version,
    safety: window.EpohiObserverSafety.version
  }));
  expect(versions.performance).toBeGreaterThanOrEqual(7);
  expect(versions.safety).toBeGreaterThanOrEqual(6);

  await page.waitForTimeout(250);
  const before = await page.evaluate(() => window.EpohiPerformance.snapshot());

  await page.evaluate(() => {
    const roots = [
      document.getElementById("menuContent"),
      document.getElementById("wikiContent"),
      document.getElementById("screenRoot")
    ].filter(Boolean);
    roots.forEach((root, rootIndex) => {
      for (let i = 0; i < 30; i += 1) {
        const node = document.createElement("span");
        node.dataset.legacyContainmentProbe = rootIndex + "-" + i;
        node.hidden = true;
        root.appendChild(node);
      }
      root.querySelectorAll("[data-legacy-containment-probe]").forEach(node => node.remove());
    });
  });

  await page.waitForTimeout(500);
  const after = await page.evaluate(() => window.EpohiPerformance.snapshot());

  expect(after.observerSuppressedHeavy).toBeGreaterThanOrEqual(before.observerSuppressedHeavy);
  expect(after.observerCallbacks - before.observerCallbacks).toBeLessThanOrEqual(3);
  expect(errors).toEqual([]);
});

test("coherence finalizer does not duplicate proposal-modal observer ownership", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/humans-coherence-finalize.js"), "utf8");
  const installStart = source.indexOf("function install() {");
  const exportStart = source.indexOf("window.EpohiCoherenceFinalize =", installStart);
  expect(installStart).toBeGreaterThanOrEqual(0);
  expect(exportStart).toBeGreaterThan(installStart);
  const installBlock = source.slice(installStart, exportStart);

  expect(installBlock).not.toContain('"coherenceProposalModal"');
  expect(installBlock).toContain('["captureChoiceModal", "stabilityDecisionModal", "strategyDiplomacyModal"]');
});
