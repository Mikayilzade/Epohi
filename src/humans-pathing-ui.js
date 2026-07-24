(function () {
  "use strict";

  if (!window.EpohiHumansPathing || !window.EpohiData) {
    throw new Error("EpohiHumansPathing and EpohiData are required before humans-pathing-ui.js");
  }

  const CORE = window.EpohiHumansPathing;
  const { UNIT_DEFS, INTEREST_TYPES } = window.EpohiData;
  let targetModeUnitId = null;
  let uiFrame = 0;
  let poiModal = null;
  let routeSignature = "";

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function state() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function actualSelectedUnit(gs) {
    const value = debug();
    const selectedId = value && typeof value.getSelectedUnitId === "function"
      ? value.getSelectedUnitId()
      : null;
    return (gs.units || []).find(function (unit) { return unit.id === selectedId; }) || null;
  }

  function routeUnit(gs) {
    if (targetModeUnitId != null) {
      return (gs.units || []).find(function (unit) {
        return String(unit.id) === String(targetModeUnitId);
      }) || null;
    }
    return actualSelectedUnit(gs);
  }

  function inspectedUnit(gs, title) {
    const tile = document.querySelector("#map .tile.inspect-tile");
    if (!tile) return null;
    const x = Number(tile.dataset.x);
    const y = Number(tile.dataset.y);
    return (gs.units || []).find(function (unit) {
      if (unit.x !== x || unit.y !== y || unit.hp <= 0) return false;
      const def = UNIT_DEFS[unit.type] || { name: unit.type || "Юнит" };
      return title.textContent.includes(unit.name || "") || title.textContent.includes(def.name);
    }) || null;
  }

  function notify(text) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    window.setTimeout(function () {
      toast.classList.remove("show");
    }, 1800);
  }

  function ensurePoiModal() {
    if (poiModal && document.body.contains(poiModal)) return poiModal;
    poiModal = document.getElementById("routePoiModal");
    if (poiModal) return poiModal;

    poiModal = document.createElement("div");
    poiModal.id = "routePoiModal";
    poiModal.className = "modal";
    poiModal.setAttribute("role", "dialog");
    poiModal.setAttribute("aria-modal", "true");
    poiModal.innerHTML = '<section class="sheet">' +
      '<header class="sheet-head"><h2>Находка</h2>' +
      '<button class="close-btn" data-route-poi-close aria-label="Закрыть">×</button></header>' +
      '<div class="sheet-scroll" id="routePoiContent"></div></section>';
    document.body.appendChild(poiModal);
    poiModal.querySelector("[data-route-poi-close]").addEventListener("click", function () {
      poiModal.classList.remove("show");
    });
    return poiModal;
  }

  function openPoiChoice(gs, unit, located) {
    const modal = ensurePoiModal();
    const content = modal.querySelector("#routePoiContent");
    const typeId = located && located.target && located.target.type ? located.target.type : "unknown";
    const type = INTEREST_TYPES[typeId] && INTEREST_TYPES[typeId].name
      ? INTEREST_TYPES[typeId].name
      : (typeId === "ruins" ? "Древние руины" : "Неизвестная находка");

    content.innerHTML = '<div class="wiki-callout"><strong>' + type + '</strong><br>' +
      'Отряд добрался до находки. Решение не принимается автоматически.</div>' +
      '<div class="menu-actions" style="margin-top:12px">' +
      '<button class="wide-btn" data-route-poi-choice="study">🔬 Исследовать — +10 науки</button>' +
      '<button class="wide-btn secondary" data-route-poi-choice="salvage">🪙 Разобрать — +8 производства и +6 золота</button>' +
      '</div>';

    content.querySelectorAll("[data-route-poi-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (CORE.resolvePoiChoice(unit.id, located.x, located.y, button.dataset.routePoiChoice)) {
          modal.classList.remove("show");
          scheduleUi();
        }
      });
    });
    modal.classList.add("show");
  }

  function makeButton(label, action, handler, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "context-btn" + (className ? " " + className : "");
    button.dataset.pathAction = action;
    button.innerHTML = label;
    button.addEventListener("click", handler);
    return button;
  }

  function startTargetMode(unitId) {
    targetModeUnitId = unitId;
    document.body.dataset.routeUnitId = String(unitId);
    document.body.classList.add("route-targeting");
    notify("Выбери конечную точку");
  }

  function stopTargetMode() {
    targetModeUnitId = null;
    delete document.body.dataset.routeUnitId;
    document.body.classList.remove("route-targeting");
  }

  function clearRouteOverlay() {
    document.querySelectorAll("#map .route-step, #map .route-endpoint, #map .route-attack-endpoint").forEach(function (tile) {
      tile.classList.remove("route-step", "route-endpoint", "route-attack-endpoint");
      tile.querySelectorAll(".route-badge").forEach(function (badge) { badge.remove(); });
    });
  }

  function drawRoute(gs, unit) {
    if (!unit || !unit.travelOrder) {
      if (routeSignature || document.querySelector("#map .route-step, #map .route-endpoint, #map .route-attack-endpoint")) {
        clearRouteOverlay();
        routeSignature = "";
      }
      return null;
    }

    const route = CORE.pathForOrder(gs, unit, unit.travelOrder);
    unit.travelOrder.path = route.path || [];
    if (route.target) {
      unit.travelOrder.x = route.target.x;
      unit.travelOrder.y = route.target.y;
    }

    const signature = [
      unit.id,
      unit.x,
      unit.y,
      unit.travelOrder.type,
      unit.travelOrder.status,
      route.target ? route.target.x + "," + route.target.y : "none",
      route.path ? route.path.map(function (point) { return point.x + "," + point.y; }).join(";") : "blocked",
      document.querySelectorAll("#map .tile").length
    ].join("|");

    if (signature === routeSignature && document.querySelector("#map .route-step, #map .route-endpoint, #map .route-attack-endpoint")) {
      return route;
    }

    routeSignature = signature;
    clearRouteOverlay();

    if (route.path) {
      route.path.forEach(function (point, index) {
        const tile = document.querySelector('#map .tile[data-x="' + point.x + '"][data-y="' + point.y + '"]');
        if (!tile) return;
        tile.classList.add("route-step");
        const badge = document.createElement("span");
        badge.className = "route-badge";
        badge.textContent = String(index + 1);
        tile.appendChild(badge);
      });
    }

    if (route.target) {
      const endpoint = document.querySelector('#map .tile[data-x="' + route.target.x + '"][data-y="' + route.target.y + '"]');
      if (endpoint) {
        endpoint.classList.add(unit.travelOrder.type === "attack" ? "route-attack-endpoint" : "route-endpoint");
      }
    }
    return route;
  }

  function pluralTurns(turns) {
    const lastTwo = turns % 100;
    const last = turns % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "ходов";
    if (last === 1) return "ход";
    if (last >= 2 && last <= 4) return "хода";
    return "ходов";
  }

  function routeDescription(unit, route) {
    if (unit.travelOrder.status === "awaiting-choice") return "Отряд ждёт решения у находки.";
    if (route.path === null) return "Путь временно перекрыт. Приказ сохранён и будет пересчитан.";
    const steps = route.path.length;
    const turns = CORE.estimateTurns(unit, steps);
    const arrival = turns === 0 ? "прибытие в этом ходу" : "ещё примерно " + turns + " " + pluralTurns(turns);
    return "Маршрут: " + steps + " шагов · " + arrival + ".";
  }

  function injectWorkerPicker(unit, actions) {
    if (unit.type !== "worker" || actions.querySelector(".worker-priority-picker")) return;
    const picker = document.createElement("div");
    picker.className = "worker-priority-picker";
    [
      ["balanced", "⚖️<br>Баланс"],
      ["food", "🌾<br>Еда"],
      ["production", "⚒️<br>Производство"],
      ["gold", "🪙<br>Золото"]
    ].forEach(function (entry) {
      picker.appendChild(makeButton(entry[1], "worker-" + entry[0], function () {
        if (!window.EpohiHumansAutonomy) return;
        unit.travelOrder = null;
        window.EpohiHumansAutonomy.assignOrder(unit.id, "develop", { priority: entry[0] });
        scheduleUi();
      }, "alt"));
    });
    actions.appendChild(picker);
  }

  function refreshUi() {
    uiFrame = 0;
    const gs = CORE.ensureState(state());
    const actions = document.getElementById("contextActions");
    const text = document.getElementById("contextText");
    const title = document.getElementById("contextTitle");
    if (!gs || !actions || !text || !title) return;

    const selected = routeUnit(gs);
    const route = drawRoute(gs, selected);
    const inspected = inspectedUnit(gs, title);
    const unit = inspected || selected;
    const summary = text.querySelector("[data-route-summary]");

    if (!unit) {
      if (summary) summary.remove();
      return;
    }

    const def = UNIT_DEFS[unit.type] || { name: unit.type || "Юнит" };
    const showsUnit = title.textContent.includes(unit.name || "") || title.textContent.includes(def.name);
    if (!showsUnit) {
      if (summary) summary.remove();
      return;
    }

    if (!actions.querySelector("[data-path-action]")) {
      if (unit.travelOrder) {
        if (unit.travelOrder.status === "awaiting-choice") {
          actions.appendChild(makeButton("✨<br>Решить судьбу находки", "poi-choice", function () {
            const located = CORE.locateTarget(gs, unit.travelOrder);
            if (located) openPoiChoice(gs, unit, located);
          }, "alt"));
        }
        actions.appendChild(makeButton("✖️<br>Отменить путь", "cancel", function () {
          CORE.cancelTravelOrder(unit.id);
          const value = debug();
          if (value && typeof value.renderContext === "function") value.renderContext();
          scheduleUi();
        }, "alt"));
      } else {
        actions.appendChild(makeButton("🥾<br>Идти", "start", function () {
          startTargetMode(unit.id);
        }, "alt"));
      }
    }

    injectWorkerPicker(unit, actions);

    if (selected && selected.travelOrder && route) {
      const description = routeDescription(selected, route);
      let element = summary;
      if (!element) {
        element = document.createElement("div");
        element.className = "route-summary";
        element.dataset.routeSummary = "true";
        text.appendChild(element);
      }
      if (element.textContent !== description) element.textContent = description;
    } else if (summary) {
      summary.remove();
    }
  }

  function scheduleUi() {
    if (uiFrame) return;
    uiFrame = window.requestAnimationFrame(refreshUi);
  }

  function handleTargetClick(event) {
    const routeUnitId = document.body.dataset.routeUnitId || targetModeUnitId;
    if (routeUnitId == null) return;
    const tile = event.target.closest && event.target.closest("#map .tile");
    if (!tile) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const gs = CORE.ensureState(state());
    const destination = gs && CORE.targetFromTile(gs, Number(tile.dataset.x), Number(tile.dataset.y));
    const unitId = routeUnitId;
    stopTargetMode();
    if (!destination || !CORE.assignTravelOrder(unitId, destination)) {
      scheduleUi();
      return;
    }
    scheduleUi();
  }

  function installEndTurnHook() {
    const endTurn = document.getElementById("endTurnBtn");
    if (!endTurn) return;

    endTurn.addEventListener("click", function () {
      const gs = CORE.ensureState(state());
      if (!gs || endTurn.disabled) return;
      const beforeTurn = gs.turn || 1;
      CORE.processOrders(gs, { render: false });

      let attempts = 0;
      function afterTurn() {
        attempts += 1;
        const next = CORE.ensureState(state());
        if (!next) return;
        if ((next.turn || 1) > beforeTurn) {
          CORE.processOrders(next);
          scheduleUi();
          return;
        }
        if (attempts < 20) window.setTimeout(afterTurn, 60);
      }
      window.setTimeout(afterTurn, 60);
    }, true);
  }

  function install() {
    ensurePoiModal();
    CORE.setPoiArrivalHandler(openPoiChoice);

    const context = document.getElementById("contextPanel");
    const map = document.getElementById("map");
    const turn = document.getElementById("turnValue");

    if (context) new MutationObserver(scheduleUi).observe(context, { childList: true, subtree: true });
    if (map) new MutationObserver(scheduleUi).observe(map, { childList: true });
    if (turn) new MutationObserver(scheduleUi).observe(turn, { childList: true, characterData: true, subtree: true });

    document.addEventListener("click", handleTargetClick, true);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && targetModeUnitId != null) {
        stopTargetMode();
        notify("Выбор маршрута отменён");
      }
    });
    installEndTurnHook();
    scheduleUi();
  }

  window.EpohiHumansPathingUI = {
    version: 2,
    refresh: refreshUi,
    startTargetMode: startTargetMode,
    stopTargetMode: stopTargetMode
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();