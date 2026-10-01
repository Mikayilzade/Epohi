(function () {
  "use strict";

  const { BARBARIAN, BARBARIAN_ACTIVITY, BARBARIAN_ACTION_RULES, UNIT_DEFS } = window.EpohiData;
  const { chebyshev, isAdjacent, neighborsOf, passableTile } = window.EpohiUtils;

  function barbarianAt(state, x, y) {
    return state.barbarians.some(function (item) {
      return item.x === x && item.y === y && item.hp > 0;
    });
  }

  function campAt(state, x, y) {
    const tile = state.map[y] && state.map[y][x];
    return tile && tile.camp && tile.camp.hp > 0;
  }

  function rivalUnitAt(state, x, y) {
    return (state.rivals || []).some(function (civ) {
      return (civ.units || []).some(function (unit) {
        return unit.x === x && unit.y === y && unit.hp > 0;
      });
    });
  }

  function moveToward(state, barbarian, target, mapSize) {
    const choices = neighborsOf(barbarian.x, barbarian.y, mapSize).filter(function (spot) {
      return passableTile(state.map[spot.y][spot.x])
        && !barbarianAt(state, spot.x, spot.y) && !campAt(state, spot.x, spot.y);
    });
    if (!choices.length) return;
    choices.sort(function (a, b) {
      return chebyshev(a.x, a.y, target.x, target.y)
        - chebyshev(b.x, b.y, target.x, target.y);
    });
    const next = choices[0];
    barbarian.last = { x:barbarian.x, y:barbarian.y };
    barbarian.x = next.x;
    barbarian.y = next.y;
  }

  function process(state, options) {
    const rules = BARBARIAN_ACTIVITY[state.barbarianActivity || 'normal']
      || BARBARIAN_ACTIVITY.normal;
    if (state.barbarianActivity === 'off') return '';
    const mapSize = options.mapSize(state);
    let actions = 0;
    state.map.forEach(function (row, y) {
      row.forEach(function (tile, x) {
        if (!tile.camp || tile.camp.hp <= 0) return;
        tile.camp.nextSpawn--;
        const local = state.barbarians.filter(function (item) {
          return item.hp > 0 && item.originCampId === tile.camp.campId;
        }).length;
        if (tile.camp.nextSpawn <= 0 && state.turn >= rules.grace
          && local < BARBARIAN_ACTION_RULES.perCampLimit
          && state.barbarians.length < Math.max(rules.limit,
            options.targetCampCount(state) * BARBARIAN_ACTION_RULES.campTargetScale)) {
          const spot = neighborsOf(x, y, mapSize).find(function (candidate) {
            return passableTile(state.map[candidate.y][candidate.x])
              && !barbarianAt(state, candidate.x, candidate.y)
              && !state.units.some(function (unit) {
                return unit.x === candidate.x && unit.y === candidate.y;
              })
              && !rivalUnitAt(state, candidate.x, candidate.y);
          });
          if (spot) {
            state.barbarians.push({
              id:'b' + state.nextBarbarianId++, x:spot.x, y:spot.y,
              hp:BARBARIAN.raiderHealth, maxHp:BARBARIAN.raiderHealth,
              homeX:x, homeY:y, originCampId:tile.camp.campId, last:null
            });
            actions++;
          }
          tile.camp.nextSpawn = rules.min
            + Math.floor(options.random() * (rules.max - rules.min + 1));
        }
      });
    });
    state.barbarians.slice().forEach(function (barbarian) {
      const target = window.EpohiBarbarianTargeting.nearestTarget(state, barbarian, options.random);
      if (target && isAdjacent(barbarian.x, barbarian.y, target.x, target.y) && target.unit) {
        const baseDefense = UNIT_DEFS[target.unit.type].defense || 0;
        target.unit.hp -= options.damageAmount(BARBARIAN.raiderAttack,
          baseDefense + options.defenseBonus(target.x, target.y, baseDefense));
        options.logEvent(state,
          target.civ ? 'barbarian-attacked-rival' : 'barbarian-attacked-player',
          'Варвар атаковал ' + (target.civ ? target.civ.name : 'Ардену') + '.',
          { x:target.x, y:target.y }, { actorType:'barbarian', actorId:barbarian.id });
        if (target.unit.hp <= 0) {
          if (target.civ) target.civ.units = target.civ.units.filter(function (unit) {
            return unit.id !== target.unit.id;
          });
          else options.killUnit(target.unit);
        }
        actions++;
        return;
      }
      const tile = state.map[barbarian.y][barbarian.x];
      if (tile.improvement && !tile.pillaged) {
        tile.pillaged = true;
        options.logEvent(state,
          tile.owner && String(tile.owner).startsWith('civ')
            ? 'barbarians-pillaged-rival' : 'barbarians-pillaged',
          'Варвары разграбили улучшение ' + (tile.owner || '') + '.',
          { x:barbarian.x, y:barbarian.y }, { actorType:'barbarian', actorId:barbarian.id });
        actions++;
        return;
      }
      if (target) moveToward(state, barbarian, target, mapSize);
      actions++;
    });
    return actions ? ' Варвары действуют: ' + actions + '.' : '';
  }

  window.EpohiBarbarianActions = { process };
})();
