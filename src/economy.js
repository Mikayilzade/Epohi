(function () {
  "use strict";

  if (!window.EpohiUtils) {
    throw new Error("EpohiUtils must be loaded before economy.js");
  }

  const { emptyYield, addYield } = window.EpohiUtils;

  function getTileYield(tile, terrainData, improvementData, featureData) {
    const result = emptyYield();
    addYield(result, terrainData[tile.terrain].base);
    if (tile.improvement && !tile.pillaged) addYield(result, improvementData[tile.improvement].yield);
    if (tile.feature && tile.feature !== "ruins" && tile.improvement) addYield(result, featureData[tile.feature].bonus);
    return result;
  }

  function cityIncome(state, city, data) {
    const balance = data.CITY_ECONOMY;
    const income = {
      food: balance.baseFood + Math.floor(city.population / 2) * balance.foodPerTwoPopulation,
      production: balance.baseProduction - (city.youngUntil && state.turn <= city.youngUntil ? balance.youngProductionPenalty : 0),
      gold: balance.baseGold,
      science: balance.baseScience
    };
    addYield(income, data.TERRAIN[state.map[city.y][city.x].terrain].base);
    (city.buildings || []).forEach(function (id) { addYield(income, data.BUILDINGS[id].yield); });
    state.map.forEach(function (row) { row.forEach(function (tile) {
      if (tile.owner !== (city.id || city.name) || !tile.improvement || tile.pillaged) return;
      addYield(income, data.TERRAIN[tile.terrain].base);
      addYield(income, data.IMPROVEMENTS[tile.improvement].yield);
      if (tile.feature) addYield(income, data.FEATURES[tile.feature].bonus);
    }); });
    income.production = Math.max(balance.minimumProduction, income.production + (state.permanentBonuses.production || 0));
    income.gold += state.permanentBonuses.gold || 0;
    income.science += state.permanentBonuses.science || 0;
    return income;
  }

  function calculateIncome(state, cities, cityIncomeForCity, data) {
    const total = { food: 0, production: 0, gold: 0, science: 0 };
    cities.forEach(function (city) {
      addYield(total, cityIncomeForCity(city));
    });
    state.settlements.forEach(function () {
      addYield(total, data.CITY_ECONOMY.settlementYield);
    });
    return total;
  }

  window.EpohiEconomy = {
    getTileYield,
    cityIncome,
    calculateIncome
  };
})();
