const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('unchanged turn renders preserve the turn label text node', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');
  await page.waitForFunction(() => Boolean(window.EpohiTurnLabelStability && window.__epohiDebug().state));

  const result = await page.evaluate(() => {
    const debug = window.__epohiDebug();
    const label = document.getElementById('turnValue');
    debug.state.turn += 1;
    debug.render();
    const changedText = label.textContent;
    const stableNode = label.firstChild;

    for (let i = 0; i < 30; i += 1) debug.render();

    return {
      installed: Boolean(window.EpohiTurnLabelStability && window.EpohiTurnLabelStability.installed),
      changedText,
      expectedText: String(debug.state.turn),
      sameNode: label.firstChild === stableNode,
      finalText: label.textContent
    };
  });

  expect(result.installed).toBe(true);
  expect(result.changedText).toBe(result.expectedText);
  expect(result.finalText).toBe(result.expectedText);
  expect(result.sameNode).toBe(true);
});
