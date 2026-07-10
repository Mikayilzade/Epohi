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

  window.EpohiSelectors = {
    getUnit,
    unitsAt,
    settlementAt
  };
})();
