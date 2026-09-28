(function () {
  "use strict";

  const data = window.EpohiData;
  const { BUILDINGS, UNIT_DEFS, PLAYER_CITY_RULES } = data;
  const { growthNeed } = window.EpohiUtils;
  const { nonProductionCost } = window.EpohiUtils;

  function playerCities(state) {
    return Array.isArray(state.cities) && state.cities.length ? state.cities
      : (state.city ? [state.city] : []);
  }

  function completeQueue(state, city, options) {
    const queue = city.queue;
    if (!queue || queue.progress < queue.cost) return null;
    const definition = queue.type === "building" ? BUILDINGS[queue.id] : UNIT_DEFS[queue.id];
    city.queue = null;
    window.EpohiProductionExperience.ensurePlayerState(state);
    if (queue.type === "building") {
      city.buildings.push(queue.id);
      window.EpohiProductionExperience.recordCompletion(state, "building", queue.id);
      if (queue.id === "palace") state.victory = true;
      options.logEvent(state, "city-production-completed",
        city.name + " завершил здание " + definition.name + ".",
        { x:city.x, y:city.y }, { actorType:"player", actorId:"player" });
      return { text:definition.icon + " " + definition.name + " завершён.",
        victory:queue.id === "palace" };
    }
    const unitId = "u" + state.nextUnitId++;
    state.units.push(options.makePlayerUnit(queue.id, unitId, city.x, city.y));
    window.EpohiProductionExperience.recordCompletion(state, "unit", queue.id);
    options.logEvent(state, "city-production-completed",
      city.name + " подготовил " + definition.name + ".",
      { x:city.x, y:city.y }, { actorType:"player", actorId:"player" });
    return { text:definition.icon + " " + definition.name + " готов в " + city.name + ".",
      unitId:unitId };
  }

  function startQueue(state, city, type, id, options) {
    if (city.queue) return "busy";
    const definition = type === "building" ? BUILDINGS[id] : UNIT_DEFS[id];
    if (!definition || (definition.tech && !(state.researched || []).includes(definition.tech)
      && !(state.technologies || []).includes(definition.tech))
      || (type === "building" && (city.buildings || []).includes(id))) return "invalid";
    if ((id === "palace" && city.population < PLAYER_CITY_RULES.palaceMinimumPopulation)
      || (type === "unit" && city.population < definition.population)) return "population";
    const upfront = nonProductionCost(definition.cost);
    if (Object.keys(upfront).some(function (key) { return Number(state.resources[key] || 0) < Number(upfront[key] || 0); }))
      return "resources";
    window.EpohiProductionExperience.ensurePlayerState(state);
    Object.keys(upfront).forEach(function (key) {
      state.resources[key] = Number(state.resources[key] || 0) - Number(upfront[key] || 0);
    });
    const learning = window.EpohiProductionExperience;
    const cost = learning.effectiveProductionCost(state, type, id);
    city.queue = {
      type, id, progress:0, cost, baseCost:Number(definition.cost.production) || 0, upfront,
      learningDiscount:type === "building" ? learning.buildingDiscount(state, id)
        : learning.unitDiscount(state, id)
    };
    options.logEvent(state, "city-production-started",
      city.name + ": начат проект «" + definition.name + "» за " + cost + " производства.",
      { x:city.x, y:city.y }, { actorType:"player", actorId:"player" });
    return "started";
  }

  function cancelQueue(state, city) {
    const queue = city.queue;
    if (!queue) return false;
    Object.keys(queue.upfront || {}).forEach(function (key) {
      state.resources[key] += queue.upfront[key];
    });
    city.queue = null;
    return true;
  }

  function rushQueue(state, city, options) {
    const queue = city.queue;
    if (!queue || city.production <= 0) return null;
    const spent = Math.min(city.production, queue.cost - queue.progress);
    city.production -= spent;
    queue.progress += spent;
    return { spent, completed:completeQueue(state, city, options) };
  }

  function processTurn(state, options) {
    let completed = null;
    playerCities(state).forEach(function (city) {
      const income = window.EpohiEconomy.cityIncome(state, city, data);
      city.food += income.food;
      state.resources.gold += income.gold;
      state.resources.science += income.science;
      if (city.queue) {
        city.queue.progress += income.production;
        completed = completeQueue(state, city, options) || completed;
      } else {
        city.production += income.production;
      }
      while (city.population < PLAYER_CITY_RULES.populationLimit
        && city.food >= growthNeed(city.population)) {
        city.food -= growthNeed(city.population);
        city.population++;
        options.revealAround(state, city.x, city.y, window.EpohiTerritory.cityRadius(city));
        options.logEvent(state, "city-growth",
          city.name + " вырос до населения " + city.population + ".",
          { x:city.x, y:city.y }, { actorType:"player", actorId:"player" });
      }
    });
    return completed;
  }

  window.EpohiPlayerProduction = { startQueue, cancelQueue, rushQueue, completeQueue, processTurn };
})();
