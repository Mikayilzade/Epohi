(function () {
  "use strict";

  const data = window.EpohiData;
  const { IMPROVEMENTS, WORKER_PROJECT_RULES } = data;
  const { chebyshev, isAdjacent } = window.EpohiUtils;

  function playerCities(state) {
    return Array.isArray(state.cities) && state.cities.length ? state.cities
      : (state.city ? [state.city] : []);
  }

  function workerTurns(id, repair) {
    if (repair) return WORKER_PROJECT_RULES.repairActions;
    const rules = WORKER_PROJECT_RULES;
    const production = Number(IMPROVEMENTS[id] && IMPROVEMENTS[id].cost
      && IMPROVEMENTS[id].cost.production) || rules.defaultProduction;
    return Math.max(rules.minimumActions, Math.min(rules.maximumActions,
      Math.ceil(production / rules.productionPerAction)));
  }

  function hasTech(state, id) {
    if (!id) return true;
    return [state.researched, state.technologies].some(function (list) {
      return Array.isArray(list) && list.includes(id);
    });
  }

  function validTarget(state, unit, id, x, y) {
    const tile = state && state.map && state.map[y] && state.map[y][x];
    const definition = IMPROVEMENTS[id];
    if (!unit || unit.type !== "worker" || !tile || !definition || !tile.revealed
      || !window.EpohiTerritory.inTerritory(state, x, y)) return false;
    const standing = Number(unit.x) === Number(x) && Number(unit.y) === Number(y);
    const coastal = id === "harbor" && isAdjacent(unit.x, unit.y, x, y);
    if (!standing && !coastal) return false;
    if (!definition.terrain.includes(tile.terrain) || !hasTech(state, definition.tech)) return false;
    return !(tile.improvement && !tile.pillaged);
  }

  function complete(state, unit, logEvent) {
    const project = unit && unit.workerProject;
    if (!project) return false;
    const tile = state.map[project.y] && state.map[project.y][project.x];
    if (!tile) { unit.workerProject = null; return false; }
    if (project.type === "repair") {
      tile.pillaged = false;
      logEvent(state, "worker-repair", (unit.name || "Рабочий") + " завершил ремонт.",
        { x:project.x, y:project.y });
    } else {
      tile.improvement = project.improvementId;
      tile.pillaged = false;
      const nearest = playerCities(state).slice().sort(function (a, b) {
        return chebyshev(a.x, a.y, project.x, project.y)
          - chebyshev(b.x, b.y, project.x, project.y);
      })[0];
      if (nearest) tile.owner = nearest.id;
      logEvent(state, "worker-build",
        (unit.name || "Рабочий") + " построил «" + IMPROVEMENTS[project.improvementId].name + "».",
        { x:project.x, y:project.y });
    }
    unit.workerProject = null;
    if (unit.order && unit.order.type === "develop") {
      unit.order.status = "active";
      unit.order.reason = null;
      unit.order.target = null;
    }
    unit.moves = 0;
    unit.acted = true;
    return true;
  }

  function start(state, unitId, id, x, y, repair, logEvent) {
    const unit = state && (state.units || []).find(function (candidate) {
      return String(candidate.id) === String(unitId);
    });
    if (!unit || unit.type !== "worker" || unit.acted || unit.workerProject) return null;
    const tx = x == null ? Number(unit.x) : Number(x);
    const ty = y == null ? Number(unit.y) : Number(y);
    const tile = state.map[ty] && state.map[ty][tx];
    const improvementId = repair ? (tile && tile.improvement) : id;
    if (repair) {
      if (!tile || !tile.improvement || !tile.pillaged
        || Number(unit.x) !== tx || Number(unit.y) !== ty) return null;
    } else if (!validTarget(state, unit, improvementId, tx, ty)) return null;
    const total = workerTurns(improvementId, !!repair);
    unit.workerProject = {
      type:repair ? "repair" : "improvement", improvementId, x:tx, y:ty,
      totalTurns:total, remainingTurns:Math.max(0, total - 1),
      startedTurn:Number(state.turn) || 1
    };
    unit.moves = 0;
    unit.acted = true;
    if (unit.order && unit.order.type === "develop") {
      unit.order.status = "active";
      unit.order.reason = "строит улучшение";
    }
    const remaining = unit.workerProject.remainingTurns;
    if (remaining <= 0) complete(state, unit, logEvent);
    else logEvent(state, "worker-project-started",
      (unit.name || "Рабочий") + " начал работу: " + total + " действий рабочего.",
      { x:tx, y:ty });
    return { remaining, total };
  }

  function processTurn(state, logEvent) {
    let changed = false;
    (state.units || []).forEach(function (unit) {
      const project = unit.workerProject;
      if (!project) return;
      if (Number(project.startedTurn) < Number(state.turn))
        project.remainingTurns = Math.max(0, Number(project.remainingTurns || 0) - 1);
      unit.moves = 0;
      unit.acted = true;
      if (project.remainingTurns <= 0) changed = complete(state, unit, logEvent) || changed;
      else if (unit.order && unit.order.type === "develop") {
        unit.order.status = "active";
        unit.order.reason = "строит: осталось " + project.remainingTurns + " ход.";
      }
    });
    return changed;
  }

  window.EpohiWorkerProjects = { workerTurns, validTarget, start, processTurn };
})();
