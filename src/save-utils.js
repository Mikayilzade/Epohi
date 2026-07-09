(function () {
  "use strict";

  if (!window.EpohiConfig) {
    throw new Error("EpohiConfig must be loaded before save-utils.js");
  }

  if (!window.EpohiUtils) {
    throw new Error("EpohiUtils must be loaded before save-utils.js");
  }

  const {
    MANUAL_SAVE_IDS,
    AUTOSAVE_IDS,
    GAME_VERSION
  } = window.EpohiConfig;

  const {
    escapeHtml,
    formatDate
  } = window.EpohiUtils;

  function saveTypeLabel(type) {
    return { manual: "Ручное", autosave: "Авто", quicksave: "Быстрое" }[type] || type || "Сохранение";
  }

  function slotLabel(id) {
    if (id === "quicksave") return "Быстрое сохранение";
    const manual = MANUAL_SAVE_IDS.indexOf(id) + 1;
    if (manual) return "Ручное " + manual;
    const auto = AUTOSAVE_IDS.indexOf(id) + 1;
    if (auto) return "Автосохранение " + auto;
    return "Сохранение";
  }

  function makeId(prefix) { return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  function makeCampaignId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    const bytes = new Uint32Array(4);
    if (window.crypto && typeof window.crypto.getRandomValues === "function") window.crypto.getRandomValues(bytes);
    return "campaign-" + Date.now().toString(36) + "-" + Array.from(bytes).map(function(n){ return n.toString(36); }).join("") + "-" + Math.random().toString(36).slice(2, 10);
  }
  function cloneState(source) { return JSON.parse(JSON.stringify(source)); }

  function saveMetaLine(save) { return save ? escapeHtml(save.name) + " · ход " + save.turn + " · " + formatDate(save.updatedAt || save.createdAt) : "Пусто"; }
  function campaignLine(c, count, turn) { return escapeHtml(c.name) + " · ход " + (turn || 1) + " · " + c.mapSize + "×" + c.mapSize + " · " + formatDate(c.lastPlayedAt) + " · сохранений: " + count; }

  function campaignFromState(gameState, name, id, createdAt, mapSize) {
    const now = new Date().toISOString();
    return { campaignId: id || makeCampaignId(), name: name || gameState.partyName || "Новая партия", createdAt: createdAt || now, lastPlayedAt: now,
      mapSize: mapSize, mapSeed: gameState.mapSeed || null, status: gameState.victory ? "victory" : "active", gameVersion: GAME_VERSION, lastLoadedSaveId: null };
  }

  window.EpohiSaveUtils = {
    saveTypeLabel,
    slotLabel,
    makeId,
    makeCampaignId,
    cloneState,
    saveMetaLine,
    campaignLine,
    campaignFromState
  };
})();
