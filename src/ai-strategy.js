(function () {
  "use strict";

  const { UNIT_DEFS, AI_LIMITS, AI_WEIGHTS, AI_GOAL_RULES } = window.EpohiData;

  function chooseGoal(gameState, civ, options) {
    const mapSize = options.mapSize;
    const visibleEnemies = gameState.units.filter(function (unit) {
      return civ.visible && civ.visible[unit.x + "," + unit.y];
    });
    const unknown = Object.keys(civ.explored || {}).length < mapSize * mapSize * AI_GOAL_RULES.unknownMapFraction;
    let knownCamps = 0;
    gameState.map.forEach(function (row, y) {
      row.forEach(function (tile, x) {
        if (options.knowsCamp(civ, x, y)) knownCamps += 1;
      });
    });
    const scores = {
      "исследование": unknown ? AI_WEIGHTS.exploreUnknown : AI_GOAL_RULES.knownMapExplore,
      "развитие столицы": AI_GOAL_RULES.capitalDevelopment,
      "улучшение ресурсов": (civ.units || []).some(function (unit) { return unit.type === "worker"; }) ? AI_WEIGHTS.improveNeed : AI_GOAL_RULES.noWorkerImprovement,
      "защита": visibleEnemies.length ? AI_WEIGHTS.defenseThreat : AI_GOAL_RULES.peacefulDefense,
      "основание нового поселения": (civ.cities.length < AI_LIMITS.maxCities && civ.resources.gold >= AI_GOAL_RULES.minimumSettlementGold) ? AI_WEIGHTS.settleRoom : AI_GOAL_RULES.noRoomSettlement,
      "уничтожение варварского лагеря": knownCamps ? AI_WEIGHTS.campExpedition : 0,
      "подготовка к войне": gameState.turn >= AI_LIMITS.minWarTurn ? AI_WEIGHTS.prepareWar : 0,
      "нападение на игрока": 0
    };
    const aiPower = civ.units.reduce(function (sum, unit) { return sum + (UNIT_DEFS[unit.type].attack || 0); }, 0);
    const playerPower = gameState.units.reduce(function (sum, unit) { return sum + (UNIT_DEFS[unit.type].attack || 0); }, 0);
    if (gameState.turn >= AI_LIMITS.minWarTurn && aiPower > playerPower * AI_GOAL_RULES.attackPowerRatio) {
      scores["нападение на игрока"] = AI_WEIGHTS.attackAdvantage;
    }
    if (options.adjustScores) options.adjustScores(civ, scores);
    const goal = Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; })[0];
    civ.strategicGoal = goal;
    civ.currentThreats = visibleEnemies.map(function (unit) { return unit.id; });
    civ.decisionHistory.unshift("Ход " + gameState.turn + ": цель — " + goal);
    civ.decisionHistory = civ.decisionHistory.slice(0, AI_GOAL_RULES.decisionHistoryLimit);
    return goal;
  }

  window.EpohiAiStrategy = { chooseGoal: chooseGoal };
})();
