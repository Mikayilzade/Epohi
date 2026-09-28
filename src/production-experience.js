(function () {
  "use strict";

  function ensurePlayerState(state) {
    if (!state) return;
    if (!state.experience) state.experience = {};
    if (!state.experience.buildings) state.experience.buildings = {};
    if (!state.experience.foreignBuildings) state.experience.foreignBuildings = {};
    if (!state.experience.units) state.experience.units = {};
    if (state.workerLearningMigrated) return;
    const cities = Array.isArray(state.cities) && state.cities.length ? state.cities : (state.city ? [state.city] : []);
    cities.forEach(function (city) {
      (city.buildings || []).forEach(function (id) {
        if (!city.formerCivilizationId) state.experience.buildings[id] = (Number(state.experience.buildings[id]) || 0) + 1;
      });
    });
    state.workerLearningMigrated = true;
  }

  function recordCompletion(holder, kind, id) {
    if (!holder || (kind !== "unit" && kind !== "building") || !id) return;
    if (!holder.experience) holder.experience = {};
    const field = kind === "unit" ? "units" : "buildings";
    if (!holder.experience[field]) holder.experience[field] = {};
    holder.experience[field][id] = (Number(holder.experience[field][id]) || 0) + 1;
  }

  function buildingDiscount(holder, id) {
    const rules = window.EpohiData.PRODUCTION_EXPERIENCE_RULES;
    const experience = holder && holder.experience || {};
    const own = Math.min(rules.ownBuildingMaximum,
      Math.max(0, Number(experience.buildings && experience.buildings[id]) || 0)
        * rules.ownBuildingStep);
    const foreign = Array.isArray(experience.foreignBuildings && experience.foreignBuildings[id])
      ? experience.foreignBuildings[id].length * rules.foreignBuildingStep : 0;
    return own + foreign;
  }

  function unitDiscount(holder, id) {
    const rules = window.EpohiData.PRODUCTION_EXPERIENCE_RULES;
    const experience = holder && holder.experience || {};
    const produced = Math.max(0, Number(experience.units && experience.units[id]) || 0);
    return Math.min(rules.unitMaximum, Math.floor(produced / rules.unitsPerStep) * rules.unitStep);
  }

  function effectiveProductionCost(holder, type, id) {
    const data = window.EpohiData;
    const definition = type === "building" ? data.BUILDINGS[id] : data.UNIT_DEFS[id];
    const base = Number(definition && definition.cost && definition.cost.production) || 0;
    if (!base) return 0;
    const rules = data.PRODUCTION_EXPERIENCE_RULES;
    const discount = type === "building" ? buildingDiscount(holder, id) : unitDiscount(holder, id);
    return Math.max(rules.minimumCost,
      Math.ceil(base * Math.max(rules.minimumCostFactor, 1 - discount)));
  }

  window.EpohiProductionExperience = {
    ensurePlayerState, recordCompletion, buildingDiscount, unitDiscount, effectiveProductionCost
  };
})();
