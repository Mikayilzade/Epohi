(function () {
  "use strict";

  const map = document.getElementById("map");
  const contextPanel = document.getElementById("contextPanel");
  const contextTabs = document.getElementById("contextTabs");
  const contextActions = document.getElementById("contextActions");
  const contextText = document.getElementById("contextText");
  const cityButton = document.getElementById("cityBtn");
  const resourceScope = document.querySelector(".resource-scope");

  if (!map || !contextPanel || !contextTabs || !contextActions) return;

  const cycleIndex = { units: -1, workers: -1, cities: -1 };
  let replayingTileClick = false;
  let syncing = false;
  let syncQueued = false;

  const style = document.createElement("style");
  style.id = "contextReviewCleanupStyles";
  style.textContent = [
    "#cityBtn{display:block!important;position:fixed!important;left:0!important;bottom:0!important;width:2px!important;height:2px!important;min-width:0!important;min-height:0!important;padding:0!important;margin:0!important;opacity:0!important;overflow:hidden!important;z-index:155!important}",
    ".resource-scope{display:flex!important;position:fixed!important;left:4px!important;bottom:0!important;width:8px!important;height:2px!important;min-height:0!important;padding:0!important;margin:0!important;opacity:0!important;overflow:visible!important;z-index:154!important}",
    ".resource-scope button{position:absolute!important;top:0!important;width:2px!important;height:2px!important;min-width:0!important;min-height:0!important;padding:0!important;margin:0!important}",
    "#resourcePrev{left:0!important}#resourceNext{left:4px!important}#resourceScope{display:none!important}",
    ".toolbar{grid-template-columns:minmax(0,1fr) minmax(132px,1.35fr) 56px!important}",
    "#contextTabs{display:flex!important;position:fixed!important;left:16px!important;bottom:0!important;width:120px!important;height:2px!important;min-height:0!important;padding:0!important;margin:0!important;opacity:0!important;overflow:visible!important;z-index:153!important}",
    "#contextTabs .inspect-tab{height:2px!important;min-height:0!important;padding:0 8px!important;margin:0!important;font-size:1px!important}",
    "#contextActions [data-context-action=\"stack-prev-unit\"],#contextActions [data-context-action=\"stack-next-unit\"]{display:block!important;position:fixed!important;bottom:0!important;width:2px!important;height:2px!important;min-width:0!important;min-height:0!important;padding:0!important;margin:0!important;opacity:0!important;z-index:152!important}",
    "#contextActions [data-context-action=\"stack-prev-unit\"]{left:140px!important}#contextActions [data-context-action=\"stack-next-unit\"]{left:144px!important}",
    ".context-stack-picker{display:flex;gap:6px;overflow-x:auto;max-width:100%;padding:2px 0 4px;scrollbar-width:none}",
    ".context-stack-picker::-webkit-scrollbar{display:none}",
    ".context-stack-unit{flex:0 0 auto;min-height:34px;padding:5px 9px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:11px;font-weight:800;color:inherit;white-space:nowrap}",
    ".context-stack-unit.is-active{background:var(--accent-2,#527f50);border-color:rgba(255,255,255,.26)}",
    "#strategyReadiness button{opacity:1!important}",
    "#strategyReadiness button[data-has-object=\"true\"]{cursor:pointer}",
    "#strategyReadiness button[data-ready-count=\"0\"]:not([data-ready-kind=\"science\"]){filter:saturate(.72);background:rgba(255,255,255,.055)}",
    "#strategyReadiness button[data-ready-count]:not([data-ready-count=\"0\"]){box-shadow:inset 0 0 0 1px rgba(255,214,119,.34)}",
    "@media(max-width:520px){.toolbar{grid-template-columns:minmax(0,1fr) minmax(126px,1.45fr) 52px!important}}"
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
    if (target.closest(".piece.unit, .piece.ai-unit, .unit-count, .barbarian-marker")) return "unit";
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
    const isOwnUnitContext = layer === "unit" && contextText && contextText.textContent.indexOf("Владелец: Ардена") !== -1;
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
      button.classList.toggle("needs-attention", data.ready > 0);
    });
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
    else if (kind === "science") {
      const science = document.getElementById("scienceBtn");
      if (science) science.click();
    }
  }

  function syncUi() {
    syncQueued = false;
    if (syncing) return;
    syncing = true;
    try {
      if (cityButton) {
        cityButton.style.display = "";
        cityButton.removeAttribute("aria-hidden");
        cityButton.tabIndex = -1;
      }
      if (resourceScope) {
        resourceScope.style.display = "";
        resourceScope.removeAttribute("aria-hidden");
      }
      refreshActivitySwitcher();
      renderStackPicker();
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

    if (layer === "unit" && selectedAlreadyHere && unitsHere.length) {
      clickLayer("unit");
      queueSync();
      return;
    }

    replayCoreTileClick(tile);
    if (layer !== "unit" && selectedAlreadyHere && unitsHere.length > 1) selectStackUnitNow(selectedId);
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

  const observer = new MutationObserver(queueSync);
  observer.observe(contextPanel, { childList: true, subtree: true, characterData: true });
  observer.observe(document.body, { childList: true, subtree: true });

  window.EpohiContextReviewCleanup = {
    version: 1,
    semanticLayer: semanticLayer,
    sync: syncUi,
    selectStackUnit: selectStackUnit,
    readinessSnapshot: readinessSnapshot,
    handleActivity: handleActivity
  };

  queueSync();
})();
