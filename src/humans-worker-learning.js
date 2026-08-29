(function () {
  "use strict";

  const BUILDINGS = window.EpohiData && window.EpohiData.BUILDINGS || {};
  const UNIT_DEFS = window.EpohiData && window.EpohiData.UNIT_DEFS || {};
  const IMPROVEMENTS = window.EpohiData && window.EpohiData.IMPROVEMENTS || {};
  const OWN_BUILDING_STEP = 0.10;
  const OWN_BUILDING_MAX = 0.30;
  const FOREIGN_BUILDING_STEP = 0.05;
  const UNIT_STEP = 0.10;
  const UNIT_MAX = 0.30;

  let originalDebugFactory = null;
  let lastTurn = null;
  let beforeTurn = null;
  let queued = false;

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function state() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function playerCities(gs) {
    if (!gs) return [];
    return Array.isArray(gs.cities) && gs.cities.length ? gs.cities : (gs.city ? [gs.city] : []);
  }

  function eventId(item, index) {
    return String(item && (item.eventId || item.id) || [item && item.turn, item && item.eventType, item && item.text, index || 0].join(":"));
  }

  function addEvent(gs, type, text, position) {
    if (!gs) return;
    gs.eventCounter = (Number(gs.eventCounter) || 0) + 1;
    if (!Array.isArray(gs.eventLog)) gs.eventLog = [];
    if (!Array.isArray(gs.history)) gs.history = [];
    const item = {
      eventId: "worker-learning-" + gs.eventCounter,
      turn: Number(gs.turn) || 1,
      phase: "worker-learning",
      actorType: "player",
      actorId: "player",
      eventType: type,
      text: text,
      coordinates: position || null,
      position: position || null
    };
    gs.eventLog.unshift(item);
    gs.eventLog = gs.eventLog.slice(0, 300);
    const line = "Ход " + (Number(gs.turn) || 1) + ": " + text;
    if (gs.history.indexOf(line) < 0) gs.history.unshift(line);
    gs.history = gs.history.slice(0, 300);
  }

  function toast(text, duration) {
    const node = document.getElementById("toast");
    if (!node) return;
    node.textContent = text;
    node.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(function () { node.classList.remove("show"); }, duration || 2200);
  }

  function ensureExperience(holder) {
    if (!holder.experience) holder.experience = {};
    if (!holder.experience.buildings) holder.experience.buildings = {};
    if (!holder.experience.foreignBuildings) holder.experience.foreignBuildings = {};
    if (!holder.experience.units) holder.experience.units = {};
    return holder.experience;
  }

  function ensureState(gs) {
    if (!gs) return null;
    ensureExperience(gs);
    if (!Array.isArray(gs.workerLearningProcessedEvents)) {
      gs.workerLearningProcessedEvents = (gs.eventLog || []).map(function (item, index) { return eventId(item, index); }).slice(-900);
    }
    if (!gs.workerLearningMigrated) {
      playerCities(gs).forEach(function (city) {
        (city.buildings || []).forEach(function (id) {
          if (!city.formerCivilizationId) gs.experience.buildings[id] = (Number(gs.experience.buildings[id]) || 0) + 1;
        });
      });
      gs.workerLearningMigrated = true;
    }
    return gs;
  }

  function ownBuildingDiscount(holder, id) {
    const exp = ensureExperience(holder);
    return Math.min(OWN_BUILDING_MAX, Math.max(0, Number(exp.buildings[id]) || 0) * OWN_BUILDING_STEP);
  }

  function foreignBuildingDiscount(holder, id) {
    const exp = ensureExperience(holder);
    const sources = Array.isArray(exp.foreignBuildings[id]) ? exp.foreignBuildings[id] : [];
    return sources.length * FOREIGN_BUILDING_STEP;
  }

  function buildingDiscount(holder, id) {
    return ownBuildingDiscount(holder, id) + foreignBuildingDiscount(holder, id);
  }

  function unitDiscount(holder, id) {
    const produced = Math.max(0, Number(ensureExperience(holder).units[id]) || 0);
    return Math.min(UNIT_MAX, Math.floor(produced / 10) * UNIT_STEP);
  }

  function effectiveProductionCost(holder, type, id) {
    const def = type === "building" ? BUILDINGS[id] : UNIT_DEFS[id];
    const base = Number(def && def.cost && def.cost.production) || 0;
    if (!base) return 0;
    const discount = type === "building" ? buildingDiscount(holder, id) : unitDiscount(holder, id);
    return Math.max(1, Math.ceil(base * Math.max(0.05, 1 - discount)));
  }

  function hasTech(gs, id) {
    if (!id) return true;
    return [gs.researched, gs.technologies].some(function (list) { return Array.isArray(list) && list.indexOf(id) >= 0; });
  }

  function activeCity(gs) {
    const value = debug();
    const id = value && typeof value.getSelectedCityId === "function" ? value.getSelectedCityId() : null;
    return playerCities(gs).find(function (city) { return String(city.id) === String(id); }) || playerCities(gs)[0] || null;
  }

  function nonProductionCost(def) {
    const result = {};
    Object.keys(def && def.cost || {}).forEach(function (key) {
      if (key !== "production") result[key] = Number(def.cost[key]) || 0;
    });
    return result;
  }

  function canAfford(gs, cost) {
    return Object.keys(cost || {}).every(function (key) {
      return Number(gs.resources && gs.resources[key] || 0) >= Number(cost[key] || 0);
    });
  }

  function pay(gs, cost) {
    Object.keys(cost || {}).forEach(function (key) {
      gs.resources[key] = Number(gs.resources[key] || 0) - Number(cost[key] || 0);
    });
  }

  function queueProject(gs, city, type, id) {
    const def = type === "building" ? BUILDINGS[id] : UNIT_DEFS[id];
    if (!def || !city || city.queue) return false;
    if (def.tech && !hasTech(gs, def.tech)) return false;
    if (type === "building" && (city.buildings || []).indexOf(id) >= 0) return false;
    const need = type === "unit" ? Number(def.population || 1) : (id === "palace" ? 6 : 0);
    if (need && Number(city.population || 0) < need) {
      toast("Нужно население города " + need + "+.");
      return false;
    }
    const upfront = nonProductionCost(def);
    if (!canAfford(gs, upfront)) {
      toast("Не хватает общих ресурсов.");
      return false;
    }
    pay(gs, upfront);
    const cost = effectiveProductionCost(gs, type, id);
    city.queue = {
      type: type,
      id: id,
      progress: 0,
      cost: cost,
      baseCost: Number(def.cost && def.cost.production) || 0,
      upfront: upfront,
      learningDiscount: type === "building" ? buildingDiscount(gs, id) : unitDiscount(gs, id)
    };
    addEvent(gs, "city-production-started", city.name + ": начат проект «" + def.name + "» за " + cost + " производства.", { x:city.x, y:city.y });
    const value = debug();
    if (value && typeof value.render === "function") value.render();
    window.setTimeout(function () {
      const cityButton = document.getElementById("cityBtn");
      if (cityButton) cityButton.click();
    }, 0);
    return true;
  }

  function processExperienceEvents(gs) {
    ensureState(gs);
    const processed = new Set(gs.workerLearningProcessedEvents.map(String));
    (gs.eventLog || []).slice().reverse().forEach(function (item, index) {
      if (!item) return;
      const id = eventId(item, index);
      if (processed.has(id)) return;
      processed.add(id);
      if (item.eventType !== "city-production-completed" || item.actorType === "civilization") return;
      const text = String(item.text || "");
      Object.keys(BUILDINGS).some(function (buildingId) {
        if (text.indexOf(BUILDINGS[buildingId].name) < 0 || text.indexOf("заверш") < 0) return false;
        gs.experience.buildings[buildingId] = (Number(gs.experience.buildings[buildingId]) || 0) + 1;
        return true;
      });
      Object.keys(UNIT_DEFS).some(function (unitId) {
        if (text.indexOf(UNIT_DEFS[unitId].name) < 0 || (text.indexOf("подготов") < 0 && text.indexOf("готов") < 0)) return false;
        gs.experience.units[unitId] = (Number(gs.experience.units[unitId]) || 0) + 1;
        return true;
      });
    });
    gs.workerLearningProcessedEvents = Array.from(processed).slice(-1000);
  }

  function workerTurns(id, repair) {
    if (repair) return 1;
    const production = Number(IMPROVEMENTS[id] && IMPROVEMENTS[id].cost && IMPROVEMENTS[id].cost.production) || 6;
    return Math.max(1, Math.min(4, Math.ceil(production / 6)));
  }

  function inTerritory(gs, x, y) {
    return !window.EpohiTerritory || typeof window.EpohiTerritory.inTerritory !== "function" || window.EpohiTerritory.inTerritory(gs, x, y);
  }

  function validWorkerTarget(gs, unit, id, x, y) {
    const tile = gs && gs.map && gs.map[y] && gs.map[y][x];
    const def = IMPROVEMENTS[id];
    if (!unit || unit.type !== "worker" || !tile || !def || !tile.revealed || !inTerritory(gs, x, y)) return false;
    const standing = Number(unit.x) === Number(x) && Number(unit.y) === Number(y);
    const coastal = id === "harbor" && window.EpohiUtils && window.EpohiUtils.isAdjacent(unit.x, unit.y, x, y);
    if (!standing && !coastal) return false;
    if (def.terrain.indexOf(tile.terrain) < 0 || (def.tech && !hasTech(gs, def.tech))) return false;
    return !(tile.improvement && !tile.pillaged);
  }

  function completeWorkerProject(gs, unit) {
    const project = unit && unit.workerProject;
    if (!project) return false;
    const tile = gs.map[project.y] && gs.map[project.y][project.x];
    if (!tile) { unit.workerProject = null; return false; }
    if (project.type === "repair") {
      tile.pillaged = false;
      addEvent(gs, "worker-repair", (unit.name || "Рабочий") + " завершил ремонт.", {x:project.x,y:project.y});
    } else {
      tile.improvement = project.improvementId;
      tile.pillaged = false;
      const nearest = playerCities(gs).slice().sort(function (a, b) {
        return window.EpohiUtils.chebyshev(a.x, a.y, project.x, project.y) - window.EpohiUtils.chebyshev(b.x, b.y, project.x, project.y);
      })[0];
      if (nearest) tile.owner = nearest.id;
      addEvent(gs, "worker-build", (unit.name || "Рабочий") + " построил «" + IMPROVEMENTS[project.improvementId].name + "».", {x:project.x,y:project.y});
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

  function startWorkerProject(unitId, id, x, y, repair) {
    const gs = ensureState(state());
    const unit = gs && (gs.units || []).find(function (item) { return String(item.id) === String(unitId); });
    if (!unit || unit.type !== "worker" || unit.acted || unit.workerProject) return false;
    const tx = x == null ? Number(unit.x) : Number(x);
    const ty = y == null ? Number(unit.y) : Number(y);
    const tile = gs.map[ty] && gs.map[ty][tx];
    const repairing = !!repair;
    const improvementId = repairing ? (tile && tile.improvement) : id;
    if (repairing) {
      if (!tile || !tile.improvement || !tile.pillaged || Number(unit.x) !== tx || Number(unit.y) !== ty) return false;
    } else if (!validWorkerTarget(gs, unit, improvementId, tx, ty)) return false;
    const total = workerTurns(improvementId, repairing);
    unit.workerProject = {
      type: repairing ? "repair" : "improvement",
      improvementId: improvementId,
      x: tx,
      y: ty,
      totalTurns: total,
      remainingTurns: Math.max(0, total - 1),
      startedTurn: Number(gs.turn) || 1
    };
    unit.moves = 0;
    unit.acted = true;
    if (unit.order && unit.order.type === "develop") {
      unit.order.status = "active";
      unit.order.reason = "строит улучшение";
    }
    if (unit.workerProject.remainingTurns <= 0) completeWorkerProject(gs, unit);
    else {
      addEvent(gs, "worker-project-started", (unit.name || "Рабочий") + " начал работу: " + total + " рабоч. ход.", {x:tx,y:ty});
      toast("Работа начата: осталось " + unit.workerProject.remainingTurns + " ход.");
    }
    const value = debug();
    if (value && typeof value.render === "function") value.render();
    return true;
  }

  function processWorkerProjects(gs) {
    let changed = false;
    (gs.units || []).forEach(function (unit) {
      const project = unit.workerProject;
      if (!project) return;
      if (Number(project.startedTurn) < Number(gs.turn)) project.remainingTurns = Math.max(0, Number(project.remainingTurns || 0) - 1);
      unit.moves = 0;
      unit.acted = true;
      if (project.remainingTurns <= 0) changed = completeWorkerProject(gs, unit) || changed;
      else if (unit.order && unit.order.type === "develop") {
        unit.order.status = "active";
        unit.order.reason = "строит: осталось " + project.remainingTurns + " ход.";
      }
    });
    return changed;
  }

  function patchDebug() {
    if (originalDebugFactory || typeof window.__epohiDebug !== "function") return;
    originalDebugFactory = window.__epohiDebug;
    window.__epohiDebug = function () {
      const value = originalDebugFactory();
      if (!value) return value;
      value.buildImprovementWithWorker = function (unitId, id, x, y) { return startWorkerProject(unitId, id, x, y, false); };
      value.repairImprovement = function (unitId) {
        const gs = value.state;
        const unit = gs && (gs.units || []).find(function (item) { return String(item.id) === String(unitId); });
        return unit ? startWorkerProject(unitId, null, unit.x, unit.y, true) : false;
      };
      return value;
    };
  }

  function patchCityUi(gs) {
    const modal = document.getElementById("cityModal");
    const content = document.getElementById("cityContent");
    if (!modal || !modal.classList.contains("show") || !content) return;
    Object.keys(UNIT_DEFS).forEach(function (id) {
      const def = UNIT_DEFS[id];
      const card = Array.from(content.querySelectorAll(".game-card")).find(function (item) { const h=item.querySelector("h3"); return h && h.textContent.indexOf(def.name) >= 0; });
      if (!card) return;
      let note = card.querySelector('[data-unit-learning="' + id + '"]');
      if (!note) { note=document.createElement("small"); note.dataset.unitLearning=id; note.className="learning-note"; const p=card.querySelector("p"); if(p)p.appendChild(note); }
      const made = Number(gs.experience.units[id]) || 0;
      note.textContent = " · население " + (def.population || 1) + "+ · произведено " + made + " · скидка " + Math.round(unitDiscount(gs,id)*100) + "% · 🔨 " + effectiveProductionCost(gs,"unit",id);
    });
    Object.keys(BUILDINGS).forEach(function (id) {
      const def = BUILDINGS[id];
      const card = Array.from(content.querySelectorAll(".game-card")).find(function (item) { const h=item.querySelector("h3"); return h && h.textContent.indexOf(def.name) >= 0; });
      if (!card) return;
      let note = card.querySelector('[data-building-learning="' + id + '"]');
      if (!note) { note=document.createElement("small"); note.dataset.buildingLearning=id; note.className="learning-note"; const p=card.querySelector("p"); if(p)p.appendChild(note); }
      const own = Number(gs.experience.buildings[id]) || 0;
      const foreign = Array.isArray(gs.experience.foreignBuildings[id]) ? gs.experience.foreignBuildings[id].length : 0;
      note.textContent = " · своих построено " + own + (foreign ? " · чужих школ " + foreign : "") + " · скидка " + Math.round(buildingDiscount(gs,id)*100) + "% · 🔨 " + effectiveProductionCost(gs,"building",id);
    });
  }

  function patchWorkerUi(gs) {
    const value = debug();
    const selectedId = value && typeof value.getSelectedUnitId === "function" ? value.getSelectedUnitId() : null;
    const unit = (gs.units || []).find(function (item) { return String(item.id) === String(selectedId); });
    if (!unit || unit.type !== "worker") return;
    const text = document.getElementById("contextText");
    if (text && text.textContent.indexOf("Рабочее время") < 0) {
      text.textContent += unit.workerProject ? " · Рабочее время: осталось " + unit.workerProject.remainingTurns + " ход." : " · Рабочее время: улучшения не тратят производство города.";
    }
    document.querySelectorAll('[data-context-action="build-improvement"],[data-context-action="build-harbor"],[data-context-action="repair"]').forEach(function (button) {
      button.disabled = !!unit.workerProject || !!unit.acted;
      if (button.dataset.contextAction === "repair") button.innerHTML = "Ремонт<br>1 рабоч. ход";
      else {
        const tile = document.querySelector("#map .tile.inspect-tile");
        const tx = tile ? Number(tile.dataset.x) : Number(unit.x);
        const ty = tile ? Number(tile.dataset.y) : Number(unit.y);
        const mapTile = gs.map[ty] && gs.map[ty][tx];
        const id = button.dataset.contextAction === "build-harbor" ? "harbor" : Object.keys(IMPROVEMENTS).find(function (key) {
          const def=IMPROVEMENTS[key]; return key!=="harbor" && mapTile && def.terrain.indexOf(mapTile.terrain)>=0 && (!def.tech || hasTech(gs,def.tech));
        });
        if (id) button.innerHTML = IMPROVEMENTS[id].icon + "<br>" + workerTurns(id,false) + " рабоч. ход.";
      }
    });
  }

  function fullyRevealed(gs) {
    return !!gs && Array.isArray(gs.map) && gs.map.every(function (row) { return row.every(function (tile) { return !!tile.revealed; }); });
  }

  function patchMapPurchase(gs) {
    const button = document.querySelector('[data-treasury-action="map"]');
    if (!button || !fullyRevealed(gs)) return;
    button.disabled = true;
    button.textContent = "Карта открыта";
    const card = button.closest("article");
    const p = card && card.querySelector("p");
    if (p) p.textContent = "Вся карта уже разведана. Дополнительные карты больше ничего не откроют.";
  }

  function captureBeforeTurn(event) {
    if (!event.target.closest || !event.target.closest("#endTurnBtn")) return;
    const gs = ensureState(state());
    if (!gs) return;
    beforeTurn = { turn:Number(gs.turn)||1, history:(gs.history||[]).slice(0,8) };
  }

  function reverseLegacyRandomEvent(gs) {
    if (!beforeTurn) return;
    const newest = (gs.history || []).slice(0,12).filter(function (line) { return beforeTurn.history.indexOf(line) < 0; });
    const rules = [
      {match:"Богатый урожай принёс +7",key:"food",amount:7},
      {match:"Умелые мастера дали +6",key:"production",amount:6},
      {match:"Караван торговцев оставил +8",key:"gold",amount:8},
      {match:"Мудрец поделился знаниями: +6",key:"science",amount:6},
      {match:"Засуха уничтожила 5",key:"food",amount:-5}
    ];
    let changed = false;
    rules.forEach(function (rule) {
      if (!newest.some(function (line) { return String(line).indexOf(rule.match) >= 0; })) return;
      if (gs.resources && Number.isFinite(gs.resources[rule.key])) gs.resources[rule.key] = Math.max(0, Number(gs.resources[rule.key]) - rule.amount);
      changed = true;
    });
    if (changed) {
      gs.history = (gs.history || []).filter(function (line) { return !rules.some(function (rule) { return String(line).indexOf(rule.match) >= 0; }); });
    }
    beforeTurn = null;
  }

  function suppressIncomeToast() {
    const node = document.getElementById("toast");
    if (!node || node.dataset.incomeToastGuard === "1") return;
    node.dataset.incomeToastGuard = "1";
    new MutationObserver(function () {
      const text = String(node.textContent || "");
      if (text.indexOf("Города получили:") >= 0 || text.indexOf("Соперники действуют:") >= 0) node.classList.remove("show");
    }).observe(node,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["class"]});
  }

  function handleClick(event) {
    const queue = event.target.closest && event.target.closest("[data-queue-type][data-queue-id]");
    if (queue && !queue.disabled) {
      event.preventDefault(); event.stopImmediatePropagation();
      const gs=ensureState(state()), city=activeCity(gs);
      if (gs && city) queueProject(gs,city,queue.dataset.queueType,queue.dataset.queueId);
      return;
    }
    const build = event.target.closest && event.target.closest('[data-context-action="build-improvement"],[data-context-action="build-harbor"],[data-context-action="repair"]');
    if (build && !build.disabled) {
      const gs=ensureState(state()), value=debug(), selectedId=value&&value.getSelectedUnitId?value.getSelectedUnitId():null;
      const unit=gs&&(gs.units||[]).find(function(item){return String(item.id)===String(selectedId);});
      if (!unit || unit.type!=="worker") return;
      event.preventDefault(); event.stopImmediatePropagation();
      const tile=document.querySelector("#map .tile.inspect-tile"), tx=tile?Number(tile.dataset.x):unit.x, ty=tile?Number(tile.dataset.y):unit.y;
      if (build.dataset.contextAction==="repair") startWorkerProject(unit.id,null,unit.x,unit.y,true);
      else if (build.dataset.contextAction==="build-harbor") startWorkerProject(unit.id,"harbor",tx,ty,false);
      else {
        const mapTile=gs.map[ty]&&gs.map[ty][tx];
        const id=Object.keys(IMPROVEMENTS).find(function(key){const def=IMPROVEMENTS[key];return key!=="harbor"&&mapTile&&def.terrain.indexOf(mapTile.terrain)>=0&&(!def.tech||hasTech(gs,def.tech));});
        if(id) startWorkerProject(unit.id,id,tx,ty,false);
      }
      return;
    }
    window.setTimeout(schedule,0);
  }

  function onTurnChange() {
    const gs=ensureState(state());
    if(!gs)return;
    const turn=Number(gs.turn)||1;
    if(lastTurn===turn)return;
    lastTurn=turn;
    reverseLegacyRandomEvent(gs);
    processExperienceEvents(gs);
    processWorkerProjects(gs);
    const value=debug(); if(value&&typeof value.render==="function")value.render();
    schedule();
  }

  function decorate() {
    const gs=ensureState(state()); if(!gs)return;
    processExperienceEvents(gs); patchCityUi(gs); patchWorkerUi(gs); patchMapPurchase(gs);
  }

  function schedule(){ if(queued)return; queued=true; requestAnimationFrame(function(){queued=false;decorate();}); }

  function installStyles(){
    if(document.getElementById("workerLearningStyles"))return;
    const style=document.createElement("style"); style.id="workerLearningStyles";
    style.textContent=".context-text{overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important}.learning-note{display:block;margin-top:5px;font-size:9px;line-height:1.25;opacity:.8}@media(max-width:520px){.context{max-height:min(220px,31dvh)!important}.context-text{max-height:78px!important;line-height:1.25!important}}";
    document.head.appendChild(style);
  }

  function install(){
    installStyles(); patchDebug(); suppressIncomeToast(); ensureState(state());
    window.addEventListener("click",captureBeforeTurn,true); window.addEventListener("click",handleClick,true);
    const turn=document.getElementById("turnValue"); if(turn)new MutationObserver(onTurnChange).observe(turn,{childList:true,characterData:true,subtree:true});
    ["cityModal","feedbackTreasuryModal","contextPanel"].forEach(function(id){const node=document.getElementById(id);if(node)new MutationObserver(schedule).observe(node,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});});
    lastTurn=Number(state()&&state().turn)||null; schedule();
  }

  window.EpohiWorkerLearning={
    version:1,ensureState:ensureState,buildingDiscount:buildingDiscount,unitDiscount:unitDiscount,effectiveProductionCost:effectiveProductionCost,
    workerTurns:workerTurns,startWorkerProject:startWorkerProject,processWorkerProjects:processWorkerProjects,processExperienceEvents:processExperienceEvents
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
})();
