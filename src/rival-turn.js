(function () {
  "use strict";

  // The caller supplies the current state and all game services. No presentation
  // or persistence work belongs to a rival turn.
  function create(state, data, deps) {
    const { AI_LIMITS, UNIT_DEFS, BARBARIAN, INTEREST_TYPES, CITY_MIN_DISTANCE } = data;
    const { chebyshev, isAdjacent, neighborsOf, passableTile } = deps;
    const mapSize = function () { return deps.mapSizeCells(state); };
    const tileKey = function (x, y) { return x + "," + y; };
    const rivalUnitAt = function (x, y) { return deps.rivalUnitAt(x, y); };
    const rivalCityAt = function (x, y) { return deps.rivalCityAt(x, y); };
    const barbarianAt = function (x, y) { return deps.barbarianAt(x, y); };
    const campAt = function (x, y) { return deps.campAt(x, y); };
    const unitsAt = function (x, y) { return deps.unitsAt(x, y); };
    const playerSees = function (x, y) { return deps.currentPlayerSees(state, x, y); };
    const logEvent = function (type, message, coordinates, options) {
      return deps.logEvent(state, type, message, coordinates, options);
    };

    function revealForRival(civ, x, y, radius, skipCampDiscovery) {
      civ.explored = civ.explored || {}; civ.visible = {};
      const size = state ? mapSize() : (civ.mapSize || data.DEFAULT_MAP_SIZE);
      for (let yy = Math.max(0, y - radius); yy <= Math.min(size - 1, y + radius); yy++) {
        for (let xx = Math.max(0, x - radius); xx <= Math.min(size - 1, x + radius); xx++) {
          if (chebyshev(x, y, xx, yy) <= radius) {
            civ.explored[tileKey(xx, yy)] = true;
            civ.visible[tileKey(xx, yy)] = true;
          }
        }
      }
      if (!skipCampDiscovery && state && state.barbarianDirector) deps.updateCampDiscovery(state);
    }

    function canRivalEnter(civ, x, y) {
      return state.map[y] && state.map[y][x] && passableTile(state.map[y][x])
        && !rivalUnitAt(x, y) && !rivalCityAt(x, y) && !barbarianAt(x, y)
        && !campAt(x, y) && !(civ.relation !== "war" && unitsAt(x, y).length);
    }

    function reachableRivalStep(unit, target, civ) {
      const start = tileKey(unit.x, unit.y), queue = [{ x:unit.x, y:unit.y }], seen = {};
      seen[start] = true;
      while (queue.length) {
        const cur = queue.shift();
        if (cur.x === target.x && cur.y === target.y) return true;
        neighborsOf(cur.x, cur.y, mapSize()).forEach(function (p) {
          const key = tileKey(p.x, p.y);
          if (seen[key]) return;
          if ((p.x === target.x && p.y === target.y) || canRivalEnter(civ, p.x, p.y)) {
            seen[key] = true; queue.push(p);
          }
        });
      }
      return false;
    }

    function stepToward(unit, target, civ) {
      const opts = neighborsOf(unit.x, unit.y, mapSize()).filter(function (p) {
        return canRivalEnter(civ, p.x, p.y);
      });
      if (!opts.length) {
        unit.stuckTurns = (unit.stuckTurns || 0) + 1;
        unit.aiTarget = null;
        return false;
      }
      const before = { x:unit.x, y:unit.y };
      const wasVisible = playerSees(unit.x, unit.y);
      opts.sort(function (a, b) {
        return chebyshev(a.x, a.y, target.x, target.y)
          - chebyshev(b.x, b.y, target.x, target.y);
      });
      let next = opts[0];
      if (unit.last && next.x === unit.last.x && next.y === unit.last.y && opts[1]) next = opts[1];
      unit.last = { x:unit.x, y:unit.y };
      unit.x = next.x; unit.y = next.y; unit.moves--;
      unit.stuckTurns = (unit.x === before.x && unit.y === before.y)
        ? ((unit.stuckTurns || 0) + 1) : 0;
      revealForRival(civ, next.x, next.y, unit.type === 'scout' ? 2 : 1);
      const isVisible = playerSees(unit.x, unit.y);
      if (!wasVisible && isVisible && unit.lastMovementNoticeTurn !== state.turn) {
        unit.lastMovementNoticeTurn = state.turn;
        const def = UNIT_DEFS[unit.type] || { name:'юнит' };
        logEvent('unit-spotted', civ.name + ': замечен ' + def.name + '.',
          { x:unit.x, y:unit.y },
          { actorType:'civilization', actorId:civ.civilizationId, phase:'rivals' });
      }
      return true;
    }

    function nearestUnknown(unit, civ) {
      let best = null;
      for (let y = 0; y < mapSize(); y++) for (let x = 0; x < mapSize(); x++) {
        if (!civ.explored[tileKey(x, y)] && passableTile(state.map[y][x])) {
          if (unit.aiTarget && unit.aiTarget.x === x && unit.aiTarget.y === y
            && unit.stuckTurns >= 2) continue;
          const distance = chebyshev(unit.x, unit.y, x, y);
          if (!best || distance < best.d) best = { x, y, d:distance };
        }
      }
      if (best && !reachableRivalStep(unit, best, civ)) best = null;
      return best;
    }

    function aiResolvePoi(civ, unit) {
      const tile = state.map[unit.y][unit.x];
      const poi = tile.poi && !tile.poi.used ? tile.poi
        : (tile.feature === 'ruins' ? { type:'ruins', feature:true } : null);
      if (!poi) return false;
      if (poi.feature) tile.feature = null; else tile.poi.used = true;
      const key = civ.resources.science < 12 ? 'science'
        : (civ.resources.gold < 10 ? 'gold' : 'production');
      civ.resources[key] += key === 'production' ? 12 : 14;
      if (tile.revealed) logEvent('point-of-interest-resolved',
        civ.name + ' первым исследует ' + INTEREST_TYPES[poi.type].name + '.',
        { x:unit.x, y:unit.y },
        { actorType:'civilization', actorId:civ.civilizationId, phase:'rivals' });
      return true;
    }

    function nearestKnownFinitePoi(civ, unit) {
      let best = null;
      state.map.forEach(function (row, y) { row.forEach(function (tile, x) {
        const available = (tile.poi && !tile.poi.used) || tile.feature === 'ruins';
        if (!available || !(civ.explored && civ.explored[tileKey(x, y)])) return;
        const distance = chebyshev(unit.x, unit.y, x, y);
        if (!best || distance < best.distance) best = { x:x, y:y, distance:distance };
      }); });
      return best;
    }

    function chooseAiGoal(civ) {
      return deps.aiStrategy.chooseGoal(state, civ, {
        mapSize:mapSize(), knowsCamp:deps.civKnowsCamp,
        adjustScores:deps.livingCivilizations && deps.livingCivilizations.adjustGoalScores
      });
    }

    function aiAttackBarbarian(civ, unit) {
      const barbarian = state.barbarians.find(function (item) {
        return isAdjacent(unit.x, unit.y, item.x, item.y);
      });
      if (barbarian && unit.type !== 'scout') {
        barbarian.hp -= deps.damageAmount(UNIT_DEFS[unit.type].attack || 8,
          BARBARIAN.raiderDefense
            + deps.defenseBonus(barbarian.x, barbarian.y, BARBARIAN.raiderDefense));
        logEvent('rival-destroyed-barbarian', civ.name + ' атакует варварского налётчика.',
          { x:barbarian.x, y:barbarian.y },
          { actorType:'civilization', actorId:civ.civilizationId, phase:'rivals' });
        if (barbarian.hp <= 0) {
          state.barbarians = state.barbarians.filter(function (item) {
            return item.id !== barbarian.id;
          });
          logEvent('rival-destroyed-barbarian', civ.name + ' уничтожил налётчика.',
            { x:barbarian.x, y:barbarian.y },
            { actorType:'civilization', actorId:civ.civilizationId, phase:'rivals' });
        }
        return true;
      }
      return false;
    }

    function campReward(civ, unit, x, y) {
      const removedCamp = state.map[y][x].camp;
      state.map[y][x].camp = null;
      const director = deps.ensureBarbarianDirector(state);
      director.lastDestroyedCamp = removedCamp
        ? { x:x, y:y, turn:state.turn, campId:removedCamp.campId } : null;
      deps.scheduleNextCampSpawn(state, state.turn, deps.random);
      const target = civ.resources || state.resources;
      target.gold = (target.gold || 0) + 25;
      target.science = (target.science || 0) + 6;
      if (unit) unit.hp = Math.min(unit.maxHp, unit.hp + 20);
      if (civ.civilizationId) logEvent('rival-destroyed-camp',
        civ.name + ' уничтожил варварский лагерь.', { x, y },
        { actorType:'civilization', actorId:civ.civilizationId, phase:'rivals' });
      else logEvent('barbarian-camp-destroyed', 'уничтожен варварский лагерь.',
        { x, y }, { actorType:'player', actorId:'player' });
    }

    function produceForAi(civ) {
      deps.aiProduction.produceForAi(state, civ, {
        cityIncome:deps.cityIncome,
        chooseProduction:deps.livingCivilizations && deps.livingCivilizations.chooseProduction,
        unitProductionCost:deps.coherenceFinalize && deps.coherenceFinalize.unitProductionCost,
        recordCompletion:deps.productionExperience.recordCompletion,
        logEvent:deps.logEvent
      });
    }

    function canRivalFoundCity(civ, unit) {
      if (!unit || unit.type !== 'settler' || civ.cities.length >= AI_LIMITS.maxCities) return false;
      if (barbarianAt(unit.x, unit.y) || campAt(unit.x, unit.y)
        || rivalCityAt(unit.x, unit.y) || unitsAt(unit.x, unit.y).length) return false;
      return passableTile(state.map[unit.y][unit.x]) && !state.map[unit.y][unit.x].poi
        && civ.cities.every(function (city) {
          return chebyshev(unit.x, unit.y, city.x, city.y) >= CITY_MIN_DISTANCE;
        }) && deps.playerCities().every(function (city) {
          return chebyshev(unit.x, unit.y, city.x, city.y) >= CITY_MIN_DISTANCE;
        });
    }

    function setRivalWar(a, b) {
      a.diplomacy = a.diplomacy || {}; b.diplomacy = b.diplomacy || {};
      a.diplomacy[b.civilizationId] = 'war';
      b.diplomacy[a.civilizationId] = 'war';
    }

    function resolveAiToAiCombat(attacker, unit, enemy, target, eventType, message) {
      return deps.rivalCombat.resolveAiToAiCombat(state, attacker, unit, enemy,
        target, eventType, message, {
          damageAmount:deps.damageAmount, defenseBonus:deps.defenseBonus,
          logEvent:deps.logEvent, captureAiCity:deps.captureState.captureAiCity
        });
    }

    function attackRivalTarget(civ, unit, war) {
      setRivalWar(civ, war.enemy);
      resolveAiToAiCombat(civ, unit, war.enemy, war.target,
        'rival-battle', civ.name + ' атакует ' + war.enemy.name + '.');
    }

    function finish(unit) {
      unit.moves = 0; unit.acted = true;
      state.lastAiUnitActions = state.lastAiUnitActions || {};
      state.lastAiUnitActions[unit.id] = (state.lastAiUnitActions[unit.id] || 0) + 1;
    }

    function performAlliedWarAction(ally, enemy) {
      const unit = (ally.units || []).find(function (item) {
        return item.hp > 0 && item.moves > 0 && !item.acted
          && item.type !== 'worker' && item.type !== 'settler';
      });
      const target = (enemy.units || []).find(function (item) { return item.hp > 0; })
        || (enemy.cities || []).find(function (item) { return item.hp > 0; });
      if (!unit || !target) return false;
      if (isAdjacent(unit.x, unit.y, target.x, target.y)) {
        resolveAiToAiCombat(ally, unit, enemy, target, 'allied-war-battle',
          ally.name + ' атакует войска ' + enemy.name + ' в общей войне.');
      } else if (!stepToward(unit, target, ally)) return false;
      finish(unit);
      return true;
    }

    function processRivals(budget) {
      budget = budget || { remaining:AI_LIMITS.maxActionsPerTurn, used:0 };
      const started = budget.used || 0, rivals = state.rivals || [];
      function spend() {
        if (budget.remaining <= 0) return false;
        budget.remaining--; budget.used++;
        return true;
      }
      rivals.forEach(function (civ) {
        if (civ.defeated) return;
        produceForAi(civ); chooseAiGoal(civ);
        civ.units.slice().forEach(function (unit) {
          if (budget.remaining <= 0 || unit.acted || unit.moves <= 0) return;
          const action = deps.aiActions.chooseAction(state, civ, unit, {
            mapSize:mapSize, campAt:campAt, canFoundCity:canRivalFoundCity,
            nearestKnownFinitePoi:nearestKnownFinitePoi, nearestUnknown:nearestUnknown
          });
          if (action.kind === 'rival-war') {
            if (!spend()) return;
            const war = action.war;
            if (war.distance <= 1) attackRivalTarget(civ, unit, war);
            else stepToward(unit, war.target, civ);
            finish(unit); return;
          }
          if (action.kind === 'player-attack') {
            if (!spend()) return;
            deps.rivalCombat.attackPlayerUnit(state, civ, unit, action.victim, {
              damageAmount:deps.damageAmount, defenseBonus:deps.defenseBonus,
              logEvent:deps.logEvent,
              recordAttack:deps.livingCivilizations && deps.livingCivilizations.recordAttack,
              killUnit:deps.killUnit
            });
            finish(unit); return;
          }
          if (action.kind === 'camp-attack') {
            if (!spend()) return;
            const camp = campAt(action.spot.x, action.spot.y);
            if (deps.rivalCombat.attackCamp(unit, camp, { damageAmount:deps.damageAmount })) {
              campReward(civ, unit, action.spot.x, action.spot.y);
            }
            finish(unit); return;
          }
          if (action.kind === 'barbarian-attack') {
            if (!spend()) return;
            aiAttackBarbarian(civ, unit); finish(unit); return;
          }
          if (action.kind === 'guard') { finish(unit); return; }
          if (action.kind === 'found-city') {
            if (!spend()) return;
            const city = {
              id:civ.civilizationId + '-city' + civ.cities.length,
              name:'Ривен ' + civ.cities.length, x:unit.x, y:unit.y,
              population:1, food:0, production:0, buildings:[], queue:null,
              hp:150, maxHp:150, youngUntil:state.turn + 3
            };
            civ.cities.push(city);
            civ.units = civ.units.filter(function (item) { return item.id !== unit.id; });
            logEvent('rival-city-founded', civ.name + ' основал город ' + city.name + '.',
              { x:city.x, y:city.y },
              { actorType:'civilization', actorId:civ.civilizationId, phase:'rivals' });
            finish(unit); return;
          }
          if (action.kind === 'travel' && spend()) {
            stepToward(unit, action.target, civ);
            aiResolvePoi(civ, unit);
            finish(unit);
          }
        });
      });
      const livingRivals = rivals.filter(function (civ) { return !civ.defeated; });
      if (livingRivals.length >= 2 && state.turn >= AI_LIMITS.minWarTurn
        && !livingRivals[0].diplomacy[livingRivals[1].civilizationId]) {
        setRivalWar(livingRivals[0], livingRivals[1]);
        logEvent('rival-war-declared',
          livingRivals[0].name + ' и ' + livingRivals[1].name + ' начали войну.',
          null, { actorType:'civilization', actorId:livingRivals[0].civilizationId, phase:'rivals' });
      }
      return budget.used - started;
    }

    return {
      processRivals, revealForRival, stepToward, nearestUnknown,
      aiAttackBarbarian, campReward, performAlliedWarAction, chooseAiGoal,
      canRivalFoundCity, nearestKnownFinitePoi, aiResolvePoi
    };
  }

  window.EpohiRivalTurn = { create };
})();
