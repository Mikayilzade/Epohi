(function () {
  "use strict";

  const { INTEREST_TYPES, ARTIFACT_BONUSES, BARBARIAN,
    PLAYER_EXPLORATION_RULES: BALANCE } = window.EpohiData;
  const { isAdjacent, neighborsOf } = window.EpohiUtils;
  const MOVEMENT = window.EpohiMovement;

  function create(state, rules) {
    function canMove(unit, x, y) {
      const tile = state.map[y] && state.map[y][x];
      const hidden = tile && !tile.revealed && !state.openMapMode;
      return !!(unit && unit.moves > 0 && !unit.acted && isAdjacent(unit.x, unit.y, x, y)
        && tile && (hidden || rules.passableTile(tile))
        && (hidden || (!rules.barbarianAt(x, y) && !rules.campAt(x, y)
          && !rules.rivalUnitAt(x, y) && !rules.rivalCityAt(x, y))));
    }

    function move(unit, x, y) {
      if (!canMove(unit, x, y)) return null;
      const tile = state.map[y][x];
      if (!tile.revealed && !state.openMapMode && rules.allowTravelOrder) return { kind:"travel-order" };
      const terrainCost = MOVEMENT.cost(state, { x:x, y:y }, true);
      if (unit.moves < terrainCost && rules.allowTravelOrder) return { kind:"travel-order" };
      if (!MOVEMENT.spend(unit, terrainCost)) return null;
      unit.x = x; unit.y = y;
      const radius = unit.type === "scout" ? rules.scoutSight()
        : (unit.type === "warrior" ? 1 : 0);
      tile.revealed = true;
      rules.revealAround(state, x, y, radius);
      const mayExplore = unit.type === "scout" || unit.type === "warrior";
      return { kind:mayExplore && tile.poi && !tile.poi.used ? "poi"
        : (mayExplore && tile.feature === "ruins" ? "ruins" : "moved"), tile:tile };
    }

    function rewardResource(key, amount) {
      state.resources[key] = (state.resources[key] || 0) + amount;
    }

    function maybeAddArtifact(reason) {
      if (rules.random() > BALANCE.artifactChance && reason !== "poi") return false;
      const bonus = rules.randomChoice(ARTIFACT_BONUSES);
      const artifact = { name:"Артефакт " + (state.artifacts.length + 1),
        bonus:bonus.id, text:bonus.name };
      state.artifacts.push(artifact);
      state.permanentBonuses[bonus.id] = (state.permanentBonuses[bonus.id] || 0) + 1;
      rules.logEvent(state, "artifact-found", "найден артефакт — " + bonus.name + ".",
        null, { actorType:"player", actorId:"player", data:{ bonus:bonus.id },
          historyLimit:Infinity, presentationSilent:true });
      return true;
    }

    function spawnAmbush(x, y) {
      const spot = neighborsOf(x, y, rules.mapSizeCells(state)).find(function (point) {
        return rules.passableTile(state.map[point.y][point.x])
          && !rules.unitsAt(point.x, point.y).length
          && !rules.barbarianAt(point.x, point.y);
      });
      if (spot) state.barbarians.push({ id:"b" + state.nextBarbarianId++,
        x:spot.x, y:spot.y, hp:BARBARIAN.raiderHealth,
        maxHp:BARBARIAN.raiderHealth, homeX:x, homeY:y, last:null });
    }

    function resolvePointOfInterest(tile, unit, choice) {
      const type = tile.poi.type, def = INTEREST_TYPES[type];
      tile.poi.used = true;
      let text = def.name + ": ";
      if (type === "ruins") {
        if (choice) { rewardResource("science", BALANCE.ruinsScience); text += "+14 науки."; }
        else { rewardResource("gold", BALANCE.ruinsGold); text += "+18 золота."; }
      } else if (type === "grove") {
        if (choice) {
          state.permanentBonuses.science = (state.permanentBonuses.science || 0) + 1;
          text += "+1 наука за ход.";
        } else { rewardResource("production", BALANCE.groveProduction); text += "+24 производства."; }
      } else if (type === "cave") {
        if (choice) {
          if (rules.random() < BALANCE.caveAmbushChance) spawnAmbush(unit.x, unit.y);
          else { maybeAddArtifact("poi"); text += "найден артефакт."; }
        } else text += "вы оставили её в покое.";
      } else {
        const rewards = BALANCE.randomRewards;
        let reward = rules.randomChoice(rewards);
        if (reward.k === "worker" && rules.random() > BALANCE.workerFindChance) reward = rewards[0];
        if (["gold","science","food","production"].indexOf(reward.k) !== -1)
          rewardResource(reward.k, reward.a);
        else if (reward.k === "reveal") rules.revealAround(state, unit.x, unit.y, 3);
        else if (reward.k === "heal") unit.hp = Math.min(unit.maxHp, unit.hp + reward.a);
        else if (reward.k === "worker") rules.addUnit("worker");
        else if (reward.k === "artifact") maybeAddArtifact("poi");
        else if (reward.k === "ambush") spawnAmbush(unit.x, unit.y);
        text += reward.t;
      }
      rules.logEvent(state, "point-of-interest-resolved",
        "исследовано место «" + def.name + "».", { x:unit.x, y:unit.y },
        { actorType:"player", actorId:"player", historyLimit:Infinity,
          presentationSilent:true });
      return text;
    }

    function resolveRuins(tile) {
      const outcome = rules.randomChoice(BALANCE.ancientRuins);
      state.resources[outcome.key] += outcome.amount;
      tile.feature = null;
      rules.logEvent(state, "point-of-interest-resolved", "исследованы древние руины.",
        null, { actorType:"player", actorId:"player", historyLimit:Infinity,
          presentationSilent:true });
      return outcome.text;
    }

    function discoverCivilizations() {
      const discovered = [];
      (state.rivals || []).forEach(function (civ) {
        if (civ.defeated || civ.met) return;
        const capitalVisible = (civ.cities || []).some(function (city) {
          return rules.playerSees(city.x, city.y);
        });
        const unitVisible = (civ.units || []).some(function (unit) {
          return rules.playerSees(unit.x, unit.y);
        });
        if (!capitalVisible && !unitVisible) return;
        civ.met = true;
        civ.relation = "neutral";
        rules.logEvent(state, "civilization-discovered",
          "обнаружено государство: " + civ.name, null,
          { actorType:"civilization", actorId:civ.civilizationId });
        discovered.push({ name:civ.name, capitalVisible:capitalVisible });
      });
      return discovered;
    }

    return { canMove, move, maybeAddArtifact, resolvePointOfInterest,
      resolveRuins, discoverCivilizations };
  }

  window.EpohiPlayerExploration = { create };
})();
