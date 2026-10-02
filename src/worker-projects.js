(function () {
  "use strict";

  const { IMPROVEMENTS, WORKER_PROJECT_RULES } = window.EpohiData;
  const { chebyshev, isAdjacent } = window.EpohiUtils;
  const { cityRadius, inTerritory } = window.EpohiTerritory;

  function playerCities(state) {
    return Array.isArray(state.cities) && state.cities.length ? state.cities : (state.city ? [state.city] : []);
  }
  function workerTurns(id, repair) {
    const value = repair ? WORKER_PROJECT_RULES.repairActions : IMPROVEMENTS[id] && IMPROVEMENTS[id].workerActions;
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  function hasTech(state, id) {
    return !id || [state.researched, state.technologies].some(list => Array.isArray(list) && list.includes(id));
  }
  function territoryCity(state, x, y) {
    const tile = state.map[y] && state.map[y][x];
    if (!tile) return { legal:false, city:null };
    const cities = playerCities(state);
    if (tile.owner) {
      const owner = cities.find(city => String(city.id) === String(tile.owner) || String(city.name) === String(tile.owner));
      return { legal:!!owner, city:owner || null };
    }
    if (!inTerritory(state, x, y)) return { legal:false, city:null };
    const eligible = cities.filter(city => chebyshev(city.x, city.y, x, y) <= cityRadius(city))
      .sort((a, b) => chebyshev(a.x, a.y, x, y) - chebyshev(b.x, b.y, x, y)
        || String(a.id).localeCompare(String(b.id)));
    return { legal:true, city:eligible[0] || null };
  }
  function validate(state, unit, id, x, y, repair, cityId) {
    if (!unit || unit.type !== "worker") return { ok:false, reason:"Нужен рабочий." };
    if (unit.workerProject) return { ok:false, reason:"Сначала завершите текущий проект." };
    if (unit.acted) return { ok:false, reason:"Действие рабочего в этом ходу уже потрачено." };
    const tx = x == null ? Number(unit.x) : Number(x), ty = y == null ? Number(unit.y) : Number(y);
    const tile = state && state.map && state.map[ty] && state.map[ty][tx];
    if (!tile || !tile.revealed) return { ok:false, reason:"Клетка не разведана." };
    const territory = territoryCity(state, tx, ty);
    if (!territory.legal) return { ok:false, reason:"Клетка вне вашей территории." };
    if (cityId != null && (!territory.city || String(territory.city.id) !== String(cityId)))
      return { ok:false, reason:"Клетка не относится к назначенному городу." };
    const standing = Number(unit.x) === tx && Number(unit.y) === ty;
    if (repair) {
      if (!standing) return { ok:false, reason:"Для ремонта рабочий должен стоять на клетке." };
      if (!tile.improvement || !tile.pillaged) return { ok:false, reason:"Здесь нечего ремонтировать." };
      id = tile.improvement;
    } else {
      const definition = IMPROVEMENTS[id];
      if (!definition) return { ok:false, reason:"Неизвестное улучшение." };
      if (id === "harbor" ? !isAdjacent(unit.x, unit.y, tx, ty) : !standing)
        return { ok:false, reason:id === "harbor" ? "Для гавани нужна соседняя прибрежная клетка." : "Рабочий должен стоять на клетке." };
      if (!definition.terrain.includes(tile.terrain)) return { ok:false, reason:"Неподходящая местность." };
      if (!hasTech(state, definition.tech)) return { ok:false, reason:"Не изучена нужная технология." };
      if (tile.improvement) return { ok:false, reason:tile.pillaged ? "Сначала отремонтируйте улучшение." : "Клетка уже улучшена." };
      if (tile.camp || tile.poi || playerCities(state).some(city => city.x === tx && city.y === ty)
        || (state.settlements || []).some(settlement => settlement.x === tx && settlement.y === ty))
        return { ok:false, reason:"Клетка занята другим объектом." };
    }
    const total = workerTurns(id, !!repair);
    if (!total) return { ok:false, reason:"Для проекта не задана стоимость в действиях рабочего." };
    return { ok:true, reason:null, x:tx, y:ty, improvementId:id,
      cityId:territory.city ? territory.city.id : null, totalWorkerActions:total };
  }
  function validTarget(state, unit, id, x, y) { return validate(state, unit, id, x, y, false).ok; }
  function emit(logEvent, state, type, message, position) {
    if (typeof logEvent === "function") logEvent(state, type, message, position);
  }
  function complete(state, unit, logEvent) {
    const project = unit && unit.workerProject;
    if (!project) return false;
    const tile = state.map[project.y] && state.map[project.y][project.x];
    const territory = tile && territoryCity(state, project.x, project.y);
    if (!tile || !territory.legal || (project.cityId && (!territory.city || String(territory.city.id) !== String(project.cityId)))
      || (project.type === "repair" ? !tile.improvement || !tile.pillaged : !!tile.improvement)) {
      unit.workerProject = null;
      if (unit.order && unit.order.type === "develop") {
        unit.order.status = "paused";
        unit.order.reason = "проект отменён: клетка больше не подходит";
      }
      return false;
    }
    if (project.type === "repair") {
      tile.pillaged = false;
      emit(logEvent, state, "worker-repair", (unit.name || "Рабочий") + " завершил ремонт.", { x:project.x, y:project.y });
    } else {
      tile.improvement = project.improvementId;
      tile.pillaged = false;
      if (territory.city) tile.owner = territory.city.id;
      emit(logEvent, state, "worker-build",
        (unit.name || "Рабочий") + " построил «" + IMPROVEMENTS[project.improvementId].name + "».",
        { x:project.x, y:project.y });
    }
    unit.workerProject = null;
    if (unit.order && unit.order.type === "develop") {
      unit.order.status = "active"; unit.order.reason = null; unit.order.target = null;
    }
    unit.moves = 0; unit.acted = true;
    return true;
  }
  function start(state, unitId, id, x, y, repair, logEvent, cityId) {
    const unit = state && (state.units || []).find(candidate => String(candidate.id) === String(unitId));
    const result = validate(state, unit, id, x, y, repair, cityId);
    if (!result.ok) return null;
    const total = result.totalWorkerActions;
    unit.workerProject = {
      type:repair ? "repair" : "improvement", improvementId:result.improvementId,
      x:result.x, y:result.y, cityId:result.cityId,
      totalWorkerActions:total, remainingWorkerActions:total - 1,
      actionCostVersion:WORKER_PROJECT_RULES.version,
      startedTurn:Number(state.turn) || 1, lastActionTurn:Number(state.turn) || 1
    };
    unit.moves = 0; unit.acted = true;
    if (unit.order && unit.order.type === "develop") {
      unit.order.status = "active"; unit.order.reason = "строит улучшение";
    }
    if (total === 1) complete(state, unit, logEvent);
    else emit(logEvent, state, "worker-project-started",
      (unit.name || "Рабочий") + " начал работу: " + total + " действий рабочего.",
      { x:result.x, y:result.y });
    return { remaining:total - 1, total:total };
  }
  function migrate(state) {
    (state.units || []).forEach(unit => {
      const project = unit.workerProject;
      if (!project) return;
      const total = Number(project.totalWorkerActions || project.totalTurns || workerTurns(project.improvementId, project.type === "repair"));
      const remaining = Number(project.remainingWorkerActions ?? project.remainingTurns);
      project.totalWorkerActions = Number.isFinite(total) && total > 0 ? Math.ceil(total) : 1;
      project.remainingWorkerActions = Number.isFinite(remaining)
        ? Math.max(0, Math.min(project.totalWorkerActions, Math.ceil(remaining))) : project.totalWorkerActions;
      project.startedTurn = Number(project.startedTurn) || Number(state.turn) || 1;
      project.lastActionTurn = Number(project.lastActionTurn) || project.startedTurn;
      project.actionCostVersion = project.actionCostVersion || WORKER_PROJECT_RULES.version;
      const territory = territoryCity(state, project.x, project.y);
      if (project.cityId === undefined) project.cityId = territory.city ? territory.city.id : null;
      delete project.totalTurns; delete project.remainingTurns;
      unit.moves = 0; unit.acted = true;
    });
    return state;
  }
  function processTurn(state, logEvent) {
    let changed = false;
    (state.units || []).forEach(unit => {
      const project = unit.workerProject;
      if (!project) return;
      if (Number(project.lastActionTurn) < Number(state.turn)) {
        project.remainingWorkerActions = Math.max(0, project.remainingWorkerActions - 1);
        project.lastActionTurn = Number(state.turn);
      }
      unit.moves = 0; unit.acted = true;
      if (project.remainingWorkerActions <= 0) changed = complete(state, unit, logEvent) || changed;
      else if (unit.order && unit.order.type === "develop") {
        unit.order.status = "active";
        unit.order.reason = "строит: осталось " + project.remainingWorkerActions + " ход.";
      }
    });
    return changed;
  }
  window.EpohiWorkerProjects = { workerTurns, territoryCity, validate, validTarget, start, processTurn, migrate };
})();
