(function () {
  "use strict";

  function getUnit(state, id) {
    return state.units.find(function (unit) { return unit.id === id; }) || null;
  }

  function unitsAt(state, x, y) {
    return state.units.filter(function (unit) { return unit.x === x && unit.y === y; });
  }

  function settlementAt(state, x, y) {
    return state.settlements.find(function (settlement) {
      return settlement.x === x && settlement.y === y;
    }) || null;
  }

  function hasTech(state, id) {
    return state.researched.indexOf(id) !== -1;
  }

  function hasBuilding(state, id) {
    return (state.city.buildings || []).indexOf(id) !== -1;
  }

  window.EpohiSelectors = {
    getUnit,
    unitsAt,
    settlementAt,
    hasTech,
    hasBuilding
  };
})();
