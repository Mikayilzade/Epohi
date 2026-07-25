(function () {
  "use strict";

  if (!window.EpohiData || !window.EpohiHumansPathing) {
    throw new Error("EpohiData and EpohiHumansPathing are required before humans-strategy-ux.js");
  }

  const { INTEREST_TYPES, TECHS } = window.EpohiData;
  const PATHING = window.EpohiHumansPathing;
  const PLAYER = {
    key: "ardena",
    name: "Ардена",
    color: "#d8ad4e",
    dark: "#365a3e",
    symbol: "A"
  };
  const CULTURES = [
    {
      key: "zarr",
      name: "Каганат Зарр",
      color: "#c45143",
      dark: "#672c28",
      symbol: "Z",
      cityNames: ["Кар-Зар", "Ордак", "Таркеш", "Ур-Мазар"],
      score: -28,
      temperament: "воинственные степные кланы"
    },
    {
      key: "velm",
      name: "Лига Вельмора",
      color: "#4d79b9",
      dark: "#273f68",
      symbol: "V",
      cityNames: ["Вельмор", "Кестен", "Роэн", "Лиарн"],
      score: -18,
      temperament: "холодные торговые города"
    },
    {
      key: "elaria",
      name: "Союз Эларии",
      color: "#6f9b68",
      dark: "#36563a",
      symbol: "E",
      cityNames: ["Элар", "Мирен", "Талвей", "Арелис"],
      score: 38,
      temperament: "родственные земледельческие земли"
    },
    {
      key: "varkesh",
      name: "Держава Варкеш",
      color: "#8b5bb8",
      dark: "#4b3269",
      symbol: "K",
      cityNames: ["Вар-Кеш", "Нарум", "Сагран", "Ир-Кар"],
      score: -24,
      temperament: "чуждая дворцовая держава"
    }
  ];

  let frame = 0;
  let diplomacyModal = null;
  let poiModal = null;
  const cycleIndex = { units: -1, workers: -1, cities: -1 };

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function state() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function playerCities(gs) {
    return Array.isArray(gs.cities) && gs.cities.length ? gs.cities : (gs.city ? [gs.city] : []);
  }

  function safeText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function ensureDiplomacy(civ, profile) {
    if (!civ.diplomacy || typeof civ.diplomacy !== "object") {
      civ.diplomacy = {
        score: profile.score,
        temperament: profile.temperament,
        history: []
      };
    }
    if (!Number.isFinite(civ.diplomacy.score)) civ.diplomacy.score = profile.score;
    if (!Array.isArray(civ.diplomacy.history)) civ.diplomacy.history = [];
    if (!civ.diplomacy.temperament) civ.diplomacy.temperament = profile.temperament;
  }

  function ensureIdentity(gs) {
    if (!gs) return false;
    let changed = false;
    if (!gs.playerIdentity) {
      gs.playerIdentity = Object.assign({}, PLAYER);
      changed = true;
    }

    const rivals = gs.rivals || [];
    rivals.forEach(function (civ, index) {
      const profile = CULTURES[index % CULTURES.length];
      if (!civ.cultureKey) {
        civ.cultureKey = profile.key;
        civ.originalName = civ.name;
        civ.name = profile.name;
        civ.color = profile.color;
        civ.darkColor = profile.dark;
        civ.symbol = profile.symbol;
        changed = true;
      }
      const selected = CULTURES.find(function (item) { return item.key === civ.cultureKey; }) || profile;
      ensureDiplomacy(civ, selected);

      (civ.cities || []).forEach(function (city, cityIndex) {
        if (!city.cultureNamed) {
          city.originalName = city.name;
          city.name = selected.cityNames[cityIndex] || (selected.cityNames[0] + " " + (cityIndex + 1));
          city.cultureNamed = true;
          changed = true;
        }
      });
    });

    if (rivals.length >= 3) {
      const ally = rivals[2];
      if (ally && ally.relation !== "war" && !ally.diplomacyCampaignApplied) {
        ally.relation = "ally";
        ally.met = true;
        ally.diplomacy.score = Math.max(ally.diplomacy.score, 40);
        ally.diplomacyCampaignApplied = true;
        ally.diplomacy.history.unshift("Союз заключён до начала кампании.");
        changed = true;
      }
    }
    return changed;
  }

  function relationLabel(civ) {
    if (civ.relation === "war") return "Война";
    if (civ.relation === "ally") return "Союз";
    const score = civ.diplomacy ? civ.diplomacy.score : 0;
    if (score >= 25) return "Дружественные";
    if (score <= -20) return "Враждебные";
    return "Нейтральные";
  }

  function relationClass(civ) {
    if (civ.relation === "war") return "war";
    if (civ.relation === "ally") return "ally";
    const score = civ.diplomacy ? civ.diplomacy.score : 0;
    if (score <= -20) return "hostile";
    if (score >= 25) return "friendly";
    return "neutral";
  }

  function isKnownCiv(gs, civ) {
    return Boolean(gs.openMapMode || civ.met || civ.relation === "ally" || civ.relation === "war");
  }

  function factionForOwner(gs, owner) {
    if (!owner) return null;
    const own = playerCities(gs).some(function (city) { return owner === city.id || owner === city.name; });
    if (own) return { kind: "player", identity: gs.playerIdentity || PLAYER };
    const civ = (gs.rivals || []).find(function (item) { return owner === item.civilizationId; });
    return civ ? { kind: "rival", identity: civ, civ: civ } : null;
  }

  function rivalAt(gs, x, y) {
    for (const civ of (gs.rivals || [])) {
      const city = (civ.cities || []).find(function (item) { return item.hp > 0 && item.x === x && item.y === y; });
      if (city) return { civ: civ, city: city };
      const unit = (civ.units || []).find(function (item) { return item.hp > 0 && item.x === x && item.y === y; });
      if (unit) return { civ: civ, unit: unit };
    }
    return null;
  }

  function ownAt(gs, x, y) {
    const city = playerCities(gs).find(function (item) { return item.hp > 0 && item.x === x && item.y === y; });
    if (city) return { city: city };
    const unit = (gs.units || []).find(function (item) { return item.hp > 0 && item.x === x && item.y === y; });
    return unit ? { unit: unit } : null;
  }

  function addMarker(piece, identity, relation) {
    if (!piece || !identity) return;
    piece.style.setProperty("--strategy-faction", identity.color || PLAYER.color);
    piece.style.setProperty("--strategy-faction-dark", identity.darkColor || identity.dark || PLAYER.dark);
    piece.dataset.factionName = identity.name || "";
    let marker = piece.querySelector(".strategy-faction-marker");
    if (!marker) {
      marker = document.createElement("span");
      marker.className = "strategy-faction-marker";
      piece.appendChild(marker);
    }
    marker.textContent = identity.symbol || "•";
    marker.dataset.relation = relation || "own";
  }

  function decorateFactions(gs) {
    const map = document.getElementById("map");
    if (!map || !gs) return;
    map.querySelectorAll(".tile").forEach(function (tileElement) {
      const x = Number(tileElement.dataset.x);
      const y = Number(tileElement.dataset.y);
      const tile = gs.map[y] && gs.map[y][x];
      if (!tile) return;

      tileElement.classList.remove("strategy-player-territory", "strategy-rival-territory");
      tileElement.style.removeProperty("--strategy-territory");
      const faction = factionForOwner(gs, tile.owner);
      if (faction) {
        const color = faction.kind === "player" ? PLAYER.color : faction.civ.color;
        tileElement.style.setProperty("--strategy-territory", color);
        tileElement.classList.add(faction.kind === "player" ? "strategy-player-territory" : "strategy-rival-territory");
      }

      const own = ownAt(gs, x, y);
      const rival = rivalAt(gs, x, y);
      if (own) {
        const piece = tileElement.querySelector(own.city ? ".piece.city" : ".piece.unit");
        addMarker(piece, PLAYER, "own");
      }
      if (rival) {
        const piece = tileElement.querySelector(rival.city ? ".piece.ai-city" : ".piece.ai-unit");
        addMarker(piece, rival.civ, relationClass(rival.civ));
      }
    });
  }

  function readiness(gs) {
    const units = (gs.units || []).filter(function (unit) {
      return unit.hp > 0 && unit.type !== "worker" && (unit.moves || 0) > 0 && !unit.acted && !unit.travelOrder && !unit.order;
    });
    const workers = (gs.units || []).filter(function (unit) {
      return unit.hp > 0 && unit.type === "worker" && (unit.moves || 0) > 0 && !unit.acted && !unit.travelOrder && !unit.order;
    });
    const cities = playerCities(gs).filter(function (city) { return city.hp > 0 && !city.queue; });
    const researched = new Set(gs.researched || []);
    const hasResearchChoice = !gs.currentResearch && Object.keys(TECHS).some(function (id) { return !researched.has(id); });
    return { units: units, workers: workers, cities: cities, science: hasResearchChoice };
  }

  function ensureReadinessBar() {
    let bar = document.getElementById("strategyReadiness");
    if (bar) return bar;
    const topbar = document.querySelector(".topbar");
    if (!topbar) return null;
    bar = document.createElement("div");
    bar.id = "strategyReadiness";
    bar.className = "strategy-readiness";
    bar.innerHTML =
      '<button type="button" data-ready-kind="units" title="Отряды без приказа"><span>⚔️</span><b>0</b></button>' +
      '<button type="button" data-ready-kind="workers" title="Рабочие без приказа"><span>🔨</span><b>0</b></button>' +
      '<button type="button" data-ready-kind="cities" title="Города без производства"><span>🏛️</span><b>0</b></button>' +
      '<button type="button" data-ready-kind="science" title="Не выбрана технология"><span>🔬</span><b>·</b></button>';
    const turn = topbar.querySelector(".turn-card");
    topbar.insertBefore(bar, turn || null);
    bar.addEventListener("click", function (event) {
      const button = event.target.closest("[data-ready-kind]");
      if (!button || button.disabled) return;
      handleReadiness(button.dataset.readyKind);
    });
    return bar;
  }

  function focusUnit(unit) {
    const value = debug();
    const gs = state();
    if (!value || !gs || !unit) return;
    if (typeof value.centerCameraOnTile === "function") value.centerCameraOnTile(unit.x, unit.y, true);
    const selector = '#map .tile[data-x="' + unit.x + '"][data-y="' + unit.y + '"]';
    const tile = document.querySelector(selector);
    if (!tile) return;
    const stack = (gs.units || []).filter(function (item) { return item.hp > 0 && item.x === unit.x && item.y === unit.y; });
    for (let attempt = 0; attempt < Math.max(1, stack.length + 1); attempt += 1) {
      tile.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      if (typeof value.getSelectedUnitId !== "function" || String(value.getSelectedUnitId()) === String(unit.id)) break;
    }
  }

  function focusCity(city) {
    const value = debug();
    if (!value || !city) return;
    if (typeof value.setActiveCity === "function") value.setActiveCity(city.id);
    if (typeof value.centerCameraOnTile === "function") value.centerCameraOnTile(city.x, city.y, true);
    const button = document.getElementById("cityBtn");
    if (button) button.click();
  }

  function cycle(items, kind, callback) {
    if (!items.length) return;
    cycleIndex[kind] = (cycleIndex[kind] + 1) % items.length;
    callback(items[cycleIndex[kind]]);
  }

  function handleReadiness(kind) {
    const gs = state();
    if (!gs) return;
    const ready = readiness(gs);
    if (kind === "units") cycle(ready.units, "units", focusUnit);
    else if (kind === "workers") cycle(ready.workers, "workers", focusUnit);
    else if (kind === "cities") cycle(ready.cities, "cities", focusCity);
    else if (kind === "science") {
      const button = document.getElementById("scienceBtn");
      if (button) button.click();
    }
  }

  function refreshReadiness(gs) {
    const bar = ensureReadinessBar();
    if (!bar || !gs) return;
    const ready = readiness(gs);
    const counts = {
      units: ready.units.length,
      workers: ready.workers.length,
      cities: ready.cities.length,
      science: ready.science ? "!" : "✓"
    };
    Object.keys(counts).forEach(function (kind) {
      const button = bar.querySelector('[data-ready-kind="' + kind + '"]');
      if (!button) return;
      const value = String(counts[kind]);
      const counter = button.querySelector("b");
      if (counter.textContent !== value) counter.textContent = value;
      button.disabled = kind === "science" ? !ready.science : counts[kind] === 0;
      button.classList.toggle("needs-attention", kind === "science" ? ready.science : counts[kind] > 0);
    });
  }

  function relationCard(gs, civ) {
    const score = civ.diplomacy ? civ.diplomacy.score : 0;
    const status = relationLabel(civ);
    const canGift = (gs.resources.gold || 0) >= 10 && civ.relation !== "war";
    let actions = "";
    if (civ.relation === "war") {
      actions += '<button type="button" data-dip-action="peace" data-civ-id="' + civ.civilizationId + '"' +
        ((gs.resources.gold || 0) < 20 ? " disabled" : "") + '>🕊 Мир · 20 🪙</button>';
    } else if (civ.relation === "ally") {
      actions += '<button type="button" class="secondary" data-dip-action="break" data-civ-id="' + civ.civilizationId + '">Разорвать союз</button>';
    } else {
      if (score >= 30) actions += '<button type="button" data-dip-action="ally" data-civ-id="' + civ.civilizationId + '">🤝 Предложить союз</button>';
      actions += '<button type="button" class="danger" data-dip-action="war" data-civ-id="' + civ.civilizationId + '">⚔️ Объявить войну</button>';
    }
    if (civ.relation !== "war") {
      actions += '<button type="button" class="secondary" data-dip-action="gift" data-civ-id="' + civ.civilizationId + '"' +
        (canGift ? "" : " disabled") + '>🎁 Дар · 10 🪙</button>';
    }

    return '<article class="strategy-diplomacy-card ' + relationClass(civ) + '" data-diplomacy-civ="' + civ.civilizationId + '" style="--strategy-civ:' + civ.color + ';--strategy-civ-dark:' + (civ.darkColor || civ.color) + '">' +
      '<header><span class="strategy-state-seal">' + safeText(civ.symbol || "•") + '</span><div><h3>' + safeText(civ.name) +
      '</h3><small>' + safeText(civ.diplomacy.temperament || "неизвестный народ") + '</small></div><strong>' + safeText(status) + '</strong></header>' +
      '<div class="strategy-relation-meter"><i style="width:' + Math.max(0, Math.min(100, score + 50)) + '%"></i></div>' +
      '<p>Отношение: ' + (score > 0 ? "+" : "") + score + '. Столица: ' + safeText((civ.cities && civ.cities[0] && civ.cities[0].name) || "неизвестна") + '.</p>' +
      '<div class="strategy-diplomacy-actions">' + actions + '</div></article>';
  }

  function ensureDiplomacyModal() {
    if (diplomacyModal && document.body.contains(diplomacyModal)) return diplomacyModal;
    diplomacyModal = document.getElementById("strategyDiplomacyModal");
    if (diplomacyModal) return diplomacyModal;
    diplomacyModal = document.createElement("div");
    diplomacyModal.id = "strategyDiplomacyModal";
    diplomacyModal.className = "modal";
    diplomacyModal.setAttribute("role", "dialog");
    diplomacyModal.setAttribute("aria-modal", "true");
    diplomacyModal.innerHTML = '<section class="sheet strategy-diplomacy-sheet"><header class="sheet-head"><h2>Дипломатия</h2>' +
      '<button type="button" class="close-btn" data-strategy-dip-close aria-label="Закрыть">×</button></header>' +
      '<div id="strategyDiplomacyContent" class="sheet-scroll"></div></section>';
    document.body.appendChild(diplomacyModal);
    diplomacyModal.querySelector("[data-strategy-dip-close]").addEventListener("click", function () {
      diplomacyModal.classList.remove("show");
    });
    diplomacyModal.addEventListener("click", handleDiplomacyAction);
    return diplomacyModal;
  }

  function openDiplomacy(civId) {
    const gs = state();
    if (!gs) return;
    ensureIdentity(gs);
    const known = (gs.rivals || []).filter(function (civ) { return isKnownCiv(gs, civ); });
    const modal = ensureDiplomacyModal();
    const content = modal.querySelector("#strategyDiplomacyContent");
    if (!known.length) {
      content.innerHTML = '<div class="inline-note">Другие государства ещё не обнаружены.</div>';
    } else {
      content.innerHTML = '<div class="strategy-diplomacy-list">' + known.map(function (civ) { return relationCard(gs, civ); }).join("") + '</div>';
    }
    modal.classList.add("show");
    if (civId) {
      const card = content.querySelector('[data-diplomacy-civ="' + civId + '"]');
      if (card) card.scrollIntoView({ block: "nearest" });
    }
  }

  function recordDiplomacy(civ, text) {
    if (!civ.diplomacy) return;
    const gs = state();
    civ.diplomacy.history.unshift("Ход " + ((gs && gs.turn) || 1) + ": " + text);
    civ.diplomacy.history = civ.diplomacy.history.slice(0, 20);
  }

  function handleDiplomacyAction(event) {
    const button = event.target.closest("[data-dip-action]");
    if (!button || button.disabled) return;
    const gs = state();
    const civ = gs && (gs.rivals || []).find(function (item) { return String(item.civilizationId) === String(button.dataset.civId); });
    if (!civ) return;
    const action = button.dataset.dipAction;

    if (action === "gift") {
      if ((gs.resources.gold || 0) < 10) return;
      gs.resources.gold -= 10;
      civ.diplomacy.score = Math.min(50, civ.diplomacy.score + 14);
      recordDiplomacy(civ, "Ардена отправила дар.");
    } else if (action === "ally") {
      if (civ.diplomacy.score < 30 || civ.relation === "war") return;
      civ.relation = "ally";
      civ.met = true;
      civ.diplomacy.score = Math.max(35, civ.diplomacy.score);
      recordDiplomacy(civ, "заключён союз с Арденой.");
    } else if (action === "break") {
      civ.relation = "neutral";
      civ.diplomacy.score = Math.min(civ.diplomacy.score, 5);
      recordDiplomacy(civ, "Ардена расторгла союз.");
    } else if (action === "peace") {
      if ((gs.resources.gold || 0) < 20) return;
      gs.resources.gold -= 20;
      civ.relation = "neutral";
      civ.diplomacy.score = -8;
      recordDiplomacy(civ, "заключён мир за выплату.");
    } else if (action === "war") {
      if (!window.confirm("Объявить войну государству «" + civ.name + "»?")) return;
      civ.relation = "war";
      civ.met = true;
      civ.diplomacy.score = -50;
      recordDiplomacy(civ, "Ардена объявила войну.");
    }

    const value = debug();
    if (value && typeof value.render === "function") value.render();
    openDiplomacy(civ.civilizationId);
    schedule();
  }

  function injectDiplomacyMenu() {
    const menu = document.getElementById("menuModal");
    const content = document.getElementById("menuContent");
    if (!menu || !content || !menu.classList.contains("show") || content.querySelector("[data-strategy-diplomacy]")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "menu-actions strategy-diplomacy-menu";
    wrapper.innerHTML = '<button type="button" class="wide-btn" data-strategy-diplomacy>🤝 Дипломатия</button>';
    wrapper.querySelector("button").addEventListener("click", function () {
      menu.classList.remove("show");
      openDiplomacy();
    });
    content.insertBefore(wrapper, content.firstChild);
  }

  function decorateContext(gs) {
    const title = document.getElementById("contextTitle");
    const inspected = document.querySelector("#map .tile.inspect-tile");
    if (!title || !gs) return;
    const existing = title.querySelector(".strategy-faction-chip");
    if (!inspected) {
      if (existing) existing.remove();
      return;
    }
    const x = Number(inspected.dataset.x);
    const y = Number(inspected.dataset.y);
    const rival = rivalAt(gs, x, y);
    const own = ownAt(gs, x, y);
    if (!rival && !own) {
      if (existing) existing.remove();
      return;
    }

    const identity = rival ? rival.civ : PLAYER;
    const relation = rival ? relationClass(rival.civ) : "own";
    const key = (rival ? rival.civ.civilizationId : "player") + ":" + relation;
    const label = rival ? (identity.symbol + " · " + identity.name) : (PLAYER.symbol + " · " + PLAYER.name);
    if (existing && existing.dataset.factionKey === key) {
      if (existing.textContent !== label) existing.textContent = label;
      existing.style.setProperty("--strategy-civ", identity.color || PLAYER.color);
      return;
    }

    if (existing) existing.remove();
    const chip = document.createElement(rival ? "button" : "span");
    chip.className = "strategy-faction-chip " + relation;
    chip.dataset.factionKey = key;
    chip.style.setProperty("--strategy-civ", identity.color || PLAYER.color);
    chip.textContent = label;
    if (rival) {
      chip.type = "button";
      chip.addEventListener("click", function (event) {
        event.stopPropagation();
        openDiplomacy(rival.civ.civilizationId);
      });
    }
    title.appendChild(chip);
  }

  function ensureThreeRivalsOption() {
    const select = document.getElementById("rivalCount");
    if (!select || select.querySelector('option[value="3"]')) return;
    const option = document.createElement("option");
    option.value = "3";
    option.textContent = "3 — большая политика";
    select.appendChild(option);
  }

  function ensurePoiModal() {
    poiModal = document.getElementById("routePoiModal");
    if (poiModal) return poiModal;
    poiModal = document.createElement("div");
    poiModal.id = "routePoiModal";
    poiModal.className = "modal";
    poiModal.setAttribute("role", "dialog");
    poiModal.setAttribute("aria-modal", "true");
    poiModal.innerHTML = '<section class="sheet"><header class="sheet-head"><h2>Находка</h2></header>' +
      '<div class="sheet-scroll" id="routePoiContent"></div></section>';
    document.body.appendChild(poiModal);
    return poiModal;
  }

  function openPoiChoice(gs, unit, located) {
    window.setTimeout(function () {
      if (!unit || !unit.travelOrder || unit.travelOrder.status !== "awaiting-choice") return;
      const modal = ensurePoiModal();
      const content = modal.querySelector("#routePoiContent");
      const typeId = located && located.target && located.target.type ? located.target.type : "ruins";
      const type = INTEREST_TYPES[typeId] || { name: typeId === "ruins" ? "Древние руины" : "Находка", icon: "✦" };
      content.innerHTML = '<div class="strategy-poi-arrival"><span>' + safeText(type.icon || "✦") + '</span><div><small>Маршрут завершён</small><h3>' + safeText(type.name) + '</h3>' +
        '<p>Отряд прибыл к цели. Выбери, как использовать находку.</p></div></div>' +
        '<div class="menu-actions"><button type="button" class="wide-btn" data-strategy-poi="study">🔬 Исследовать · +10 науки</button>' +
        '<button type="button" class="wide-btn secondary" data-strategy-poi="salvage">🪙 Разобрать · +8 производства и +6 золота</button></div>';
      content.querySelectorAll("[data-strategy-poi]").forEach(function (button) {
        button.addEventListener("click", function () {
          if (PATHING.resolvePoiChoice(unit.id, located.x, located.y, button.dataset.strategyPoi)) {
            modal.classList.remove("show");
            schedule();
          }
        });
      });
      modal.classList.add("show");
    }, 0);
  }

  function installWheelZoom() {
    const viewport = document.getElementById("mapViewport");
    if (!viewport || viewport.dataset.strategyWheelZoom === "1") return;
    viewport.dataset.strategyWheelZoom = "1";
    viewport.addEventListener("wheel", function (event) {
      if (event.ctrlKey || event.metaKey) return;
      const value = debug();
      if (!value || typeof value.getCamera !== "function" || typeof value.setCameraScale !== "function") return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const style = getComputedStyle(viewport);
      const originX = event.clientX - rect.left - (parseFloat(style.paddingLeft) || 0);
      const originY = event.clientY - rect.top - (parseFloat(style.paddingTop) || 0);
      const camera = value.getCamera();
      const factor = Math.exp(-event.deltaY * 0.0014);
      value.setCameraScale(camera.scale * factor, originX, originY, false);
    }, { passive: false });
  }

  function refresh() {
    frame = 0;
    const gs = state();
    ensureThreeRivalsOption();
    installWheelZoom();
    if (!gs) return;
    ensureIdentity(gs);
    refreshReadiness(gs);
    decorateFactions(gs);
    decorateContext(gs);
    injectDiplomacyMenu();
  }

  function schedule() {
    if (frame) return;
    frame = window.requestAnimationFrame(refresh);
  }

  function install() {
    ensureReadinessBar();
    ensureDiplomacyModal();
    ensureThreeRivalsOption();
    installWheelZoom();
    PATHING.setPoiArrivalHandler(openPoiChoice);

    const map = document.getElementById("map");
    const context = document.getElementById("contextPanel");
    const turn = document.getElementById("turnValue");
    const screen = document.getElementById("screenRoot");
    const menu = document.getElementById("menuModal");
    const menuContent = document.getElementById("menuContent");
    if (map) new MutationObserver(schedule).observe(map, { childList: true });
    if (context) new MutationObserver(schedule).observe(context, { childList: true, subtree: true });
    if (turn) new MutationObserver(schedule).observe(turn, { childList: true, characterData: true, subtree: true });
    if (screen) new MutationObserver(schedule).observe(screen, { childList: true });
    if (menu) new MutationObserver(schedule).observe(menu, { attributes: true, attributeFilter: ["class"] });
    if (menuContent) new MutationObserver(schedule).observe(menuContent, { childList: true });
    document.addEventListener("click", function () { window.setTimeout(schedule, 0); }, true);
    window.addEventListener("resize", schedule);
    schedule();
  }

  window.EpohiStrategyUX = {
    version: 1,
    player: PLAYER,
    cultures: CULTURES,
    ensureIdentity: ensureIdentity,
    readiness: readiness,
    decorateFactions: decorateFactions,
    relationLabel: relationLabel,
    openDiplomacy: openDiplomacy,
    openPoiChoice: openPoiChoice,
    refresh: refresh
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();