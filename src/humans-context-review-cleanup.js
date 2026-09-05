(function () {
  "use strict";

  const map = document.getElementById("map");
  const contextPanel = document.getElementById("contextPanel");
  const contextTitle = document.getElementById("contextTitle");
  const contextTabs = document.getElementById("contextTabs");
  const contextActions = document.getElementById("contextActions");
  const contextText = document.getElementById("contextText");
  const cityButton = document.getElementById("cityBtn");
  const scienceButton = document.getElementById("scienceBtn");
  const scienceWrap = scienceButton && scienceButton.closest(".badge-wrap");
  const toolbar = document.querySelector(".toolbar");
  const resourceScope = document.querySelector(".resource-scope");

  if (!map || !contextPanel || !contextTabs || !contextActions) return;

  const cycleIndex = { units: -1, workers: -1, cities: -1 };
  let replayingTileClick = false;
  let syncing = false;
  let syncQueued = false;
  let lastActionSignature = "";

  const style = document.createElement("style");
  style.id = "contextReviewCleanupStyles";
  style.textContent = [
    "#cityBtn,.toolbar>.badge-wrap{display:block!important;position:fixed!important;left:0!important;bottom:0!important;width:2px!important;height:2px!important;min-width:0!important;min-height:0!important;padding:0!important;margin:0!important;opacity:0!important;overflow:hidden!important;pointer-events:none!important;z-index:-1!important}",
    ".toolbar>.badge-wrap #scienceBtn{width:2px!important;height:2px!important;min-width:0!important;min-height:0!important;padding:0!important;pointer-events:none!important}",
    ".toolbar>.badge-wrap #scienceBadge{display:none!important}",
    ".resource-scope{display:flex!important;position:fixed!important;left:4px!important;bottom:0!important;width:8px!important;height:2px!important;min-height:0!important;padding:0!important;margin:0!important;opacity:0!important;overflow:hidden!important;pointer-events:none!important;z-index:-1!important}",
    ".resource-scope button{position:absolute!important;top:0!important;width:2px!important;height:2px!important;min-width:0!important;min-height:0!important;padding:0!important;margin:0!important;pointer-events:none!important}",
    "#resourcePrev{left:0!important}#resourceNext{left:4px!important}#resourceScope{display:none!important}",
    "@media(max-width:1099px){.app{grid-template-rows:auto auto auto minmax(0,1fr) auto auto!important}}",
    ".toolbar{grid-template-columns:minmax(0,1fr) 56px!important;gap:7px!important;min-height:49px!important;height:49px!important;position:relative!important;z-index:20!important}",
    "#endTurnBtn{grid-column:1!important;width:100%!important}#menuBtn{grid-column:2!important;width:56px!important}",
    "#endTurnBtn,#menuBtn{height:49px!important;min-height:49px!important;margin:0!important}",
    "#contextTabs{display:flex!important;position:fixed!important;left:16px!important;bottom:0!important;width:120px!important;height:2px!important;min-height:0!important;padding:0!important;margin:0!important;opacity:0!important;overflow:hidden!important;pointer-events:none!important;z-index:-1!important}",
    "#contextTabs .inspect-tab{height:2px!important;min-height:0!important;padding:0 8px!important;margin:0!important;font-size:1px!important;pointer-events:none!important}",
    "#contextActions [data-context-action=\"stack-prev-unit\"],#contextActions [data-context-action=\"stack-next-unit\"]{display:block!important;position:fixed!important;left:0!important;bottom:0!important;width:2px!important;height:2px!important;min-width:0!important;min-height:0!important;padding:0!important;margin:0!important;opacity:0!important;overflow:hidden!important;pointer-events:none!important;z-index:-1!important}",
    ".context{position:relative!important;z-index:21!important;align-self:stretch!important;min-height:82px!important;max-height:min(178px,25dvh)!important;padding:7px 9px!important;gap:5px!important;overflow:hidden!important}",
    ".context-copy{flex:0 0 auto!important}",
    "#contextActions{display:grid!important;grid-template-columns:repeat(var(--context-action-count,1),minmax(78px,1fr))!important;align-items:stretch!important;justify-content:stretch!important;gap:6px!important;width:100%!important;max-width:100%!important;margin:0!important;padding:0 0 2px!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-padding-inline:0!important}",
    "#contextActions:empty{display:none!important}",
    "#contextActions>.context-btn:not([data-context-action=\"stack-prev-unit\"]):not([data-context-action=\"stack-next-unit\"]){width:100%!important;min-width:78px!important;height:42px!important;min-height:42px!important;margin:0!important;padding:0 7px!important}",
    ".context-stack-picker{display:flex;gap:6px;overflow-x:auto;max-width:100%;padding:0 0 3px;scrollbar-width:none}",
    ".context-stack-picker::-webkit-scrollbar{display:none}",
    ".context-stack-unit{flex:0 0 auto;min-height:34px;padding:5px 9px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:11px;font-weight:800;color:inherit;white-space:nowrap}",
    ".context-stack-unit.is-active{background:var(--accent-2,#527f50);border-color:rgba(255,255,255,.26)}",
    "#strategyReadiness button{opacity:1!important}",
    "#strategyReadiness button[data-has-object=\"true\"]{cursor:pointer}",
    "#strategyReadiness button[data-ready-count=\"0\"]:not([data-ready-kind=\"science\"]){filter:saturate(.72);background:rgba(255,255,255,.055)}",
    "#strategyReadiness button[data-ready-count]:not([data-ready-count=\"0\"]){box-shadow:inset 0 0 0 1px rgba(255,214,119,.34)}",
    "@media(max-width:520px){.toolbar{grid-template-columns:minmax(0,1fr) 52px!important;height:47px!important;min-height:47px!important;gap:6px!important}#endTurnBtn,#menuBtn{height:47px!important;min-height:47px!important}#menuBtn{width:52px!important}.context{min-height:78px!important;max-height:min(164px,23dvh)!important;padding:6px 8px!important;gap:4px!important}.context-title{font-size:14px!important}.context-text{margin-top:3px!important;max-height:40px!important;font-size:10px!important;line-height:1.2!important}#contextActions{gap:5px!important}#contextActions>.context-btn:not([data-context-action=\"stack-prev-unit\"]):not([data-context-action=\"stack-next-unit\"]){min-width:74px!important;height:40px!important;min-height:40px!important;font-size:11px!important}}"
  ].join("\n");
  document.head.appendChild(style);

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

  function livingUnits(gs, workerOnly) {
    if (!gs || !Array.isArray(gs.units)) return [];
    return gs.units.filter(function (unit) {
      if (Number(unit.hp || 0) <= 0) return false;
      return workerOnly ? unit.type === "worker" : unit.type !== "worker";
    });
  }

  function unitReady(unit) {
    return Number(unit.moves || 0) > 0 && !unit.acted && !unit.travelOrder && !unit.order;
  }

  function cityReady(city) {
    return Number(city.hp || 0) > 0 && !city.queue;
  }

  function selectedPlayerUnit(gs, selectedId) {
    if (!gs || !Array.isArray(gs.units)) return null;
    return gs.units.find(function (unit) { return String(unit.id) === String(selectedId); }) || null;
  }

  function ownUnitsAt(gs, x, y) {
    if (!gs || !Array.isArray(gs.units)) return [];
    return gs.units.filter(function (unit) {
      return Number(unit.x) === x && Number(unit.y) === y && Number(unit.hp || 0) > 0;
    });
  }

  function playerCityAt(gs, x, y) {
    return playerCities(gs).find(function (city) {
      return Number(city.x) === x && Number(city.y) === y && Number(city.hp || 0) > 0;
    }) || null;
  }

  function semanticLayer(target) {
    if (!target || !target.closest) return "tile";
    if (target.closest(".piece.city, .piece.ai-city, .city-pop")) return "city";
    if (target.closest(".piece.camp, .camp-marker, .camp-hp")) return "camp";
    if (target.closest(".piece.unit, .piece.ai-unit, .piece.enemy, .unit-count, .barbarian-marker")) return "unit";
    return "tile";
  }

  function clickLayer(layer) {
    const button = contextTabs.querySelector('[data-inspect-layer="' + layer + '"]');
    if (button) button.click();
  }

  function replayCoreTileClick(tile) {
    replayingTileClick = true;
    try {
      tile.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    } finally {
      replayingTileClick = false;
    }
  }

  function selectStackUnitNow(targetId) {
    let attempts = 0;
    while (attempts++ < 40) {
      const value = debug();
      const selectedId = value && value.getSelectedUnitId ? value.getSelectedUnitId() : null;
      if (String(selectedId) === String(targetId)) return true;
      const next = contextActions.querySelector('[data-context-action="stack-next-unit"]');
      if (!next) return false;
      next.click();
    }
    return false;
  }

  function selectStackUnit(targetId) {
    selectStackUnitNow(targetId);
    queueSync();
  }

  function stackSignature(units, selectedId) {
    return units.map(function (unit) {
      return [unit.id, unit.type, unit.name || "", String(unit.id) === String(selectedId) ? 1 : 0].join(":");
    }).join("|");
  }

  function renderStackPicker() {
    let picker = contextPanel.querySelector("[data-context-stack-picker]");
    const value = debug();
    const gs = value && value.state;
    const selectedId = value && value.getSelectedUnitId ? value.getSelectedUnitId() : null;
    const layer = value && value.getInspectLayer ? value.getInspectLayer() : null;
    const selectedUnit = selectedPlayerUnit(gs, selectedId);
    const isOwnUnitContext = layer === "unit" && contextActions.dataset.unitOwner === "player";
    const units = isOwnUnitContext && selectedUnit ? ownUnitsAt(gs, selectedUnit.x, selectedUnit.y) : [];

    if (units.length <= 1) {
      if (picker) picker.remove();
      return;
    }

    const signature = stackSignature(units, selectedId);
    if (picker && picker.dataset.signature === signature) return;

    if (!picker) {
      picker = document.createElement("div");
      picker.className = "context-stack-picker";
      picker.dataset.contextStackPicker = "1";
      picker.setAttribute("aria-label", "Отряды на клетке");
      contextPanel.insertBefore(picker, contextActions);
    }

    picker.dataset.signature = signature;
    picker.innerHTML = "";
    units.forEach(function (unit) {
      const button = document.createElement("button");
      const defs = window.EpohiData && window.EpohiData.UNIT_DEFS;
      const def = defs && defs[unit.type];
      const icon = def && (def.mapIcon || def.icon) ? (def.mapIcon || def.icon) : "•";
      const label = unit.name || (def && def.name) || "Отряд";
      button.type = "button";
      button.className = "context-stack-unit" + (String(unit.id) === String(selectedId) ? " is-active" : "");
      button.textContent = icon + " " + label;
      button.dataset.unitId = unit.id;
      button.setAttribute("aria-pressed", String(String(unit.id) === String(selectedId)));
      button.addEventListener("click", function () { selectStackUnit(unit.id); });
      picker.appendChild(button);
    });
    picker.scrollLeft = 0;
  }

  function readinessSnapshot(gs) {
    const units = livingUnits(gs, false);
    const workers = livingUnits(gs, true);
    const cities = playerCities(gs).filter(function (city) { return Number(city.hp || 0) > 0; });
    return {
      units: { items: units, ready: units.filter(unitReady).length },
      workers: { items: workers, ready: workers.filter(unitReady).length },
      cities: { items: cities, ready: cities.filter(cityReady).length }
    };
  }

  function scienceNeedsChoice(gs) {
    if (!gs || gs.currentResearch) return false;
    const techs = window.EpohiData && window.EpohiData.TECHS ? window.EpohiData.TECHS : {};
    const researched = new Set([].concat(gs.researched || [], gs.technologies || []));
    return Object.keys(techs).some(function (id) { return !researched.has(id); });
  }

  function refreshActivitySwitcher() {
    const bar = document.getElementById("strategyReadiness");
    const gs = state();
    if (!bar || !gs) return;
    const snapshot = readinessSnapshot(gs);
    ["units", "workers", "cities"].forEach(function (kind) {
      const button = bar.querySelector('[data-ready-kind="' + kind + '"]');
      if (!button) return;
      const data = snapshot[kind];
      const counter = button.querySelector("b");
      const text = data.ready + "/" + data.items.length;
      if (counter && counter.textContent !== text) counter.textContent = text;
      button.disabled = data.items.length === 0;
      button.dataset.hasObject = String(data.items.length > 0);
      button.dataset.readyCount = String(data.ready);
      button.title = kind === "units" ? "Военные отряды: готовы / всего" : (kind === "workers" ? "Рабочие: готовы / всего" : "Города без очереди / всего");
      button.setAttribute("aria-label", button.title + ": " + text);
      button.classList.toggle("needs-attention", data.ready > 0);
    });

    const science = bar.querySelector('[data-ready-kind="science"]');
    if (science) {
      const needsChoice = scienceNeedsChoice(gs);
      const counter = science.querySelector("b");
      if (counter) counter.textContent = needsChoice ? "!" : "✓";
      science.disabled = false;
      science.dataset.hasObject = "true";
      science.dataset.readyCount = needsChoice ? "1" : "0";
      science.title = needsChoice ? "Выбрать исследование" : "Открыть исследования";
      science.setAttribute("aria-label", science.title);
      science.classList.toggle("needs-attention", needsChoice);
    }
  }

  function directActionButtons() {
    return Array.from(contextActions.children).filter(function (element) {
      if (!element.matches || !element.matches("button.context-btn")) return false;
      const action = element.dataset.contextAction;
      return action !== "stack-prev-unit" && action !== "stack-next-unit";
    });
  }

  function syncActionLayout() {
    const buttons = directActionButtons();
    const value = debug();
    const selectedId = value && value.getSelectedUnitId ? value.getSelectedUnitId() : "";
    const signature = [
      selectedId || "",
      contextTitle ? contextTitle.textContent : "",
      buttons.map(function (button) { return (button.dataset.contextAction || "") + ":" + button.textContent.trim(); }).join("|")
    ].join("::");
    contextActions.style.setProperty("--context-action-count", String(Math.max(1, buttons.length)));
    contextActions.dataset.actionCount = String(buttons.length);
    if (signature !== lastActionSignature) {
      lastActionSignature = signature;
      contextActions.scrollLeft = 0;
    }
  }

  function tileElement(x, y) {
    return map.querySelector('.tile[data-x="' + x + '"][data-y="' + y + '"]');
  }

  function focusUnit(unit) {
    const value = debug();
    if (!value || !unit) return;
    if (typeof value.centerCameraOnTile === "function") value.centerCameraOnTile(unit.x, unit.y, true);
    const tile = tileElement(unit.x, unit.y);
    if (!tile) return;
    const piece = tile.querySelector(".piece.unit") || tile;
    piece.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    selectStackUnitNow(unit.id);
    clickLayer("unit");
    queueSync();
  }

  function focusCity(city) {
    const value = debug();
    if (!value || !city) return;
    if (typeof value.setActiveCity === "function") value.setActiveCity(city.id);
    if (typeof value.centerCameraOnTile === "function") value.centerCameraOnTile(city.x, city.y, true);
    const tile = tileElement(city.x, city.y);
    if (!tile) return;
    const piece = tile.querySelector(".piece.city") || tile.querySelector(".city-pop") || tile;
    piece.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    clickLayer("city");
    queueSync();
  }

  function cycle(items, kind, callback) {
    if (!items.length) return;
    cycleIndex[kind] = (cycleIndex[kind] + 1) % items.length;
    callback(items[cycleIndex[kind]]);
  }

  function handleActivity(kind) {
    const gs = state();
    if (!gs) return;
    const snapshot = readinessSnapshot(gs);
    if (kind === "units") cycle(snapshot.units.items, "units", focusUnit);
    else if (kind === "workers") cycle(snapshot.workers.items, "workers", focusUnit);
    else if (kind === "cities") cycle(snapshot.cities.items, "cities", focusCity);
    else if (kind === "science" && scienceButton) scienceButton.click();
  }

  function syncUi() {
    syncQueued = false;
    if (syncing) return;
    syncing = true;
    try {
      [cityButton, scienceWrap, resourceScope, contextTabs].forEach(function (element) {
        if (!element) return;
        element.setAttribute("aria-hidden", "true");
        element.tabIndex = -1;
      });
      if (scienceButton) scienceButton.tabIndex = -1;
      if (toolbar) toolbar.dataset.reviewLayout = "compact";
      refreshActivitySwitcher();
      renderStackPicker();
      syncActionLayout();
    } finally {
      syncing = false;
    }
  }

  function queueSync() {
    if (syncQueued) return;
    syncQueued = true;
    window.requestAnimationFrame(syncUi);
  }

  map.addEventListener("click", function (event) {
    if (replayingTileClick) return;
    const tile = event.target.closest && event.target.closest(".tile");
    if (!tile || !map.contains(tile)) return;

    const layer = semanticLayer(event.target);
    const x = Number(tile.dataset.x);
    const y = Number(tile.dataset.y);
    const before = debug();
    const gs = before && before.state;
    const selectedId = before && before.getSelectedUnitId ? before.getSelectedUnitId() : null;
    const selectedUnit = selectedPlayerUnit(gs, selectedId);
    const unitsHere = ownUnitsAt(gs, x, y);
    const selectedAlreadyHere = !!selectedUnit && Number(selectedUnit.x) === x && Number(selectedUnit.y) === y;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (layer === "city") {
      const city = playerCityAt(gs, x, y);
      if (city && before && typeof before.setActiveCity === "function") before.setActiveCity(city.id);
    }

    if (layer === "unit" && unitsHere.length && before && typeof before.inspectOwnUnitAt === "function") {
      const targetId = selectedAlreadyHere ? selectedId : unitsHere[0].id;
      before.inspectOwnUnitAt(x, y, targetId);
      queueSync();
      return;
    }

    replayCoreTileClick(tile);
    if (layer === "unit" && unitsHere.length) {
      const targetId = selectedAlreadyHere ? selectedId : unitsHere[0].id;
      selectStackUnitNow(targetId);
    }
    clickLayer(layer);
    queueSync();
  }, true);

  document.addEventListener("click", function (event) {
    const button = event.target.closest && event.target.closest("#strategyReadiness [data-ready-kind]");
    if (!button) return;
    const kind = button.dataset.readyKind;
    const gs = state();
    if (!gs) return;
    const snapshot = readinessSnapshot(gs);
    const hasObject = kind === "science" || (snapshot[kind] && snapshot[kind].items.length > 0);
    if (!hasObject) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    handleActivity(kind);
  }, true);

  window.EpohiContextReviewCleanup = {
    version: 4,
    semanticLayer: semanticLayer,
    sync: syncUi,
    selectStackUnit: selectStackUnit,
    readinessSnapshot: readinessSnapshot,
    handleActivity: handleActivity,
    syncActionLayout: syncActionLayout
  };

  queueSync();
})();
