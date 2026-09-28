(function () {
  "use strict";

  const BUILDINGS = window.EpohiData && window.EpohiData.BUILDINGS || {};
  const UNIT_DEFS = window.EpohiData && window.EpohiData.UNIT_DEFS || {};
  const IMPROVEMENTS = window.EpohiData && window.EpohiData.IMPROVEMENTS || {};

  let lastTurn = null;
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

  function addEvent(gs, type, text, position) {
    if (!gs) return;
    window.EpohiEventJournal.append(gs, function (counter) {
      return {
        eventId: "worker-learning-" + counter,
        turn: Number(gs.turn) || 1,
        phase: "worker-learning", actorType: "player", actorId: "player",
        eventType: type, text: text,
        coordinates: position || null, position: position || null
      };
    }, { numericCounter:true, eventLimit:300, historyLimit:300, dedupeHistory:true });
  }

  function toast(text, duration) {
    const node = document.getElementById("toast");
    if (!node) return;
    node.textContent = text;
    node.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(function () { node.classList.remove("show"); }, duration || 2200);
  }

  function ensureState(gs) {
    if (!gs) return null;
    window.EpohiProductionExperience.ensurePlayerState(gs);
    return gs;
  }

  function buildingDiscount(holder, id) {
    return window.EpohiProductionExperience.buildingDiscount(holder, id);
  }

  function unitDiscount(holder, id) {
    return window.EpohiProductionExperience.unitDiscount(holder, id);
  }

  function effectiveProductionCost(holder, type, id) {
    return window.EpohiProductionExperience.effectiveProductionCost(holder, type, id);
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

  function queueProject(gs, city, type, id) {
    if (!gs || !city) return false;
    const result = window.EpohiPlayerProduction.startQueue(gs, city, type, id, {
      logEvent:function (state, eventType, text, coordinates) {
        addEvent(state, eventType, text, coordinates);
      }
    });
    if (result === "population") {
      const def = type === "building" ? BUILDINGS[id] : UNIT_DEFS[id];
      const need = type === "unit" ? Number(def.population || 1)
        : window.EpohiData.PLAYER_CITY_RULES.palaceMinimumPopulation;
      toast("Нужно население города " + need + "+.");
      return false;
    }
    if (result === "resources") {
      toast("Не хватает общих ресурсов.");
      return false;
    }
    if (result !== "started") return false;
    const value = debug();
    if (value && typeof value.render === "function") value.render();
    window.setTimeout(function () {
      const cityButton = document.getElementById("cityBtn");
      if (cityButton) cityButton.click();
    }, 0);
    return true;
  }

  function workerTurns(id, repair) {
    return window.EpohiWorkerProjects.workerTurns(id, repair);
  }

  function startWorkerProject(unitId, id, x, y, repair) {
    const gs = ensureState(state());
    const result = gs && window.EpohiWorkerProjects.start(gs, unitId, id, x, y, repair, addEvent);
    if (!result) return false;
    if (result.remaining > 0) {
      toast("Работа начата: осталось " + result.remaining +
        " действий рабочего по одному в ход партии.");
    }
    const value = debug();
    if (value && typeof value.render === "function") value.render();
    patchWorkerUi(gs);
    return true;
  }

  function processWorkerProjects(gs) {
    return window.EpohiWorkerProjects.processTurn(gs, addEvent);
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
    if (text) {
      let status = text.querySelector("[data-worker-time-status]");
      if (!status) {
        status = document.createElement("span");
        status.dataset.workerTimeStatus = "1";
        status.className = "worker-time-status";
        text.appendChild(status);
      }
      if (unit.workerProject) {
        const project = unit.workerProject;
        const total = Math.max(1, Number(project.totalTurns) || 1);
        const remaining = Math.max(0, Number(project.remainingTurns) || 0);
        const done = Math.max(0, total - remaining);
        const def = IMPROVEMENTS[project.improvementId];
        const markup = "<strong>Проект: " + (project.type === "repair" ? "ремонт" : (def ? def.name : "улучшение")) +
          "</strong><span>Выполнено: " + done + "/" + total + " действий рабочего · осталось: " + remaining +
          "</span><span>Следующий шаг: в начале следующего хода партии. Очки движения во время работы: 0.</span>";
        if (status.innerHTML !== markup) status.innerHTML = markup;
      } else {
        const message = unit.acted
          ? "Действие рабочего в этом ходу партии уже потрачено. Длительность проекта указана на каждой команде; производство города не расходуется."
          : "Действие рабочего доступно. Длительность проекта указана на каждой команде; производство города не расходуется.";
        if (status.textContent !== message) status.textContent = message;
      }
    }
    const actions = document.getElementById("contextActions");
    if (actions && unit.workerProject && !actions.querySelector('[data-context-action="build-improvement"],[data-context-action="build-harbor"],[data-context-action="repair"]')) {
      const project = unit.workerProject;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "context-btn alt";
      button.dataset.contextAction = project.type === "repair" ? "repair" :
        (project.improvementId === "harbor" ? "build-harbor" : "build-improvement");
      button.disabled = true;
      actions.appendChild(button);
    }
    document.querySelectorAll('[data-context-action="build-improvement"],[data-context-action="build-harbor"],[data-context-action="repair"]').forEach(function (button) {
      button.disabled = !!unit.workerProject || !!unit.acted;
      if (button.dataset.contextAction === "repair") button.innerHTML = "Ремонт<br>1 действие рабочего";
      else {
        const tile = document.querySelector("#map .tile.inspect-tile");
        const tx = tile ? Number(tile.dataset.x) : Number(unit.x);
        const ty = tile ? Number(tile.dataset.y) : Number(unit.y);
        const mapTile = gs.map[ty] && gs.map[ty][tx];
        const id = unit.workerProject && unit.workerProject.improvementId ? unit.workerProject.improvementId :
          (button.dataset.contextAction === "build-harbor" ? "harbor" : Object.keys(IMPROVEMENTS).find(function (key) {
          const def=IMPROVEMENTS[key]; return key!=="harbor" && mapTile && def.terrain.indexOf(mapTile.terrain)>=0 && (!def.tech || hasTech(gs,def.tech));
          }));
        if (id) button.innerHTML = IMPROVEMENTS[id].icon + "<br>" + workerTurns(id,false) + " действ. рабочего";
      }
      if (unit.acted && !unit.workerProject) button.title = "Действие рабочего в этом ходу партии уже потрачено";
      else if (unit.workerProject) button.title = "Сначала завершите текущий проект";
      else button.removeAttribute("title");
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

  function processTurn(gs) {
    gs=ensureState(gs);
    if(!gs)return false;
    const turn=Number(gs.turn)||1;
    if(lastTurn===turn)return false;
    lastTurn=turn;
    return processWorkerProjects(gs);
  }

  function decorate() {
    const gs=state(); if(!gs)return;
    patchCityUi(gs); patchWorkerUi(gs); patchMapPurchase(gs);
  }

  function schedule(){ if(queued)return; queued=true; requestAnimationFrame(function(){queued=false;decorate();}); }

  function installStyles(){
    if(document.getElementById("workerLearningStyles"))return;
    const style=document.createElement("style"); style.id="workerLearningStyles";
    style.textContent=".context-text{overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important}.worker-time-status{display:grid;gap:2px;margin-top:6px;padding:6px 8px;border-radius:8px;background:rgba(91,119,78,.12)}.worker-time-status span{display:block}.learning-note{display:block;margin-top:5px;font-size:9px;line-height:1.25;opacity:.8}@media(max-width:520px){.context{max-height:min(220px,31dvh)!important}.context-text{max-height:92px!important;line-height:1.25!important}.context-actions{flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain!important;touch-action:pan-x!important;-webkit-overflow-scrolling:touch!important}.context-actions .context-btn{flex:0 0 auto!important}}";
    document.head.appendChild(style);
  }

  function install(){
    installStyles(); suppressIncomeToast();
    window.addEventListener("click",handleClick,true);
    document.addEventListener("epohi:own-unit-context-ready", function () {
      const gs = state();
      if (gs) patchWorkerUi(gs);
    });
    ["cityModal","feedbackTreasuryModal","contextPanel"].forEach(function(id){const node=document.getElementById(id);if(node)new MutationObserver(schedule).observe(node,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});});
    lastTurn=Number(state()&&state().turn)||null; schedule();
  }

  window.EpohiWorkerLearning={
    version:1,ensureState:ensureState,buildingDiscount:buildingDiscount,unitDiscount:unitDiscount,effectiveProductionCost:effectiveProductionCost,
    workerTurns:workerTurns,startWorkerProject:startWorkerProject,processWorkerProjects:processWorkerProjects,processTurn:processTurn,patchWorkerUi:patchWorkerUi
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
})();
