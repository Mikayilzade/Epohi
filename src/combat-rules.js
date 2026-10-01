(function () {
  "use strict";

  const { TERRAIN, COMBAT_BALANCE } = window.EpohiData;

  // The existing direct, guard-order, and route combats have different
  // variance/defense rules. Keep their behavior explicit in balance data.
  function damage(profileName, attack, defense, randomValue) {
    const profile = COMBAT_BALANCE[profileName];
    if (!profile) throw new Error("Unknown combat profile: " + profileName);
    const variance = profile.varianceBase + (profile.varianceRange ? randomValue * profile.varianceRange : 0);
    return Math.max(COMBAT_BALANCE.minimumDamage,
      Math.round((attack - defense * profile.defenseWeight) * variance));
  }

  function terrainBonus(tile, baseDefense, hasSettlement) {
    const terrain = TERRAIN[tile.terrain] || {};
    let bonus = (Number(baseDefense) || 0) * (Number(terrain.defenseModifier) || 0) / 100;
    if (hasSettlement) bonus += COMBAT_BALANCE.settlementDefense;
    if (tile.improvement && !tile.pillaged) bonus += COMBAT_BALANCE.improvementDefense;
    return bonus;
  }

  function terrainAdjustedDefense(tile, baseDefense) {
    const terrain = tile && TERRAIN[tile.terrain];
    return baseDefense * (1 + (Number(terrain && terrain.defenseModifier) || 0) / 100);
  }

  window.EpohiCombatRules = { damage: damage, terrainBonus: terrainBonus, terrainAdjustedDefense: terrainAdjustedDefense };
})();
