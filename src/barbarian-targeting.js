(function () {
  "use strict";

  const rules = window.EpohiData.BARBARIAN_TARGET_RULES;
  const { chebyshev, isAdjacent } = window.EpohiUtils;

  function visible(barbarian, x, y) {
    return chebyshev(barbarian.x, barbarian.y, x, y) <= rules.sightDistance
      || chebyshev(barbarian.homeX, barbarian.homeY, x, y) <= rules.homeSightDistance;
  }

  function allTargets(state, barbarian) {
    const targets = [];
    state.units.forEach(function (unit) {
      targets.push({
        kind:unit.type === 'worker' || unit.type === 'settler' ? 'civilian' : 'unit',
        x:unit.x, y:unit.y, unit, owner:'player'
      });
    });
    const playerCities = Array.isArray(state.cities) && state.cities.length
      ? state.cities : [state.city];
    playerCities.forEach(function (city) {
      targets.push({ kind:'city', x:city.x, y:city.y, city, owner:'player' });
    });
    state.settlements.forEach(function (outpost) {
      targets.push({ kind:'outpost', x:outpost.x, y:outpost.y, outpost, owner:'player' });
    });
    (state.rivals || []).forEach(function (civ) {
      (civ.units || []).forEach(function (unit) {
        targets.push({
          kind:unit.type === 'worker' || unit.type === 'settler' ? 'civilian' : 'unit',
          x:unit.x, y:unit.y, unit, civ, owner:civ.civilizationId
        });
      });
      (civ.cities || []).forEach(function (city) {
        targets.push({ kind:'city', x:city.x, y:city.y, city, civ, owner:civ.civilizationId });
      });
    });
    state.map.forEach(function (row, y) {
      row.forEach(function (tile, x) {
        if (tile.improvement && !tile.pillaged && visible(barbarian, x, y)) {
          targets.push({ kind:'improvement', x, y, owner:tile.owner });
        }
      });
    });
    return targets.filter(function (target) {
      return visible(barbarian, target.x, target.y);
    });
  }

  function nearestTarget(state, barbarian, random) {
    const targets = allTargets(state, barbarian);
    const adjacent = targets.filter(function (target) {
      return isAdjacent(barbarian.x, barbarian.y, target.x, target.y);
    });
    if (adjacent.length) return adjacent[0];
    for (const kind of rules.priority) {
      const candidates = targets.filter(function (target) {
        return target.kind === kind;
      }).sort(function (a, b) {
        return chebyshev(barbarian.x, barbarian.y, a.x, a.y)
          - chebyshev(barbarian.x, barbarian.y, b.x, b.y);
      });
      if (candidates[0]) return candidates[0];
    }
    return {
      x:barbarian.homeX + (Math.floor(random() * rules.wanderChoices) - 1),
      y:barbarian.homeY + (Math.floor(random() * rules.wanderChoices) - 1)
    };
  }

  window.EpohiBarbarianTargeting = { allTargets, nearestTarget };
})();
