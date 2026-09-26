const { test, expect } = require('@playwright/test');
const { clearStorage, createGame } = require('./helpers');

test('queued autosave keeps the state from its request time', async ({ page }) => {
  await clearStorage(page);
  await createGame(page, 0, 'small');

  const saved = await page.evaluate(async () => {
    const debug = window.__epohiDebug();
    const game = debug.state;
    const turn = game.turn;
    const gold = game.resources.gold;
    const pending = debug.saveGame();
    game.turn = 99;
    game.resources.gold = 777;
    await pending;
    const campaigns = await window.EpohiStorage.getCampaigns(true);
    const records = await window.EpohiStorage.getCampaignSaves(campaigns[0].campaignId, true);
    const record = records.find((item) => item.saveId.endsWith('-autosave-1'));
    const legacy = JSON.parse(localStorage.getItem(window.EpohiConfig.SAVE_KEY));
    return { turn, gold, record, legacyTurn: legacy.turn,
      schemaVersion: window.EpohiConfig.SAVE_SCHEMA_VERSION,
      gameVersion: window.EpohiConfig.GAME_VERSION };
  });

  expect(saved.record.turn).toBe(saved.turn);
  expect(saved.record.gameState.turn).toBe(saved.turn);
  expect(saved.record.gameState.resources.gold).toBe(saved.gold);
  expect(saved.legacyTurn).toBe(saved.turn);
  expect(saved.record.schemaVersion).toBe(saved.schemaVersion);
  expect(saved.record.gameVersion).toBe(saved.gameVersion);
});
