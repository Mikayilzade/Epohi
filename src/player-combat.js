(function () {
  "use strict";

  const { UNIT_DEFS, BARBARIAN, PLAYER_COMBAT_RULES: BALANCE } = window.EpohiData;
  const { isAdjacent } = window.EpohiUtils;

  function targets(state, x, y) {
    const barbarian = (state.barbarians || []).find(function (item) {
      return item.x === x && item.y === y && item.hp > 0;
    }) || null;
    const tile = state.map[y] && state.map[y][x];
    const camp = tile && tile.camp && tile.camp.hp > 0 ? tile.camp : null;
    let rivalUnit = null;
    let rivalCity = null;
    (state.rivals || []).some(function (civ) {
      const unit = (civ.units || []).find(function (item) {
        return item.x === x && item.y === y && item.hp > 0;
      });
      if (unit && !rivalUnit) rivalUnit = { civ:civ, unit:unit };
      const city = (civ.cities || []).find(function (item) {
        return item.x === x && item.y === y && item.hp > 0;
      });
      if (city && !rivalCity) rivalCity = { civ:civ, city:city };
      return !!(rivalUnit && rivalCity);
    });
    return { barbarian:barbarian, camp:camp, rivalUnit:rivalUnit, rivalCity:rivalCity };
  }

  function canAttack(state, unit, x, y) {
    if (!unit || unit.moves <= 0 || (UNIT_DEFS[unit.type].attack || 0) <= 0
      || !isAdjacent(unit.x, unit.y, x, y)) return false;
    const target = targets(state, x, y);
    const hostile = (target.rivalUnit && target.rivalUnit.civ.relation === "war")
      || (target.rivalCity && target.rivalCity.civ.relation === "war");
    return !!(target.barbarian || target.camp || hostile);
  }

  function attack(state, unit, x, y, rules) {
    if (!canAttack(state, unit, x, y)) return null;
    const target = targets(state, x, y);
    const barb = target.barbarian, camp = target.camp;
    const ru = target.rivalUnit, rc = target.rivalCity;
    const victim = barb || camp || (ru && ru.unit) || (rc && rc.city);
    const def = UNIT_DEFS[unit.type];
    if (rules.recordAttack && (ru || rc)) rules.recordAttack(state, (ru || rc).civ, "player");
    const defense = barb ? BARBARIAN.raiderDefense
      : (ru ? (UNIT_DEFS[ru.unit.type].defense || 0) : BALANCE.cityDefense);
    victim.hp -= rules.damageAmount(def.attack || BALANCE.fallbackAttack,
      defense + rules.defenseBonus(x, y, defense));
    rules.logEvent(state, rc ? "city-attacked" : "attack",
      def.name + " атакует цель.", { x:x, y:y },
      { actorType:"player", actorId:"player" });
    unit.moves = 0;
    unit.acted = true;
    let message = def.name + " атакует.";
    let attackerDied = false;
    if (victim.hp <= 0) {
      if (barb) {
        state.barbarians = state.barbarians.filter(function (item) { return item.id !== barb.id; });
        message = "Варвар повержен.";
      } else if (camp) {
        rules.campReward({ resources:state.resources }, unit, x, y);
        state.resources.production += BALANCE.campProductionReward;
        message = rules.maybeAddArtifact("camp")
          ? "Лагерь уничтожен: +25 золота, +6 науки/производства и артефакт."
          : "Лагерь уничтожен: +25 золота, +6 науки/производства.";
      } else if (ru) {
        ru.civ.units = ru.civ.units.filter(function (item) { return item.id !== ru.unit.id; });
        rules.logEvent(state, "unit-destroyed", "Уничтожен юнит: " + ru.civ.name + ".",
          { x:x, y:y }, { actorType:"player", actorId:"player" });
        message = "Юнит соперника уничтожен.";
      } else if (rc) {
        rc.city.hp = 0;
        rc.civ.defeated = rc.city.capital;
        rules.logEvent(state, "city-captured", "Захвачен город: " + rc.city.name + ".",
          { x:x, y:y }, { actorType:"player", actorId:"player" });
        if (rc.city.capital) {
          rc.civ.units = [];
          message = "Столица соперника захвачена.";
          if ((state.rivals || []).every(function (civ) { return civ.defeated; })) {
            state.victory = true;
            rules.logEvent(state, "victory", "Захвачены столицы всех соперников.",
              null, { actorType:"player", actorId:"player" });
          }
        } else message = "Город соперника захвачен.";
      }
      if (!state.units.some(function (item) { return item.x === x && item.y === y; })
        && rules.passableTile(state.map[y][x])) {
        unit.x = x;
        unit.y = y;
        rules.revealAround(state, x, y, unit.type === "scout" ? rules.scoutSight() : 1);
      }
    } else if (ru && isAdjacent(unit.x, unit.y, ru.unit.x, ru.unit.y)) {
      unit.hp -= rules.damageAmount((UNIT_DEFS[ru.unit.type].attack || BALANCE.fallbackAttack) * BALANCE.rivalCounterattackFactor,
        (def.defense || 0) + rules.defenseBonus(unit.x, unit.y, def.defense || 0));
      message += " Ответный удар: здоровье " + Math.max(0, Math.ceil(unit.hp)) + "/" + unit.maxHp + ".";
      attackerDied = unit.hp <= 0;
    } else if (barb && isAdjacent(unit.x, unit.y, barb.x, barb.y)) {
      unit.hp -= rules.damageAmount(BARBARIAN.raiderAttack * BALANCE.barbarianCounterattackFactor,
        (def.defense || 0) + rules.defenseBonus(unit.x, unit.y, def.defense || 0));
      message += " Ответный удар: здоровье " + Math.max(0, Math.ceil(unit.hp)) + "/" + unit.maxHp + ".";
      attackerDied = unit.hp <= 0;
    }
    if (attackerDied) {
      state.units = state.units.filter(function (item) { return item.id !== unit.id; });
      message = "Юнит погиб в бою.";
    }
    return { message:message, attackerDied:attackerDied };
  }

  window.EpohiPlayerCombat = { canAttack:canAttack, attack:attack };
})();
