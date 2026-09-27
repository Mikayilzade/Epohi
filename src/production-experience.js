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

  window.EpohiProductionExperience = { ensurePlayerState: ensurePlayerState, recordCompletion: recordCompletion };
})();
