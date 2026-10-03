(function () {
  "use strict";

  const { TERRAIN } = window.EpohiData;
  const UNKNOWN_COST = 1;

  function cost(state, point, actual) {
    const tile = state && state.map && state.map[point.y] && state.map[point.y][point.x];
    if (!tile) return Infinity;
    if (!actual && !tile.revealed && !state.openMapMode) return UNKNOWN_COST;
    const rule = TERRAIN[tile.terrain];
    return rule && rule.passable !== false && Number.isFinite(rule.movementCost)
      ? rule.movementCost : Infinity;
  }

  function format(value) {
    return Number.isFinite(value) ? String(Math.round(value * 2) / 2) : "∞";
  }

  function spend(unit, amount) {
    if (!Number.isFinite(amount) || amount <= 0 || unit.acted || unit.moves + 1e-9 < amount) return false;
    unit.moves = Math.max(0, Math.round((unit.moves - amount) * 2) / 2);
    return true;
  }

  window.EpohiMovement = { cost, format, spend, UNKNOWN_COST };
})();
