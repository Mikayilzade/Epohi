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

  function validateSaveState(candidate, migrateStateFn, mapSizeCellsFn) {
    const migrated = migrateStateFn(candidate);
    if (!migrated) return null;
    const size = mapSizeCellsFn(migrated);
    if (!size || !Array.isArray(migrated.map) || migrated.map.length !== size) return null;
    if (!migrated.map.every(function (row) { return Array.isArray(row) && row.length === size; })) return null;
    if (typeof migrated.turn !== "number" || migrated.turn < 1) return null;
    if (!migrated.resources || ["food","production","gold","science"].some(function (k) { return typeof migrated.resources[k] !== "number"; })) return null;
    if (!Array.isArray(migrated.units)) return null;
    return migrated;
  }

  function buildSaveRecord(options) {
    const saveId = options.fixedSaveId || makeId(options.type);
    return {
      id: saveId,
      saveId: saveId,
      campaignId: options.campaign.campaignId,
      name: options.name || slotLabel(saveId),
      gameState: options.gameState,
      turn: options.gameState.turn,
      type: options.type,
      createdAt: options.now,
      updatedAt: options.now,
      schemaVersion: options.schemaVersion,
      parentSaveId: options.parentSaveId || null,
      parentTurn: options.parentSaveId ? options.loadedSaveTurn : null
    };
  }

  window.EpohiSaveUtils = {
    saveTypeLabel,
    slotLabel,
    makeId,
    makeCampaignId,
    cloneState,
    saveMetaLine,
    campaignLine,
    campaignFromState,
    validateSaveState,
    buildSaveRecord
  };
})();
