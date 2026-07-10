(function () {
  "use strict";

  if (!window.EpohiUtils) {
    throw new Error("EpohiUtils must be loaded before territory.js");
  }

  const { chebyshev } = window.EpohiUtils;

  function playerCities(state) {
    if (state && Array.isArray(state.cities) && state.cities.length) return state.cities;
    return state && state.city ? [state.city] : [];
  }

  function cityRadius(city) {
    if (city.population >= 6) return 3;
    if (city.population >= 3) return 2;
    return 1;
  }

  function territoryRadius(state) {
    return cityRadius(state.city);
  }

  function inTerritory(state, x, y) {
    if (playerCities(state).some(function (city) {
      return chebyshev(x, y, city.x, city.y) <= cityRadius(city);
    })) return true;

    return state.settlements.some(function (settlement) {
      return chebyshev(x, y, settlement.x, settlement.y) <= 1;
    });
  }

  window.EpohiTerritory = {
    cityRadius,
    territoryRadius,
    inTerritory
  };
})();
