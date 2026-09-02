(function () {
  "use strict";

  let controls = null;
  let contextGuard = false;
  let stackSelectionPending = null;

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function gameState() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function removeRecreatedButtons(content) {
    content.querySelectorAll("#outcomeGoalsBtn, #outcomeMapBtn, [data-outcome-goals-action], [data-outcome-map-action]").forEach(function (button) {
      button.removeAttribute("id");
      button.hidden = true;
      button.setAttribute("aria-hidden", "true");
      button.tabIndex = -1;
    });
  }

  function ensureStableControls() {
    const modal = document.getElementById("victoryModal");
    const content = document.getElementById("victoryContent");
    const sheet = modal && modal.querySelector(".sheet");
    if (!modal || !content || !sheet) return;

    if (!controls || !document.body.contains(controls)) {
      controls = document.createElement("div");
      controls.className = "menu-actions feedback-outcome-controls";
      controls.innerHTML = '<button id="outcomeGoalsBtn" type="button" class="wide-btn secondary">Посмотреть цели</button>' +
        '<button id="outcomeMapBtn" type="button" class="wide-btn">Вернуться к карте</button>';
      sheet.appendChild(controls);
    }

    removeRecreatedButtons(content);
  }

  function preserveFreePlay() {
    const value = debug();
    const state = value && value.state;
    if (!state || !state.continueAfterOutcome) return;
    state.victory = false;
    state.defeat = false;
    if (state.outcome) state.outcome.status = "active";
    const modal = document.getElementById("victoryModal");
    if (modal && modal.classList.contains("show")) modal.classList.remove("show");
  }

  function stabilizeMovementExplanation() {
    if (contextGuard) return;
    const title = document.getElementById("contextTitle");
    const text = document.getElementById("contextText");
    const tile = document.querySelector("#map .tile.inspect-tile");
    if (!title || !text || !tile || title.textContent.indexOf("Клетка") < 0) return;
    if (text.querySelector("[data-feedback-movement-sentinel]")) return;

    contextGuard = true;
    const clean = text.textContent.replace(/\s*· Стоимость движения:[\s\S]*$/, "");
    if (clean !== text.textContent) text.textContent = clean;
    const sentinel = document.createElement("span");
    sentinel.hidden = true;
    sentinel.dataset.feedbackMovementSentinel = "1";
    sentinel.textContent = "Стоимость пути";
    text.appendChild(sentinel);
    contextGuard = false;
  }

  function expireSkippedJourneyEvents() {
    const journeyApi = window.EpohiHumansJourney;
    const data = window.EpohiHumansJourneyData;
    const state = gameState();
    if (!journeyApi || !data || !state || !Array.isArray(data.events)) return;
    const journey = journeyApi.ensureJourneyState(state);
    const turn = Number(state.turn) || 1;
    data.events.forEach(function (event) {
      if (turn <= event.minTurn) return;
      if (journey.queuedEvents.indexOf(event.id) >= 0 || journey.resolvedEvents.indexOf(event.id) >= 0) return;
      journey.resolvedEvents.push(event.id);
    });
  }

  function installJourneyGuard() {
    const journey = window.EpohiHumansJourney;
    if (!journey || journey.ci179StabilityWrapped) return;
    journey.ci179StabilityWrapped = true;
    const originalSync = journey.sync;
    journey.sync = function (options) {
      expireSkippedJourneyEvents();
      return originalSync(options);
    };
  }

  function installImmediateAdjacentOrders() {
    const pathing = window.EpohiHumansPathing;
    if (!pathing || pathing.ci179AdjacentWrapped) return;
    pathing.ci179AdjacentWrapped = true;
    const originalAssign = pathing.assignTravelOrder;
    pathing.assignTravelOrder = function (unitId, destination) {
      const beforeState = gameState();
      const previousEvents = new Set(beforeState && Array.isArray(beforeState.eventLog) ? beforeState.eventLog : []);
      const result = originalAssign(unitId, destination);
      const state = gameState();
      const unit = state && (state.units || []).find(function (item) { return String(item.id) === String(unitId); });
      const order = unit && unit.travelOrder;
      const located = order && pathing.locateTarget(state, order);
      const adjacent = located && window.EpohiUtils.isAdjacent(unit.x, unit.y, located.x, located.y);
      const expensiveDirectMove = adjacent && order.type === "move" && pathing.movementCost(state, unit, located) > unit.moves;
      if (result && unit && unit.moves > 0 && !unit.acted && adjacent && (order.type === "attack" || expensiveDirectMove)) {
        pathing.processUnit(state, unit, { render: false });
        const value = debug();
        if (value && typeof value.render === "function") value.render();
      }
      promoteNewMajorEvent(state, previousEvents);
      return result;
    };
  }

  function promoteNewMajorEvent(state, previousEvents) {
    if (!state || !Array.isArray(state.eventLog)) return;
    const majorTypes = ["capital-fallen", "state-destroyed", "victory", "defeat", "major-diplomatic-event"];
    const index = state.eventLog.findIndex(function (event) { return !previousEvents.has(event) && majorTypes.indexOf(event.eventType) >= 0; });
    if (index <= 0) return;
    const major = state.eventLog.splice(index, 1)[0];
    state.eventLog.unshift(major);
  }

  function installVisibleAttackResolver() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest && event.target.closest('[data-context-action="attack"]');
      if (!button || button.disabled) return;
      const value = debug();
      const state = value && value.state;
      const pathing = window.EpohiHumansPathing;
      const tile = document.querySelector("#map .tile.inspect-tile");
      if (!state || !pathing || !tile || typeof value.getSelectedUnitId !== "function") return;
      const target = pathing.targetFromTile(state, Number(tile.dataset.x), Number(tile.dataset.y));
      if (!target || (target.targetKind !== "rival-city" && target.targetKind !== "rival" && target.targetKind !== "barbarian" && target.targetKind !== "camp")) return;
      const readyUnits = (state.units || []).filter(function (unit) { return unit.hp > 0 && !unit.acted && unit.moves > 0; });
      const selectedId = value.getSelectedUnitId();
      const selected = readyUnits.find(function (unit) { return String(unit.id) === String(selectedId); });
      const adjacent = readyUnits.filter(function (unit) { return window.EpohiUtils.isAdjacent(unit.x, unit.y, target.x, target.y); });
      const attacker = selected && window.EpohiUtils.isAdjacent(selected.x, selected.y, target.x, target.y) ? selected : adjacent[0];
      if (!attacker) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pathing.assignTravelOrder(attacker.id, target);
    }, true);
  }

  function installJourneyEntryGuard() {
    document.addEventListener("click", function (event) {
      const opener = event.target.closest && event.target.closest("[data-open-human-journey]");
      if (!opener) return;
      const urgentModal = document.getElementById("stabilityDecisionModal");
      if (urgentModal) urgentModal.classList.remove("show");
      setTimeout(function () {
        const journeyModal = document.getElementById("humansJourneyModal");
        if (!journeyModal || journeyModal.classList.contains("show")) return;
        const journeyUi = window.EpohiHumansJourneyUI;
        if (journeyUi && typeof journeyUi.open === "function") journeyUi.open();
        closeUrgentDecisionForJourney();
      }, 0);
    }, true);
  }

  function installCameraResizeGuard() {
    const viewport = document.getElementById("mapViewport");
    if (!viewport || !window.ResizeObserver || viewport.dataset.ci179ResizeGuard === "1") return;
    viewport.dataset.ci179ResizeGuard = "1";
    let frame = 0;
    new ResizeObserver(function () {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        frame = 0;
        const app = document.getElementById("gameApp");
        const value = debug();
        if (!app || app.classList.contains("is-hidden") || !value || !value.state || typeof value.applyCamera !== "function") return;
        value.applyCamera(true);
      });
    }).observe(viewport);
  }

  function closeUrgentDecisionForJourney() {
    const journeyModal = document.getElementById("humansJourneyModal");
    const urgentModal = document.getElementById("stabilityDecisionModal");
    if (journeyModal && urgentModal && journeyModal.classList.contains("show")) urgentModal.classList.remove("show");
  }

  function rememberStackSelection(event) {
    const tile = event.target.closest && event.target.closest("#map .tile");
    const value = debug();
    const state = value && value.state;
    if (!tile || !state || typeof value.getSelectedUnitId !== "function") { stackSelectionPending = null; return; }
    const x = Number(tile.dataset.x);
    const y = Number(tile.dataset.y);
    const previousId = value.getSelectedUnitId();
    const previous = (state.units || []).find(function (unit) { return String(unit.id) === String(previousId); });
    const units = (state.units || []).filter(function (unit) { return unit.hp > 0 && unit.x === x && unit.y === y; });
    stackSelectionPending = units.length > 1 && (!previous || previous.x !== x || previous.y !== y) ? { x: x, y: y, previousId: previousId } : null;
  }

  function addStackSelectionAcknowledgement() {
    if (!stackSelectionPending) return;
    const pending = stackSelectionPending;
    stackSelectionPending = null;
    const value = debug();
    const state = value && value.state;
    const actions = document.getElementById("contextActions");
    if (!state || !actions || actions.querySelector('[data-context-action="select-unit"]')) return;
    const selectedId = value.getSelectedUnitId();
    const selected = (state.units || []).find(function (unit) { return String(unit.id) === String(selectedId); });
    const units = (state.units || []).filter(function (unit) { return unit.hp > 0 && unit.x === pending.x && unit.y === pending.y; });
    if (!selected || selected.x !== pending.x || selected.y !== pending.y || units.length <= 1 || String(selectedId) === String(pending.previousId)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "context-btn alt";
    button.dataset.contextAction = "select-unit";
    button.innerHTML = "✓<br>Выбран";
    button.addEventListener("click", function () { button.remove(); });
    actions.insertBefore(button, actions.firstChild);
  }

  function install() {
    const style = document.createElement("style");
    style.id = "feedbackOutcomeStabilizationStyles";
    style.textContent = [
      ".feedback-outcome-controls{padding:0 14px 14px;margin-top:0}",
      "#stabilityDecisionModal{pointer-events:none}",
      "#stabilityDecisionModal .sheet{pointer-events:none;position:absolute;top:max(12px,env(safe-area-inset-top));right:12px;left:auto;width:min(520px,calc(100vw - 24px));max-height:min(72vh,620px)}",
      "#stabilityDecisionModal button{pointer-events:auto}"
    ].join("");
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    installJourneyGuard();
    installImmediateAdjacentOrders();
    installVisibleAttackResolver();
    installJourneyEntryGuard();
    installCameraResizeGuard();
    ensureStableControls();
    preserveFreePlay();
    stabilizeMovementExplanation();
    document.addEventListener("pointerdown", rememberStackSelection, true);

    // RuntimeInvalidation already invokes all stabilization sync functions after explicit
    // UI/action signals. Local journey/victory/turn MutationObservers duplicated that work
    // and kept callbacks alive during otherwise idle city/worker contexts.
  }

  window.EpohiPlayerFeedbackStabilization = {
    version: 7,
    ensureStableControls: ensureStableControls,
    preserveFreePlay: preserveFreePlay,
    stabilizeMovementExplanation: stabilizeMovementExplanation,
    expireSkippedJourneyEvents: expireSkippedJourneyEvents,
    addStackSelectionAcknowledgement: addStackSelectionAcknowledgement
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
