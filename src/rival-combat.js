(function () {
  "use strict";

  const { UNIT_DEFS, AI_COMBAT_RULES } = window.EpohiData;

  function resolveAiToAiCombat(state, attacker, unit, enemy, target, eventType, text, options) {
    const baseDefense = target.type
      ? (UNIT_DEFS[target.type].defense || 0)
      : AI_COMBAT_RULES.cityDefense;
    target.hp -= options.damageAmount(
      UNIT_DEFS[unit.type].attack || AI_COMBAT_RULES.defaultAttack,
      baseDefense + options.defenseBonus(target.x, target.y, baseDefense)
    );
    options.logEvent(state, eventType, text, { x:target.x, y:target.y }, {
      actorType:'civilization', actorId:attacker.civilizationId, phase:'rivals'
    });
    if (target.hp > 0) return false;
    target.hp = 0;
    if (target.type) {
      enemy.units = enemy.units.filter(function (item) { return item !== target; });
    } else {
      options.captureAiCity(state, attacker, enemy, target);
    }
    return true;
  }

  function attackPlayerUnit(state, civ, unit, victim, options) {
    const baseDefense = UNIT_DEFS[victim.type].defense || 0;
    victim.hp -= options.damageAmount(
      UNIT_DEFS[unit.type].attack || AI_COMBAT_RULES.defaultAttack,
      baseDefense + options.defenseBonus(victim.x, victim.y, baseDefense)
    );
    options.logEvent(state, 'attack', civ.name + ' атакует юнит Ардены.',
      { x:victim.x, y:victim.y }, {
        actorType:'civilization', actorId:civ.civilizationId, phase:'rivals'
      });
    if (options.recordAttack) options.recordAttack(state, civ, 'enemy');
    if (victim.hp <= 0) options.killUnit(victim);
  }

  function attackCamp(unit, camp, options) {
    camp.hp -= options.damageAmount(
      UNIT_DEFS[unit.type].attack || AI_COMBAT_RULES.defaultAttack,
      AI_COMBAT_RULES.campDefense
    );
    return camp.hp <= 0;
  }

  window.EpohiRivalCombat = {
    resolveAiToAiCombat: resolveAiToAiCombat,
    attackPlayerUnit: attackPlayerUnit,
    attackCamp: attackCamp
  };
})();
