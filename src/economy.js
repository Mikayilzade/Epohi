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

  function calculateIncome(state, cities, cityIncome) {
    const total = { food: 0, production: 0, gold: 0, science: 0 };
    cities.forEach(function (city) {
      addYield(total, cityIncome(city));
    });
    state.settlements.forEach(function () {
      addYield(total, { food: 1, production: 1, gold: 1 });
    });
    return total;
  }

  window.EpohiEconomy = {
    getTileYield,
    calculateIncome
  };
})();
