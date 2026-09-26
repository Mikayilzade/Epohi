(function () {
  "use strict";

  if (!window.EpohiConfig || !window.EpohiData) {
    throw new Error("EpohiConfig and EpohiData must be loaded before state-schema.js");
  }

  const { STATE_VERSION } = window.EpohiConfig;
  const { UNIT_DEFS } = window.EpohiData;

  function validState(candidate) {
    return candidate && Array.isArray(candidate.map) && candidate.map.length >= 8 &&
      candidate.city && candidate.resources && Array.isArray(candidate.researched);
  }

  // Normalizes legacy snapshots in place. Domain-specific migrations are
  // supplied by their owner; schema normalization never touches presentation.
  function migrate(candidate, domain) {
    if (!validState(candidate)) return null;
    candidate.mapSize = candidate.mapSize || candidate.map.length;
    if (!candidate.barbarianActivity) candidate.barbarianActivity = "normal";
    candidate.map.forEach(function (row) {
      row.forEach(function (tile) {
        if (tile.pillaged === undefined) tile.pillaged = false;
        if (tile.poi === undefined) tile.poi = null;
        if (tile.camp === undefined) tile.camp = null;
      });
    });
    if (!Array.isArray(candidate.units)) {
      const oldScout = candidate.scout || { x: candidate.city.x, y: candidate.city.y - 1, moved: false };
      candidate.units = [domain.makePlayerUnit("scout", "u1", oldScout.x, oldScout.y, { moves: oldScout.moved ? 0 : 2, acted: false })];
    }
    candidate.units.forEach(function (unit, index) {
      if (!unit.id) unit.id = "u" + (index + 1);
      if (!UNIT_DEFS[unit.type]) unit.type = "scout";
      const def = UNIT_DEFS[unit.type];
      if (typeof unit.moves !== "number") unit.moves = def.maxMoves;
      if (typeof unit.acted !== "boolean") unit.acted = false;
      if (typeof unit.maxHp !== "number") unit.maxHp = def.maxHealth || 60;
      if (typeof unit.hp !== "number") unit.hp = unit.maxHp;
      domain.ensureUnitName(unit);
    });
    if (!Array.isArray(candidate.barbarians)) candidate.barbarians = [];
    if (!candidate.nextBarbarianId) candidate.nextBarbarianId = 1;
    if (!Array.isArray(candidate.artifacts)) candidate.artifacts = [];
    if (!candidate.permanentBonuses) candidate.permanentBonuses = {};
    if (!Array.isArray(candidate.settlements)) candidate.settlements = [];
    if (!candidate.city.id) candidate.city.id = "player-cap";
    if (!candidate.city.buildings) candidate.city.buildings = [];
    if (candidate.city.damage === undefined) candidate.city.damage = 0;
    if (typeof candidate.city.maxHp !== "number") candidate.city.maxHp = 180;
    if (typeof candidate.city.hp !== "number") candidate.city.hp = Math.max(40, candidate.city.maxHp - candidate.city.damage * 12);
    if (candidate.city.queue === undefined) candidate.city.queue = null;
    if (!Array.isArray(candidate.cities)) candidate.cities = [candidate.city];
    const legacyFood = typeof candidate.resources.food === "number" ? candidate.resources.food : 0;
    const legacyProduction = typeof candidate.resources.production === "number" ? candidate.resources.production : 0;
    candidate.cities.forEach(function (city, index) {
      if (!city.id) city.id = index ? "player-city" + index : "player-cap";
      if (!city.buildings) city.buildings = [];
      if (city.queue === undefined) city.queue = null;
      if (typeof city.food !== "number") city.food = 0;
      if (typeof city.production !== "number") city.production = 0;
      if (typeof city.maxHp !== "number") city.maxHp = city.capital ? 180 : 150;
      if (typeof city.hp !== "number") city.hp = city.maxHp;
      if (!city.name) city.name = index ? "Новый город" : "Ардена";
    });
    const selectedCapital = candidate.cities.find(function (city) { return city.capital && city.hp > 0; }) ||
      candidate.cities.find(function (city) { return city.id === candidate.city.id && city.hp > 0; }) ||
      candidate.cities.find(function (city) { return city.capital; }) ||
      candidate.cities.find(function (city) { return city.id === candidate.city.id; }) ||
      candidate.cities[0];
    if (selectedCapital) {
      candidate.cities.forEach(function (city) { city.capital = city === selectedCapital; });
      candidate.city = selectedCapital;
    }
    if (!candidate.localResourceMigration142Done) {
      candidate.city.food += legacyFood;
      candidate.city.production += legacyProduction;
      candidate.localResourceMigration142Done = true;
    }
    candidate.resources.food = 0;
    candidate.resources.production = 0;
    if (!candidate.nextUnitId) candidate.nextUnitId = candidate.units.reduce(function (max, unit) {
      return Math.max(max, Number(String(unit.id).replace(/\D/g, "")) || 0);
    }, 0) + 1;
    if (!Number.isFinite(candidate.cityCapacity)) candidate.cityCapacity = Math.max(4, candidate.cities.length);
    if (!Number.isFinite(candidate.cityCapacityPurchases)) candidate.cityCapacityPurchases = 0;
    if (!Array.isArray(candidate.history)) candidate.history = [];
    if (!Array.isArray(candidate.eventLog)) candidate.eventLog = [];
    if (!Array.isArray(candidate.rivals)) candidate.rivals = [];
    if (!candidate.nextRivalUnitId) candidate.nextRivalUnitId = 1;
    if (typeof candidate.defeat !== "boolean") candidate.defeat = false;
    if (typeof candidate.victory !== "boolean") candidate.victory = false;
    domain.migrateBarbarianDirector(candidate);
    candidate.version = STATE_VERSION;
    delete candidate.scout;
    if (domain.migrateCivilizations) domain.migrateCivilizations(candidate);
    return candidate;
  }

  window.EpohiStateSchema = { validState: validState, migrate: migrate };
})();
