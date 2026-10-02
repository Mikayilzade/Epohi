(function () {
  "use strict";

  const DATA = window.EpohiData || {};
  const BUILDINGS = DATA.BUILDINGS || {};
  const UNIT_DEFS = DATA.UNIT_DEFS || {};
  const TECHS = DATA.TECHS || {};
  const BASE_UNIT_COST = {};
  Object.keys(UNIT_DEFS).forEach(function (id) {
    BASE_UNIT_COST[id] = Number(UNIT_DEFS[id] && UNIT_DEFS[id].cost && UNIT_DEFS[id].cost.production) || 0;
  });

  let queued = false;

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function state() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];
    });
  }

  function playerCities(gs) {
    return gs && Array.isArray(gs.cities) && gs.cities.length ? gs.cities : (gs && gs.city ? [gs.city] : []);
  }

  function civById(gs, id) {
    return (gs && gs.rivals || []).find(function (civ) {
      return String(civ.civilizationId) === String(id);
    }) || null;
  }

  function ensureExperience(holder) {
    if (!holder) return null;
    if (!holder.experience) holder.experience = {};
    if (!holder.experience.buildings) holder.experience.buildings = {};
    if (!holder.experience.foreignBuildings) holder.experience.foreignBuildings = {};
    if (!holder.experience.units) holder.experience.units = {};
    return holder.experience;
  }

  function ensureState(gs) {
    if (!gs) return null;
    ensureExperience(gs);
    (gs.rivals || []).forEach(ensureExperience);
    return gs;
  }

  function unitDiscount(holder, id) {
    if (window.EpohiWorkerLearning && typeof window.EpohiWorkerLearning.unitDiscount === "function") {
      return window.EpohiWorkerLearning.unitDiscount(holder, id);
    }
    const produced = Math.max(0, Number(ensureExperience(holder).units[id]) || 0);
    return Math.min(0.30, Math.floor(produced / 10) * 0.10);
  }

  function syncForeignBuildingKnowledge(gs) {
    ensureState(gs);
    function learn(holder, city) {
      const source = city && city.formerCivilizationId;
      if (!source) return;
      const exp = ensureExperience(holder);
      (city.buildings || []).forEach(function (buildingId) {
        if (!BUILDINGS[buildingId] || buildingId === "palace") return;
        if (!Array.isArray(exp.foreignBuildings[buildingId])) exp.foreignBuildings[buildingId] = [];
        if (exp.foreignBuildings[buildingId].indexOf(source) < 0) exp.foreignBuildings[buildingId].push(source);
      });
    }
    playerCities(gs).forEach(function (city) { learn(gs, city); });
    (gs.rivals || []).forEach(function (civ) {
      (civ.cities || []).forEach(function (city) { learn(civ, city); });
    });
  }

  function unitProductionCost(civ, type) {
    const base = BASE_UNIT_COST[type];
    if (!base || !civ) return base || 0;
    ensureExperience(civ);
    return Math.max(1, Math.ceil(base * (1 - unitDiscount(civ, type))));
  }

  function knownTech(holder, id) {
    return [holder && holder.researched, holder && holder.technologies].some(function (list) {
      return Array.isArray(list) && list.indexOf(id) >= 0;
    });
  }

  function removeInvalidTradeProposalEvent(gs, proposal) {
    const civ = civById(gs, proposal.civId);
    const phrase = String(proposal.text || "");
    gs.eventLog = (gs.eventLog || []).filter(function (item) {
      return !(item && item.eventType === "diplomatic-proposal" && String(item.actorId) === String(proposal.civId) && String(item.text || "").indexOf(phrase) >= 0 && Number(item.turn || 0) === Number(proposal.createdTurn || gs.turn || 0));
    });
    if (civ && phrase) {
      gs.history = (gs.history || []).filter(function (line) {
        return !(String(line).indexOf(civ.name) >= 0 && String(line).indexOf(phrase) >= 0);
      });
    }
  }

  function invalidateImpossibleTrades(gs) {
    let changed = false;
    (gs.diplomaticProposals || []).forEach(function (proposal) {
      if (!proposal || proposal.status !== "pending" || proposal.type !== "trade") return;
      const civ = civById(gs, proposal.civId);
      if (civ && knownTech(gs, "trade") && knownTech(civ, "trade") && civ.relation !== "war") return;
      proposal.status = "cancelled";
      proposal.resolvedTurn = Number(gs.turn) || 1;
      proposal.reason = "технология торговли недоступна одной из сторон";
      removeInvalidTradeProposalEvent(gs, proposal);
      changed = true;
    });
    return changed;
  }

  function patchPopulationRequirement(gs) {
    const modal = document.getElementById("cityModal");
    const content = document.getElementById("cityContent");
    if (!modal || !modal.classList.contains("show") || !content) return;
    Object.keys(UNIT_DEFS).forEach(function (id) {
      const def = UNIT_DEFS[id];
      const card = Array.from(content.querySelectorAll(".game-card")).find(function (item) {
        const h = item.querySelector("h3");
        return h && h.textContent.indexOf(def.name) >= 0;
      });
      if (!card) return;
      const button = card.querySelector("button.card-button");
      if (button && button.disabled && button.textContent.trim() === "Население") {
        button.textContent = "Нужно население " + Number(def.population || 1) + "+";
      }
    });
  }

  function decisionEffect(item, option) {
    if (item && item.journeyEventId && window.EpohiHumansJourney && typeof window.EpohiHumansJourney.eventById === "function") {
      const event = window.EpohiHumansJourney.eventById(item.journeyEventId);
      const choice = event && (event.choices || []).find(function (candidate) { return candidate.id === option.id; });
      if (choice && choice.text) return choice.text;
    }
    const parts = [];
    if (option.production) parts.push((option.production > 0 ? "+" : "") + option.production + " производства");
    if (option.gold) parts.push((option.gold > 0 ? "+" : "") + option.gold + " золота");
    if (option.science) parts.push((option.science > 0 ? "+" : "") + option.science + " науки");
    return parts.join(" · ");
  }

  function patchUrgentDecision(gs) {
    const modal = document.getElementById("stabilityDecisionModal");
    if (!modal || !modal.classList.contains("show")) return;
    const item = (gs.urgentDecisions || []).find(function (entry) { return entry.status === "pending"; });
    if (!item) return;
    modal.querySelectorAll("[data-decision-id][data-option-id]").forEach(function (button) {
      const option = (item.options || []).find(function (candidate) { return String(candidate.id) === String(button.dataset.optionId); });
      if (!option) return;
      const detail = decisionEffect(item, option);
      let small = button.querySelector("small[data-decision-effect]");
      if (!detail) { if (small) small.remove(); return; }
      if (!small) {
        small = document.createElement("small");
        small.dataset.decisionEffect = "1";
        button.appendChild(small);
      }
      small.textContent = detail;
    });
  }

  function administrationCost(gs) {
    const stability = window.EpohiCombatWorldStability;
    return stability && typeof stability.administrationCost === "function" ? stability.administrationCost(gs) : 60 + Number(gs.cityCapacityPurchases || 0) * 40;
  }

  function patchCaptureCapacity(gs) {
    const modal = document.getElementById("captureChoiceModal");
    if (!modal || !modal.classList.contains("show")) return;
    const annex = modal.querySelector('[data-capture-choice="annex"]');
    if (!annex) return;
    const capacity = Number(gs.cityCapacity || 4);
    const current = playerCities(gs).length;
    const full = current >= capacity;
    annex.disabled = full;
    const note = annex.querySelector("small");
    if (note && full) note.textContent = "Лимит городов исчерпан: " + current + "/" + capacity + ". Сначала расширьте администрацию.";
    let expand = modal.querySelector("[data-capture-expand]");
    if (!full) { if (expand) expand.remove(); return; }
    const cost = administrationCost(gs);
    if (!expand) {
      expand = document.createElement("button");
      expand.type = "button";
      expand.className = "wide-btn secondary";
      expand.dataset.captureExpand = "1";
      annex.insertAdjacentElement("afterend", expand);
    }
    expand.disabled = Number(gs.resources && gs.resources.gold || 0) < cost;
    expand.textContent = "Расширить администрацию до " + (capacity + 1) + " — " + cost + " 🪙";
  }

  function restorePendingCapture(gs) {
    const modal = document.getElementById("captureChoiceModal");
    if (!modal || modal.classList.contains("show") || !(gs.pendingCityCaptures || []).length) return;
    const pending = gs.pendingCityCaptures[0];
    const civ = civById(gs, pending.civId);
    const city = civ && (civ.cities || []).find(function (item) { return String(item.id) === String(pending.cityId); });
    const content = document.getElementById("captureChoiceContent");
    if (!civ || !city || !content) return;
    const former = city.formerCivilizationId && civById(gs, city.formerCivilizationId);
    content.innerHTML = '<article class="capture-card"><h3>' + esc(city.name || "Город") + '</h3><p>' + esc(civ.name || "") + ' · население ' + Number(city.population || 1) + '</p>' +
      '<button type="button" class="wide-btn" data-capture-choice="annex" data-civ-id="' + esc(civ.civilizationId) + '" data-city-id="' + esc(city.id) + '">Присоединить<small>Здания и специализация сохранятся.</small></button>' +
      '<button type="button" class="wide-btn secondary" data-capture-choice="plunder" data-civ-id="' + esc(civ.civilizationId) + '" data-city-id="' + esc(city.id) + '">Разграбить и отойти<small>Добыча, строительные знания и 20% неизвестной технологии.</small></button>' +
      (former && former !== civ ? '<button type="button" class="wide-btn secondary" data-capture-choice="liberate" data-civ-id="' + esc(civ.civilizationId) + '" data-city-id="' + esc(city.id) + '">Освободить<small>Вернуть прежнему владельцу: ' + esc(former.name || "") + '</small></button>' : '') + '</article>';
    modal.classList.add("show");
  }

  function priorityModalOpen() {
    return ["coherenceProposalModal", "captureChoiceModal", "stabilityDecisionModal", "victoryModal"].some(function (id) {
      const node = document.getElementById(id);
      return node && node.classList.contains("show");
    });
  }

  function suppressOverlappingToasts() {
    if (!priorityModalOpen()) return;
    const base = document.getElementById("toast");
    const flow = document.getElementById("flowEventToast");
    if (base) base.classList.remove("show");
    if (flow) flow.classList.remove("show");
  }

  function processTurn(gs) {
    gs = ensureState(gs);
    if (!gs) return;
    syncForeignBuildingKnowledge(gs);
    invalidateImpossibleTrades(gs);
  }

  function handleClick(event) {
    const target = event.target && event.target.closest ? event.target : null;
    const expand = target && target.closest("[data-capture-expand]");
    if (expand && !expand.disabled) {
      event.preventDefault();
      event.stopPropagation();
      const gs = ensureState(state());
      const stability = window.EpohiWorldStabilityActions;
      if (gs && stability && typeof stability.expandAdministration === "function") {
        stability.expandAdministration(gs);
        const value = debug();
        if (value && typeof value.render === "function") value.render();
        if (window.EpohiCombatWorldStability) window.EpohiCombatWorldStability.render();
        window.setTimeout(schedule, 0);
      }
      return;
    }

    // CoherenceFinalize used to enqueue its full decorator after every document click.
    // RuntimeInvalidation now owns normal action refreshes, while overlay/turn observers
    // retain their semantic triggers. City opening still needs one local post-render pass
    // for the population-requirement copy; closing the city must not wake decorators.
    if (target && target.closest("#cityBtn")) window.setTimeout(schedule, 0);
  }

  function decorate() {
    const gs = state();
    if (!gs) return;
    restorePendingCapture(gs);
    patchCaptureCapacity(gs);
    patchPopulationRequirement(gs);
    patchUrgentDecision(gs);
    suppressOverlappingToasts();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () {
      queued = false;
      decorate();
    });
  }

  function installStyles() {
    if (document.getElementById("coherenceFinalizeStyles")) return;
    const style = document.createElement("style");
    style.id = "coherenceFinalizeStyles";
    style.textContent = [
      "#stabilityDecisionContent [data-decision-id] small[data-decision-effect]{display:block;margin-top:5px;font-size:10px;line-height:1.3;opacity:.78;white-space:normal}",
      "#captureChoiceModal [data-capture-expand]{margin-top:8px}",
      "#captureChoiceModal [data-capture-choice][disabled]{opacity:.48;filter:saturate(.6)}"
    ].join("");
    document.head.appendChild(style);
  }

  function install() {
    installStyles();
    ensureState(state());
    document.addEventListener("click", handleClick);
    // Coherence proposals have their own priority observer in EventOverlayPolicy. The
    // finalizer does not decorate proposal content, so observing proposal class changes
    // here duplicated semantic ownership and could keep observer delivery active at idle.
    ["captureChoiceModal", "stabilityDecisionModal", "strategyDiplomacyModal"].forEach(function (id) {
      const node = document.getElementById(id);
      if (node) new MutationObserver(schedule).observe(node, {attributes:true,attributeFilter:["class"]});
    });
    const toast = document.getElementById("toast");
    if (toast) new MutationObserver(suppressOverlappingToasts).observe(toast, {attributes:true,attributeFilter:["class"]});
    schedule();
  }

  window.EpohiCoherenceFinalize = {
    version: 3,
    ensureState: ensureState,
    unitProductionCost: unitProductionCost,
    syncForeignBuildingKnowledge: syncForeignBuildingKnowledge,
    invalidateImpossibleTrades: invalidateImpossibleTrades,
    patchPopulationRequirement: patchPopulationRequirement,
    patchUrgentDecision: patchUrgentDecision,
    patchCaptureCapacity: patchCaptureCapacity,
    processTurn: processTurn,
    refreshUi: schedule,
    suppressOverlappingToasts: suppressOverlappingToasts
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, {once:true});
  else install();
})();
