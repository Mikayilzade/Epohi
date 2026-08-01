(function () {
  "use strict";

  if (!window.EpohiData || !window.EpohiHumansPathing || !window.EpohiUtils) {
    throw new Error("Epohi data, pathing and utils are required before humans-strategy-ux.js");
  }

  const { UNIT_DEFS, INTEREST_TYPES, TECHS } = window.EpohiData;
  const { passableTile, neighborsOf, chebyshev } = window.EpohiUtils;
  const PATHING = window.EpohiHumansPathing;
  const PLAYER = { key: "ardena", name: "Ардена", color: "#d8ad4e", dark: "#365a3e", symbol: "A" };
  const CULTURES = [
    { key: "zarr", name: "Каганат Зарр", color: "#c45143", dark: "#672c28", symbol: "Z", cityNames: ["Кар-Зар", "Ордак", "Таркеш", "Ур-Мазар"], score: -28, temperament: "воинственные степные кланы" },
    { key: "velm", name: "Лига Вельмора", color: "#4d79b9", dark: "#273f68", symbol: "V", cityNames: ["Вельмор", "Кестен", "Роэн", "Лиарн"], score: -18, temperament: "холодные торговые города" },
    { key: "elaria", name: "Союз Эларии", color: "#6f9b68", dark: "#36563a", symbol: "E", cityNames: ["Элар", "Мирен", "Талвей", "Арелис"], score: 38, temperament: "родственные земледельческие земли" },
    { key: "varkesh", name: "Держава Варкеш", color: "#8b5bb8", dark: "#4b3269", symbol: "K", cityNames: ["Вар-Кеш", "Нарум", "Сагран", "Ир-Кар"], score: -24, temperament: "чуждая дворцовая держава" }
  ];

  let frame = 0;
  let diplomacyModal = null;
  let poiModal = null;
  let pendingRivalCount = null;
  let cameraResizeObserver = null;
  const cycleIndex = { units: -1, workers: -1, cities: -1 };

  function debug() { return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null; }
  function state() { const value = debug(); return value && value.state ? value.state : null; }
  function playerCities(gs) { return Array.isArray(gs.cities) && gs.cities.length ? gs.cities : (gs.city ? [gs.city] : []); }
  function mapSize(gs) { return Number(gs.mapSize) || (Array.isArray(gs.map) ? gs.map.length : 0); }
  function safeText(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

  function ensureDiplomacy(civ, profile) {
    if (!civ.diplomacy || typeof civ.diplomacy !== "object") civ.diplomacy = { score: profile.score, temperament: profile.temperament, history: [] };
    if (!Number.isFinite(civ.diplomacy.score)) civ.diplomacy.score = profile.score;
    if (!Array.isArray(civ.diplomacy.history)) civ.diplomacy.history = [];
    if (!civ.diplomacy.temperament) civ.diplomacy.temperament = profile.temperament;
  }

  function markExplored(civ, gs, x, y, radius) {
    civ.explored = civ.explored || {};
    civ.visible = civ.visible || {};
    const size = mapSize(gs);
    for (let yy = Math.max(0, y - radius); yy <= Math.min(size - 1, y + radius); yy += 1) {
      for (let xx = Math.max(0, x - radius); xx <= Math.min(size - 1, x + radius); xx += 1) {
        if (chebyshev(x, y, xx, yy) <= radius) {
          civ.explored[xx + "," + yy] = true;
          civ.visible[xx + "," + yy] = true;
        }
      }
    }
  }

  function occupiedByUnit(gs, x, y) {
    if ((gs.units || []).some(function (unit) { return unit.hp > 0 && unit.x === x && unit.y === y; })) return true;
    if ((gs.barbarians || []).some(function (unit) { return unit.hp > 0 && unit.x === x && unit.y === y; })) return true;
    return (gs.rivals || []).some(function (civ) { return (civ.units || []).some(function (unit) { return unit.hp > 0 && unit.x === x && unit.y === y; }); });
  }

  function allCities(gs) {
    let result = playerCities(gs).slice();
    (gs.rivals || []).forEach(function (civ) { result = result.concat(civ.cities || []); });
    return result;
  }

  function findExtraStart(gs) {
    const size = mapSize(gs);
    let best = null;
    for (let y = 2; y < size - 2; y += 1) {
      for (let x = 2; x < size - 2; x += 1) {
        const tile = gs.map[y] && gs.map[y][x];
        if (!tile || !passableTile(tile) || tile.camp || tile.poi || tile.improvement || tile.owner || occupiedByUnit(gs, x, y)) continue;
        const cities = allCities(gs);
        const minimum = cities.reduce(function (value, city) { return Math.min(value, chebyshev(x, y, city.x, city.y)); }, 999);
        if (minimum < 7) continue;
        const room = neighborsOf(x, y, size).filter(function (point) { return passableTile(gs.map[point.y][point.x]) && !occupiedByUnit(gs, point.x, point.y); }).length;
        const score = minimum * 2 + room * 5;
        if (!best || score > best.score) best = { x: x, y: y, score: score };
      }
    }
    return best;
  }

  function makeRivalUnit(gs, civId, type, x, y) {
    const def = UNIT_DEFS[type];
    const id = "ru" + (gs.nextRivalUnitId++);
    return { id: id, civilizationId: civId, type: type, x: x, y: y, moves: def.maxMoves, acted: false, hp: def.maxHealth, maxHp: def.maxHealth };
  }

  function addExtraRival(gs, index) {
    const profile = CULTURES[index % CULTURES.length];
    const start = findExtraStart(gs);
    if (!start) return null;
    const id = "civ" + (index + 1);
    const city = { id: id + "-cap", name: profile.cityNames[0], x: start.x, y: start.y, population: 1, buildings: [], queue: null, hp: 180, maxHp: 180, capital: true, cultureNamed: true };
    const civ = {
      civilizationId: id, name: profile.name, originalName: profile.name, color: profile.color, darkColor: profile.dark, symbol: profile.symbol, cultureKey: profile.key,
      resources: { food: 6, production: 14, gold: 8, science: 4 }, science: { currentResearch: "agriculture" }, technologies: [], cities: [city], outposts: [], units: [], explored: {}, visible: {}, productionQueue: null,
      relation: "unknown", met: false, warStartTurn: null, strategicGoal: "исследование", currentThreats: [], lastKnownInterest: null, decisionHistory: [], defeated: false, mapSize: gs.mapSize
    };
    ensureDiplomacy(civ, profile);
    const spots = neighborsOf(start.x, start.y, mapSize(gs)).filter(function (point) {
      const tile = gs.map[point.y] && gs.map[point.y][point.x];
      return tile && passableTile(tile) && !tile.camp && !tile.poi && !occupiedByUnit(gs, point.x, point.y);
    });
    ["scout", "warrior"].forEach(function (type, unitIndex) {
      const spot = spots[unitIndex] || spots[0];
      if (!spot) return;
      const unit = makeRivalUnit(gs, id, type, spot.x, spot.y);
      civ.units.push(unit);
      markExplored(civ, gs, unit.x, unit.y, type === "scout" ? 2 : 1);
    });
    markExplored(civ, gs, start.x, start.y, 2);
    gs.rivals.push(civ);
    return civ;
  }

  function ensureRequestedRivals(gs) {
    if (pendingRivalCount != null && gs.strategyRequestedRivals == null) {
      gs.strategyRequestedRivals = pendingRivalCount;
      pendingRivalCount = null;
    }
    const wanted = Math.max(0, Number(gs.strategyRequestedRivals) || 0);
    if (wanted < 3) return false;
    let changed = false;
    while ((gs.rivals || []).length < wanted && (gs.rivals || []).length < 4) {
      if (!addExtraRival(gs, gs.rivals.length)) break;
      changed = true;
    }
    return changed;
  }

  function ensureIdentity(gs) {
    if (!gs) return false;
    let changed = ensureRequestedRivals(gs);
    if (!gs.playerIdentity) { gs.playerIdentity = Object.assign({}, PLAYER); changed = true; }
    const rivals = gs.rivals || [];
    rivals.forEach(function (civ, index) {
      const profile = CULTURES[index % CULTURES.length];
      if (!civ.cultureKey) {
        civ.cultureKey = profile.key; civ.originalName = civ.name; civ.name = profile.name; civ.color = profile.color; civ.darkColor = profile.dark; civ.symbol = profile.symbol; changed = true;
      }
      const selected = CULTURES.find(function (item) { return item.key === civ.cultureKey; }) || profile;
      ensureDiplomacy(civ, selected);
      (civ.cities || []).forEach(function (city, cityIndex) {
        if (!city.cultureNamed) { city.originalName = city.name; city.name = selected.cityNames[cityIndex] || (selected.cityNames[0] + " " + (cityIndex + 1)); city.cultureNamed = true; changed = true; }
      });
    });
    if (rivals.length >= 3) {
      const ally = rivals[2];
      if (ally && ally.relation !== "war" && !ally.diplomacyCampaignApplied) {
        ally.relation = "ally"; ally.met = true; ally.diplomacy.score = Math.max(ally.diplomacy.score, 40); ally.diplomacyCampaignApplied = true; ally.diplomacy.history.unshift("Союз заключён до начала кампании."); changed = true;
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
  function relationClass(civ) { if (civ.relation === "war") return "war"; if (civ.relation === "ally") return "ally"; const score = civ.diplomacy ? civ.diplomacy.score : 0; return score <= -20 ? "hostile" : (score >= 25 ? "friendly" : "neutral"); }
  function isKnownCiv(gs, civ) { return Boolean(gs.openMapMode || civ.met || civ.relation === "ally" || civ.relation === "war"); }

  function factionForOwner(gs, owner) {
    if (!owner) return null;
    const own = playerCities(gs).some(function (city) { return owner === city.id || owner === city.name; });
    if (own) return { kind: "player", identity: gs.playerIdentity || PLAYER };
    const civ = (gs.rivals || []).find(function (item) { return owner === item.civilizationId; });
    return civ ? { kind: "rival", identity: civ, civ: civ } : null;
  }

  function territoryAt(gs, x, y, tile) {
    const ownerFaction = factionForOwner(gs, tile && tile.owner);
    if (ownerFaction) return ownerFaction;
    const candidates = [];
    playerCities(gs).forEach(function (city) {
      const radius = city.population >= 6 ? 3 : (city.population >= 3 ? 2 : 1);
      const distance = chebyshev(x, y, city.x, city.y);
      if (distance <= radius) candidates.push({ distance: distance, faction: { kind: "player", identity: PLAYER } });
    });
    (gs.rivals || []).forEach(function (civ) {
      (civ.cities || []).forEach(function (city) {
        const radius = city.population >= 6 ? 3 : (city.population >= 3 ? 2 : 1);
        const distance = chebyshev(x, y, city.x, city.y);
        if (distance <= radius) candidates.push({ distance: distance, faction: { kind: "rival", identity: civ, civ: civ } });
      });
    });
    candidates.sort(function (a, b) { return a.distance - b.distance; });
    return candidates.length ? candidates[0].faction : null;
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
  function ownAt(gs, x, y) { const city = playerCities(gs).find(function (item) { return item.hp > 0 && item.x === x && item.y === y; }); if (city) return { city: city }; const unit = (gs.units || []).find(function (item) { return item.hp > 0 && item.x === x && item.y === y; }); return unit ? { unit: unit } : null; }

  function addMarker(piece, identity, relation) {
    if (!piece || !identity) return;
    piece.style.setProperty("--strategy-faction", identity.color || PLAYER.color);
    piece.style.setProperty("--strategy-faction-dark", identity.darkColor || identity.dark || PLAYER.dark);
    piece.dataset.factionName = identity.name || "";
    let marker = piece.querySelector(".strategy-faction-marker");
    if (!marker) { marker = document.createElement("span"); marker.className = "strategy-faction-marker"; piece.appendChild(marker); }
    marker.textContent = identity.symbol || "•"; marker.dataset.relation = relation || "own";
  }

  function decorateFactions(gs) {
    const map = document.getElementById("map");
    if (!map || !gs) return;
    map.querySelectorAll(".tile").forEach(function (tileElement) {
      const x = Number(tileElement.dataset.x), y = Number(tileElement.dataset.y), tile = gs.map[y] && gs.map[y][x];
      if (!tile) return;
      tileElement.classList.remove("strategy-player-territory", "strategy-rival-territory"); tileElement.style.removeProperty("--strategy-territory");
      const faction = territoryAt(gs, x, y, tile);
      if (faction) { const color = faction.kind === "player" ? PLAYER.color : faction.civ.color; tileElement.style.setProperty("--strategy-territory", color); tileElement.classList.add(faction.kind === "player" ? "strategy-player-territory" : "strategy-rival-territory"); }
      const own = ownAt(gs, x, y), rival = rivalAt(gs, x, y);
      if (own) addMarker(tileElement.querySelector(own.city ? ".piece.city" : ".piece.unit"), PLAYER, "own");
      if (rival) addMarker(tileElement.querySelector(rival.city ? ".piece.ai-city" : ".piece.ai-unit"), rival.civ, relationClass(rival.civ));
    });
  }

  function readiness(gs) {
    const units = (gs.units || []).filter(function (unit) { return unit.hp > 0 && unit.type !== "worker" && (unit.moves || 0) > 0 && !unit.acted && !unit.travelOrder && !unit.order; });
    const workers = (gs.units || []).filter(function (unit) { return unit.hp > 0 && unit.type === "worker" && (unit.moves || 0) > 0 && !unit.acted && !unit.travelOrder && !unit.order; });
    const cities = playerCities(gs).filter(function (city) { return city.hp > 0 && !city.queue; });
    const researched = new Set(gs.researched || []);
    const hasResearchChoice = !gs.currentResearch && Object.keys(TECHS).some(function (id) { return !researched.has(id); });
    return { units: units, workers: workers, cities: cities, science: hasResearchChoice };
  }

  function ensureReadinessBar() {
    let bar = document.getElementById("strategyReadiness");
    if (bar) return bar;
    const topbar = document.querySelector(".topbar"); if (!topbar) return null;
    bar = document.createElement("div"); bar.id = "strategyReadiness"; bar.className = "strategy-readiness";
    bar.innerHTML = '<button type="button" data-ready-kind="units" title="Отряды без приказа"><span>⚔️</span><b>0</b></button><button type="button" data-ready-kind="workers" title="Рабочие без приказа"><span>🔨</span><b>0</b></button><button type="button" data-ready-kind="cities" title="Города без производства"><span>🏛️</span><b>0</b></button><button type="button" data-ready-kind="science" title="Не выбрана технология"><span>🔬</span><b>·</b></button>';
    topbar.insertBefore(bar, topbar.querySelector(".turn-card") || null);
    bar.addEventListener("click", function (event) { const button = event.target.closest("[data-ready-kind]"); if (!button || button.disabled) return; handleReadiness(button.dataset.readyKind); });
    return bar;
  }

  function focusUnit(unit) {
    const value = debug(), gs = state(); if (!value || !gs || !unit) return;
    if (typeof value.centerCameraOnTile === "function") value.centerCameraOnTile(unit.x, unit.y, true);
    const tile = document.querySelector('#map .tile[data-x="' + unit.x + '"][data-y="' + unit.y + '"]'); if (!tile) return;
    const stack = (gs.units || []).filter(function (item) { return item.hp > 0 && item.x === unit.x && item.y === unit.y; });
    for (let attempt = 0; attempt < Math.max(1, stack.length + 1); attempt += 1) { tile.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window })); if (typeof value.getSelectedUnitId !== "function" || String(value.getSelectedUnitId()) === String(unit.id)) break; }
  }
  function focusCity(city) { const value = debug(); if (!value || !city) return; if (typeof value.setActiveCity === "function") value.setActiveCity(city.id); if (typeof value.centerCameraOnTile === "function") value.centerCameraOnTile(city.x, city.y, true); const button = document.getElementById("cityBtn"); if (button) button.click(); }
  function cycle(items, kind, callback) { if (!items.length) return; cycleIndex[kind] = (cycleIndex[kind] + 1) % items.length; callback(items[cycleIndex[kind]]); }
  function handleReadiness(kind) { const gs = state(); if (!gs) return; const ready = readiness(gs); if (kind === "units") cycle(ready.units, "units", focusUnit); else if (kind === "workers") cycle(ready.workers, "workers", focusUnit); else if (kind === "cities") cycle(ready.cities, "cities", focusCity); else if (kind === "science") { const button = document.getElementById("scienceBtn"); if (button) button.click(); } }

  function refreshReadiness(gs) {
    const bar = ensureReadinessBar(); if (!bar || !gs) return; const ready = readiness(gs);
    const counts = { units: ready.units.length, workers: ready.workers.length, cities: ready.cities.length, science: ready.science ? "!" : "✓" };
    Object.keys(counts).forEach(function (kind) { const button = bar.querySelector('[data-ready-kind="' + kind + '"]'); if (!button) return; const text = String(counts[kind]); const counter = button.querySelector("b"); if (counter.textContent !== text) counter.textContent = text; button.disabled = kind === "science" ? !ready.science : counts[kind] === 0; button.classList.toggle("needs-attention", kind === "science" ? ready.science : counts[kind] > 0); });
  }

  function relationCard(gs, civ) {
    const score = civ.diplomacy ? civ.diplomacy.score : 0, status = relationLabel(civ), canGift = (gs.resources.gold || 0) >= 10 && civ.relation !== "war"; let actions = "";
    if (civ.relation === "war") actions += '<button type="button" data-dip-action="peace" data-civ-id="' + civ.civilizationId + '"' + ((gs.resources.gold || 0) < 20 ? " disabled" : "") + '>🕊 Мир · 20 🪙</button>';
    else if (civ.relation === "ally") actions += '<button type="button" class="secondary" data-dip-action="break" data-civ-id="' + civ.civilizationId + '">Разорвать союз</button>';
    else { if (score >= 30) actions += '<button type="button" data-dip-action="ally" data-civ-id="' + civ.civilizationId + '">🤝 Предложить союз</button>'; actions += '<button type="button" class="danger" data-dip-action="war" data-civ-id="' + civ.civilizationId + '">⚔️ Объявить войну</button>'; }
    if (civ.relation !== "war") actions += '<button type="button" class="secondary" data-dip-action="gift" data-civ-id="' + civ.civilizationId + '"' + (canGift ? "" : " disabled") + '>🎁 Дар · 10 🪙</button>';
    return '<article class="strategy-diplomacy-card ' + relationClass(civ) + '" data-diplomacy-civ="' + civ.civilizationId + '" style="--strategy-civ:' + civ.color + ';--strategy-civ-dark:' + (civ.darkColor || civ.color) + '"><header><span class="strategy-state-seal">' + safeText(civ.symbol || "•") + '</span><div><h3>' + safeText(civ.name) + '</h3><small>' + safeText(civ.diplomacy.temperament || "неизвестный народ") + '</small></div><strong>' + safeText(status) + '</strong></header><div class="strategy-relation-meter"><i style="width:' + Math.max(0, Math.min(100, score + 50)) + '%"></i></div><p>Отношение: ' + (score > 0 ? "+" : "") + score + '. Столица: ' + safeText((civ.cities && civ.cities[0] && civ.cities[0].name) || "неизвестна") + '.</p><div class="strategy-diplomacy-actions">' + actions + '</div></article>';
  }

  function ensureDiplomacyModal() {
    if (diplomacyModal && document.body.contains(diplomacyModal)) return diplomacyModal;
    diplomacyModal = document.getElementById("strategyDiplomacyModal"); if (diplomacyModal) return diplomacyModal;
    diplomacyModal = document.createElement("div"); diplomacyModal.id = "strategyDiplomacyModal"; diplomacyModal.className = "modal"; diplomacyModal.setAttribute("role", "dialog"); diplomacyModal.setAttribute("aria-modal", "true"); diplomacyModal.innerHTML = '<section class="sheet strategy-diplomacy-sheet"><header class="sheet-head"><h2>Дипломатия</h2><button type="button" class="close-btn" data-strategy-dip-close aria-label="Закрыть">×</button></header><div id="strategyDiplomacyContent" class="sheet-scroll"></div></section>'; document.body.appendChild(diplomacyModal);
    diplomacyModal.querySelector("[data-strategy-dip-close]").addEventListener("click", function () { diplomacyModal.classList.remove("show"); }); diplomacyModal.addEventListener("click", handleDiplomacyAction); return diplomacyModal;
  }

  function openDiplomacy(civId) {
    const gs = state(); if (!gs) return; ensureIdentity(gs); const known = (gs.rivals || []).filter(function (civ) { return isKnownCiv(gs, civ); }); const modal = ensureDiplomacyModal(); const content = modal.querySelector("#strategyDiplomacyContent");
    content.innerHTML = known.length ? '<div class="strategy-diplomacy-list">' + known.map(function (civ) { return relationCard(gs, civ); }).join("") + '</div>' : '<div class="inline-note">Другие государства ещё не обнаружены.</div>'; modal.classList.add("show");
    if (civId) { const card = content.querySelector('[data-diplomacy-civ="' + civId + '"]'); if (card) card.scrollIntoView({ block: "nearest" }); }
  }

  function recordDiplomacy(civ, text) { if (!civ.diplomacy) return; const gs = state(); civ.diplomacy.history.unshift("Ход " + ((gs && gs.turn) || 1) + ": " + text); civ.diplomacy.history = civ.diplomacy.history.slice(0, 20); }
  function handleDiplomacyAction(event) {
    const button = event.target.closest("[data-dip-action]"); if (!button || button.disabled) return; const gs = state(); const civ = gs && (gs.rivals || []).find(function (item) { return String(item.civilizationId) === String(button.dataset.civId); }); if (!civ) return; const action = button.dataset.dipAction;
    if (action === "gift") { if ((gs.resources.gold || 0) < 10) return; gs.resources.gold -= 10; civ.diplomacy.score = Math.min(50, civ.diplomacy.score + 14); recordDiplomacy(civ, "Ардена отправила дар."); }
    else if (action === "ally") { if (civ.diplomacy.score < 30 || civ.relation === "war") return; civ.relation = "ally"; civ.met = true; civ.diplomacy.score = Math.max(35, civ.diplomacy.score); recordDiplomacy(civ, "заключён союз с Арденой."); }
    else if (action === "break") { civ.relation = "neutral"; civ.diplomacy.score = Math.min(civ.diplomacy.score, 5); recordDiplomacy(civ, "Ардена расторгла союз."); }
    else if (action === "peace") { if ((gs.resources.gold || 0) < 20) return; gs.resources.gold -= 20; civ.relation = "neutral"; civ.warStartTurn = null; civ.diplomacy.score = -8; recordDiplomacy(civ, "заключён мир за выплату."); }
    else if (action === "war") { if (!window.confirm("Объявить войну государству «" + civ.name + "»?")) return; civ.relation = "war"; civ.met = true; civ.warStartTurn = gs.turn || 1; civ.diplomacy.score = -50; recordDiplomacy(civ, "Ардена объявила войну."); }
    const living = window.EpohiLivingCivilizations;
    if (living) {
      living.migrate(gs);
      if (action === "gift") living.changeRelationship(gs, civ, "trust", 14, "Ардена отправила ценный дар");
      else if (action === "ally") living.changeRelationship(gs, civ, "trust", 8, "Ардена предложила прочный союз");
      else if (action === "break") living.changeRelationship(gs, civ, "grievances", 18, "Ардена расторгла союз");
      else if (action === "peace") living.changeRelationship(gs, civ, "grievances", -20, "Ардена выплатила цену мира");
      else if (action === "war") living.recordAttack(gs, civ, "player");
      living.addWorldEvent(gs, action === "war" ? "war-declared" : "major-diplomatic-event", "Дипломатия: " + button.textContent.trim() + " — " + civ.name + ".", civ);
    }
    const value = debug(); if (value && typeof value.render === "function") value.render(); openDiplomacy(civ.civilizationId); schedule();
  }

  function injectDiplomacyMenu() {
    const menu = document.getElementById("menuModal"), content = document.getElementById("menuContent"); if (!menu || !content || !menu.classList.contains("show") || content.querySelector("[data-strategy-diplomacy]")) return;
    const wrapper = document.createElement("div"); wrapper.className = "menu-actions strategy-diplomacy-menu"; wrapper.innerHTML = '<button type="button" class="wide-btn" data-strategy-diplomacy>🤝 Дипломатия</button>'; wrapper.querySelector("button").addEventListener("click", function () { menu.classList.remove("show"); openDiplomacy(); }); content.insertBefore(wrapper, content.firstChild);
  }

  function decorateContext(gs) {
    const title = document.getElementById("contextTitle"), inspected = document.querySelector("#map .tile.inspect-tile"); if (!title || !gs) return; const existing = title.querySelector(".strategy-faction-chip"); if (!inspected) { if (existing) existing.remove(); return; }
    const x = Number(inspected.dataset.x), y = Number(inspected.dataset.y), rival = rivalAt(gs, x, y), own = ownAt(gs, x, y); if (!rival && !own) { if (existing) existing.remove(); return; }
    const identity = rival ? rival.civ : PLAYER, relation = rival ? relationClass(rival.civ) : "own", key = (rival ? rival.civ.civilizationId : "player") + ":" + relation, label = rival ? (identity.symbol + " · " + identity.name) : (PLAYER.symbol + " · " + PLAYER.name);
    if (existing && existing.dataset.factionKey === key) { if (existing.textContent !== label) existing.textContent = label; existing.style.setProperty("--strategy-civ", identity.color || PLAYER.color); return; }
    if (existing) existing.remove(); const chip = document.createElement(rival ? "button" : "span"); chip.className = "strategy-faction-chip " + relation; chip.dataset.factionKey = key; chip.style.setProperty("--strategy-civ", identity.color || PLAYER.color); chip.textContent = label;
    if (rival) { chip.type = "button"; chip.addEventListener("click", function (event) { event.stopPropagation(); openDiplomacy(rival.civ.civilizationId); }); } title.appendChild(chip);
  }

  function ensureThreeRivalsOption() {
    const select = document.getElementById("rivalCount"); if (!select) return;
    if (!select.querySelector('option[value="3"]')) { const option = document.createElement("option"); option.value = "3"; option.textContent = "3 — большая политика"; select.appendChild(option); }
    const create = document.getElementById("createParty");
    if (create && create.dataset.strategyRivalCapture !== "1") { create.dataset.strategyRivalCapture = "1"; create.addEventListener("click", function () { pendingRivalCount = Math.max(0, Number(select.value) || 0); }, true); }
  }

  function ensurePoiModal() {
    poiModal = document.getElementById("routePoiModal"); if (poiModal) return poiModal;
    poiModal = document.createElement("div"); poiModal.id = "routePoiModal"; poiModal.className = "modal"; poiModal.setAttribute("role", "dialog"); poiModal.setAttribute("aria-modal", "true"); poiModal.innerHTML = '<section class="sheet"><header class="sheet-head"><h2>Находка</h2></header><div class="sheet-scroll" id="routePoiContent"></div></section>'; document.body.appendChild(poiModal); return poiModal;
  }

  function openPoiChoice(gs, unit, located) {
    window.setTimeout(function () {
      if (!unit || !unit.travelOrder || unit.travelOrder.status !== "awaiting-choice") return;
      const modal = ensurePoiModal(), content = modal.querySelector("#routePoiContent"), typeId = located && located.target && located.target.type ? located.target.type : "ruins", type = INTEREST_TYPES[typeId] || { name: typeId === "ruins" ? "Древние руины" : "Находка", icon: "✦" };
      content.innerHTML = '<div class="strategy-poi-arrival"><span>' + safeText(type.icon || "✦") + '</span><div><small>Маршрут завершён</small><h3>' + safeText(type.name) + '</h3><p>Отряд прибыл к цели. Выбери, как использовать находку.</p></div></div><div class="menu-actions"><button type="button" class="wide-btn" data-strategy-poi="study" data-route-poi-choice="study">🔬 Исследовать · +10 науки</button><button type="button" class="wide-btn secondary" data-strategy-poi="salvage" data-route-poi-choice="salvage">🪙 Разобрать · +8 производства и +6 золота</button></div>';
      content.querySelectorAll("[data-strategy-poi]").forEach(function (button) { button.addEventListener("click", function () { if (PATHING.resolvePoiChoice(unit.id, located.x, located.y, button.dataset.strategyPoi)) { modal.classList.remove("show"); schedule(); } }); }); modal.classList.add("show");
    }, 0);
  }

  function ensureAwaitingPoi(gs) {
    const modal = document.getElementById("routePoiModal"); if (modal && modal.classList.contains("show")) return;
    const unit = (gs.units || []).find(function (item) { return item.travelOrder && item.travelOrder.status === "awaiting-choice"; }); if (!unit) return;
    const located = PATHING.locateTarget(gs, unit.travelOrder); if (located) openPoiChoice(gs, unit, located);
  }

  function installWheelZoom() {
    const viewport = document.getElementById("mapViewport"); if (!viewport || viewport.dataset.strategyWheelZoom === "1") return; viewport.dataset.strategyWheelZoom = "1";
    viewport.addEventListener("wheel", function (event) { if (event.ctrlKey || event.metaKey) return; const value = debug(); if (!value || typeof value.getCamera !== "function" || typeof value.setCameraScale !== "function") return; event.preventDefault(); const rect = viewport.getBoundingClientRect(), style = getComputedStyle(viewport), originX = event.clientX - rect.left - (parseFloat(style.paddingLeft) || 0), originY = event.clientY - rect.top - (parseFloat(style.paddingTop) || 0), camera = value.getCamera(), factor = Math.exp(-event.deltaY * 0.0014); value.setCameraScale(camera.scale * factor, originX, originY, false); }, { passive: false });
  }

  function stabilizeCamera() {
    const value = debug(); if (!value || typeof value.getCamera !== "function" || typeof value.getCameraScaleBounds !== "function" || typeof value.applyCamera !== "function") return;
    const camera = value.getCamera(), bounds = value.getCameraScaleBounds();
    if (camera.scale < bounds.min - 0.001 || camera.scale > bounds.max + 0.001) value.applyCamera(false);
  }

  function installCameraResizeClamp() {
    const viewport = document.getElementById("mapViewport"); if (!viewport || cameraResizeObserver || typeof ResizeObserver === "undefined") return;
    let last = "";
    cameraResizeObserver = new ResizeObserver(function () { const key = viewport.clientWidth + "x" + viewport.clientHeight; if (key === last) return; last = key; window.requestAnimationFrame(stabilizeCamera); }); cameraResizeObserver.observe(viewport);
  }

  function refresh() {
    frame = 0; const gs = state(); ensureThreeRivalsOption(); installWheelZoom(); installCameraResizeClamp(); if (!gs) return;
    const identityChanged = ensureIdentity(gs); if (identityChanged) { const value = debug(); if (value && typeof value.render === "function") { value.render(); window.requestAnimationFrame(schedule); return; } }
    refreshReadiness(gs); decorateFactions(gs); decorateContext(gs); injectDiplomacyMenu(); ensureAwaitingPoi(gs); stabilizeCamera();
  }
  function schedule() { if (frame) return; frame = window.requestAnimationFrame(refresh); }

  function install() {
    ensureReadinessBar(); ensureDiplomacyModal(); ensureThreeRivalsOption(); installWheelZoom(); installCameraResizeClamp(); PATHING.setPoiArrivalHandler(openPoiChoice);
    const map = document.getElementById("map"), context = document.getElementById("contextPanel"), turn = document.getElementById("turnValue"), screen = document.getElementById("screenRoot"), menu = document.getElementById("menuModal"), menuContent = document.getElementById("menuContent");
    if (map) new MutationObserver(schedule).observe(map, { childList: true }); if (context) new MutationObserver(schedule).observe(context, { childList: true, subtree: true }); if (turn) new MutationObserver(schedule).observe(turn, { childList: true, characterData: true, subtree: true }); if (screen) new MutationObserver(schedule).observe(screen, { childList: true }); if (menu) new MutationObserver(schedule).observe(menu, { attributes: true, attributeFilter: ["class"] }); if (menuContent) new MutationObserver(schedule).observe(menuContent, { childList: true }); document.addEventListener("click", function () { window.setTimeout(schedule, 0); }, true); window.addEventListener("resize", schedule); schedule();
  }

  window.EpohiStrategyUX = { version: 2, player: PLAYER, cultures: CULTURES, ensureIdentity: ensureIdentity, readiness: readiness, decorateFactions: decorateFactions, relationLabel: relationLabel, openDiplomacy: openDiplomacy, openPoiChoice: openPoiChoice, refresh: refresh };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true }); else install();
})();
