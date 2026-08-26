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

test("hidden coherence proposal rerenders do not rewrite the modal class", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.EpohiDiplomacyCoherence && typeof window.__epohiDebug === "function");

  const result = await page.evaluate(async () => {
    const value = window.__epohiDebug();
    const gs = value && value.state;
    if (!gs) return { ready: false, mutations: -1, shown: true };
    gs.diplomaticProposals = [];
    window.EpohiDiplomacyCoherence.renderProposal(gs);
    await new Promise(resolve => window.setTimeout(resolve, 100));

    const modal = document.getElementById("coherenceProposalModal");
    let mutations = 0;
    const observer = new MutationObserver(records => {
      mutations += records.filter(record => record.type === "attributes" && record.attributeName === "class").length;
    });
    observer.observe(modal, { attributes: true, attributeFilter: ["class"] });

    for (let i = 0; i < 30; i += 1) window.EpohiDiplomacyCoherence.renderProposal(gs);
    await new Promise(resolve => window.setTimeout(resolve, 250));
    observer.disconnect();
    return { ready: true, mutations, shown: modal.classList.contains("show") };
  });

  expect(result.ready).toBe(true);
  expect(result.shown).toBe(false);
  expect(result.mutations).toBe(0);
});