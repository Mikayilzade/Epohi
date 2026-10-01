(function () {
  "use strict";

  const { AI_ACTION_RULES } = window.EpohiData;
  const { chebyshev, isAdjacent, neighborsOf } = window.EpohiUtils;

  function rivalWarTarget(state, civ, unit) {
    let result = null;
    (state.rivals || []).forEach(function (enemy) {
      if (enemy === civ || civ.diplomacy[enemy.civilizationId] !== 'war') return;
      (enemy.units || []).concat(enemy.cities || []).filter(function (target) {
        return target.hp > 0;
      }).forEach(function (target) {
        const distance = chebyshev(unit.x, unit.y, target.x, target.y);
        if (!result || distance < result.distance) result = { enemy, target, distance };
      });
    });
    return result;
  }

  // Selection only. The turn executor spends the shared budget and applies
  // movement/combat after receiving the chosen intent.
  function chooseAction(state, civ, unit, queries) {
    const home = (civ.cities || []).find(function (city) {
      return chebyshev(unit.x, unit.y, city.x, city.y) <= AI_ACTION_RULES.homeDistance;
    });
    const warriors = (civ.units || []).filter(function (item) {
      return item.type === 'warrior' && item.hp > 0;
    });
    const war = rivalWarTarget(state, civ, unit);
    if (war && unit.type !== 'scout' && !(home && unit.type === 'warrior'
      && warriors.length <= AI_ACTION_RULES.lastDefenderCount
      && war.distance > AI_ACTION_RULES.adjacentWarDistance)) {
      return { kind:'rival-war', war };
    }
    if (civ.relation === 'war' && unit.type !== 'scout') {
      const victim = state.units.find(function (target) {
        return isAdjacent(unit.x, unit.y, target.x, target.y);
      });
      if (victim) return { kind:'player-attack', victim };
    }
    const adjacentCamp = neighborsOf(unit.x, unit.y, queries.mapSize()).find(function (spot) {
      return queries.campAt(spot.x, spot.y);
    });
    if (adjacentCamp && unit.type !== 'scout') return { kind:'camp-attack', spot:adjacentCamp };
    const adjacentBarbarian = state.barbarians.some(function (item) {
      return isAdjacent(unit.x, unit.y, item.x, item.y);
    });
    if (adjacentBarbarian && unit.type !== 'scout') return { kind:'barbarian-attack' };
    if (home && unit.type === 'warrior'
      && warriors.length <= AI_ACTION_RULES.lastDefenderCount) return { kind:'guard' };
    if (unit.type === 'settler' && queries.canFoundCity(civ, unit)) return { kind:'found-city' };
    const knownPoi = queries.nearestKnownFinitePoi(civ, unit);
    const target = (unit.type === 'scout' && knownPoi) || state.barbarians[0]
      || knownPoi || queries.nearestUnknown(unit, civ);
    return target ? { kind:'travel', target } : { kind:'idle' };
  }

  window.EpohiAiActions = { rivalWarTarget, chooseAction };
})();
