(function () {
  "use strict";

  if (!window.EpohiData || !window.EpohiUtils) {
    throw new Error("EpohiData and EpohiUtils are required before humans-player-feedback.js");
  }

  const VERSION = 1;
  const TRADE_DURATION = 8;
  const TRADE_GOLD_PER_TURN = 2;
  const TRADE_COOLDOWN = 10;
  const MAJOR_EVENT_TYPES = new Set([
    "city-founded", "rival-city-founded", "city-growth", "rival-city-growth",
    "city-captured", "war-declared", "rival-war-declared", "joint-war-declared",
    "peace-made", "technology-completed", "allied-battle", "allied-war-battle",
    "rival-battle", "route-combat-win", "barbarian-camp-destroyed",
    "trade-route-opened", "trade-route-ended", "treasury-purchase",
    "mercenary-contract-ended", "major-diplomatic-event"
  ]);
  const MERCENARIES = {
    scout: { label: "Разведчики вольных земель", type: "scout", cost: 56, unlockTurn: 1, description: "Постоянный разведчик без очереди города." },
    worker: { label: "Рабочая артель", type: "worker", cost: 60, unlockTurn: 1, description: "Постоянный рабочий прибывает к столице." },
    warrior: { label: "Отряд наёмников", type: "warrior", cost: 76, unlockTurn: 7, description: "Постоянный воин сразу поступает на службу Ардене." },
    settler: { label: "Караван переселенцев", type: "settler", cost: 72, unlockTurn: 18, tech: "trade", description: "Дорогой способ получить поселенца без городской очереди." }
  };

  let treasuryModal = null;
  let eventTicker = null;
  let closedEventSignature = "";
  let contextCleaning = false;
  let wikiPatching = false;
  const originalLiving = {};
  const originalPathing = {};

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function state() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function escapeText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toast(text, duration) {
    const node = document.getElementById("toast");
    if (!node) return;
    node.textContent = text;
    node.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(function () {
      node.classList.remove("show");
    }, duration || 2600);
  }

  function hasPlayerTech(gs, techId) {
    return !techId || (gs.researched || []).indexOf(techId) >= 0;
  }

  function hasCivTech(civ, techId) {
    return !techId || (civ.technologies || []).indexOf(techId) >= 0;
  }

  function ensureState(gs) {
    if (!gs) return null;
    gs.playerFeedbackVersion = VERSION;
    if (!Array.isArray(gs.tradeRoutes)) gs.tradeRoutes = [];
    if (!Array.isArray(gs.treasuryPurchases)) gs.treasuryPurchases = [];
    if (!Number.isFinite(gs.nextTreasuryEventId)) gs.nextTreasuryEventId = 1;
    (gs.rivals || []).forEach(function (civ) {
      if (!Number.isFinite(civ.nextTradeProposalTurn)) civ.nextTradeProposalTurn = 0;
      if (!Number.isFinite(civ.nextContingentTurn)) civ.nextContingentTurn = 0;
      (civ.cities || []).forEach(function (city) {
        if (!Number.isFinite(city.food)) city.food = 0;
        if (!Number.isFinite(city.production)) city.production = 0;
        if (!Number.isFinite(city.population)) city.population = 1;
      });
    });
    return gs;
  }

  function addEvent(gs, type, text, position, actorId) {
    ensureState(gs);
    gs.eventCounter = (gs.eventCounter || 0) + 1;
    const item = {
      eventId: "feedback-" + gs.eventCounter + "-" + (gs.nextTreasuryEventId++),
      turn: gs.turn || 1,
      phase: "player-feedback",
      actorType: actorId ? "civilization" : "player",
      actorId: actorId || "player",
      eventType: type,
      text: text,
      coordinates: position || null,
      position: position || null,
      data: {}
    };
    if (!Array.isArray(gs.eventLog)) gs.eventLog = [];
    gs.eventLog.unshift(item);
    gs.eventLog = gs.eventLog.slice(0, 240);
    if (!Array.isArray(gs.history)) gs.history = [];
    gs.history.unshift("Ход " + (gs.turn || 1) + ": " + text);
    gs.history = gs.history.slice(0, 80);
    return item;
  }

  function activeTradeRoute(gs, civId) {
    ensureState(gs);
    return gs.tradeRoutes.find(function (route) {
      return route.civId === civId && route.status === "active" && route.remainingTurns > 0;
    }) || null;
  }

  function canTrade(gs, civ) {
    ensureState(gs);
    if (!civ || civ.defeated || !civ.met || civ.relation === "war") return false;
    if (!hasPlayerTech(gs, "trade") || !hasCivTech(civ, "trade")) return false;
    if (activeTradeRoute(gs, civ.civilizationId)) return false;
    if ((civ.nextTradeProposalTurn || 0) > (gs.turn || 1)) return false;
    const diplomacy = civ.diplomacy || {};
    const score = Number(diplomacy.score) || 0;
    const trust = Number(diplomacy.trust) || 0;
    const grievances = Number(diplomacy.grievances) || 0;
    return score >= 0 && trust >= 35 && grievances < 30;
  }

  function proposalById(gs, id) {
    return (gs.diplomaticProposals || []).find(function (item) { return String(item.id) === String(id); }) || null;
  }

  function civById(gs, id) {
    return (gs.rivals || []).find(function (civ) { return String(civ.civilizationId) === String(id); }) || null;
  }

  function readableRelationship(gs, civ, amount, reason) {
    if (!window.EpohiLivingCivilizations) return;
    window.EpohiLivingCivilizations.changeRelationship(gs, civ, "trust", amount, reason);
  }

  function resolveTradeProposal(gs, proposalId, accepted) {
    ensureState(gs);
    const item = proposalById(gs, proposalId);
    if (!item || item.type !== "trade" || item.status !== "pending") return false;
    const civ = civById(gs, item.civId);
    if (!civ) return false;

    if (!accepted) {
      item.status = "declined";
      item.resolvedTurn = gs.turn;
      civ.nextTradeProposalTurn = (gs.turn || 1) + TRADE_COOLDOWN;
      readableRelationship(gs, civ, -5, "Ардена отклонила торговый договор");
      addEvent(gs, "major-diplomatic-event", "Ардена отклонила торговый договор с " + civ.name + ".", null, civ.civilizationId);
      return true;
    }

    if (!canTrade(gs, civ)) {
      item.status = "expired";
      item.resolvedTurn = gs.turn;
      item.reason = "нет необходимых технологий или доверия";
      toast("Торговый путь пока невозможен: обеим сторонам нужна технология «Торговля» и нейтральные отношения.", 3600);
      return false;
    }

    item.status = "accepted";
    item.resolvedTurn = gs.turn;
    const route = {
      id: "trade-" + (gs.turn || 1) + "-" + civ.civilizationId,
      civId: civ.civilizationId,
      civName: civ.name,
      startedTurn: gs.turn || 1,
      remainingTurns: TRADE_DURATION,
      goldPerTurn: TRADE_GOLD_PER_TURN,
      payments: 0,
      status: "active"
    };
    gs.tradeRoutes.push(route);
    civ.nextTradeProposalTurn = (gs.turn || 1) + TRADE_DURATION + TRADE_COOLDOWN;
    readableRelationship(gs, civ, 7, "открыт взаимовыгодный торговый путь");
    if (civ.diplomacy && Array.isArray(civ.diplomacy.history)) {
      civ.diplomacy.history[0] = "Ход " + (gs.turn || 1) + ": открыт торговый путь на " + TRADE_DURATION + " ходов (+" + TRADE_GOLD_PER_TURN + " золота за ход, +7 доверия).";
    }
    addEvent(gs, "trade-route-opened", "Открыт торговый путь с " + civ.name + ": +" + TRADE_GOLD_PER_TURN + " золота за ход в течение " + TRADE_DURATION + " ходов.", null, civ.civilizationId);
    toast("Торговый путь открыт на " + TRADE_DURATION + " ходов.");
    return true;
  }

  function pruneTradeProposals(gs) {
    ensureState(gs);
    (gs.diplomaticProposals || []).forEach(function (item) {
      if (item.type !== "trade" || item.status !== "pending") return;
      const civ = civById(gs, item.civId);
      if (!canTrade(gs, civ)) {
        item.status = "expired";
        item.resolvedTurn = gs.turn;
        item.reason = "торговля недоступна";
      }
    });
  }

  function processTradeRoutes(gs) {
    ensureState(gs);
    if (gs.playerFeedbackTradeTurn === gs.turn) return;
    gs.playerFeedbackTradeTurn = gs.turn;
    gs.tradeRoutes.forEach(function (route) {
      if (route.status !== "active" || route.remainingTurns <= 0) return;
      const civ = civById(gs, route.civId);
      gs.resources.gold = (gs.resources.gold || 0) + route.goldPerTurn;
      if (civ && civ.resources) civ.resources.gold = (civ.resources.gold || 0) + route.goldPerTurn;
      route.remainingTurns -= 1;
      route.payments += 1;
      if (route.remainingTurns <= 0) {
        route.status = "completed";
        route.endedTurn = gs.turn;
        addEvent(gs, "trade-route-ended", "Торговый договор с " + route.civName + " завершён после " + route.payments + " выплат.", null, route.civId);
      }
    });
  }

  function processRivalGrowth(gs) {
    ensureState(gs);
    const growthNeed = window.EpohiUtils.growthNeed;
    (gs.rivals || []).forEach(function (civ) {
      if (civ.defeated) return;
      (civ.cities || []).forEach(function (city) {
        if (city.population >= 10) return;
        const need = growthNeed(city.population);
        if (city.food < need) return;
        city.food -= need;
        city.population += 1;
        addEvent(gs, "rival-city-growth", civ.name + ": город " + city.name + " вырос до населения " + city.population + ".", { x: city.x, y: city.y }, civ.civilizationId);
      });
    });
  }

  function processContracts(gs) {
    ensureState(gs);
    const expired = (gs.units || []).filter(function (unit) {
      return unit.contractUntil && gs.turn >= unit.contractUntil;
    });
    if (!expired.length) return;
    expired.forEach(function (unit) {
      addEvent(gs, "mercenary-contract-ended", "Срок службы отряда «" + (unit.name || "союзный контингент") + "» завершён.", { x: unit.x, y: unit.y }, null);
    });
    gs.units = (gs.units || []).filter(function (unit) { return expired.indexOf(unit) < 0; });
  }

  function processTurn(gs) {
    ensureState(gs);
    processTradeRoutes(gs);
    processRivalGrowth(gs);
    processContracts(gs);
  }

  function installLivingHooks() {
    const living = window.EpohiLivingCivilizations;
    if (!living || living.playerFeedbackWrapped) return;
    living.playerFeedbackWrapped = true;
    originalLiving.migrate = living.migrate;
    originalLiving.processTurn = living.processTurn;
    originalLiving.renderUI = living.renderUI;

    living.migrate = function (gs) {
      const result = originalLiving.migrate(gs);
      ensureState(gs);
      return result;
    };

    living.processTurn = function (gs, helpers) {
      ensureState(gs);
      const result = originalLiving.processTurn(gs, helpers || {});
      pruneTradeProposals(gs);
      processTurn(gs);
      return result;
    };

    living.renderUI = function (gs) {
      ensureState(gs);
      originalLiving.renderUI(gs);
      renderDiplomacyDetails(gs);
      renderWorldEvents(gs);
      patchGoldIncome(gs);
    };
  }

  function renderDiplomacyDetails(gs) {
    document.querySelectorAll("[data-diplomacy-civ]").forEach(function (card) {
      const civ = civById(gs, card.dataset.diplomacyCiv);
      if (!civ) return;
      const actions = card.querySelector(".strategy-diplomacy-actions");
      if (actions) {
        const gift = actions.querySelector('[data-dip-action="gift"]');
        if (gift) gift.innerHTML = "🎁 Отправить дар<br><small>−10 золота · +14 доверия</small>";
      }
      let routeBox = card.querySelector(".feedback-trade-status");
      const route = activeTradeRoute(gs, civ.civilizationId);
      if (route) {
        if (!routeBox) {
          routeBox = document.createElement("div");
          routeBox.className = "feedback-trade-status";
          const relation = card.querySelector(".living-relation-details");
          (relation || card.querySelector(".strategy-diplomacy-actions")).before(routeBox);
        }
        routeBox.textContent = "⚖️ Торговый путь: +" + route.goldPerTurn + " золота за ход · осталось " + route.remainingTurns + " ходов";
      } else if (routeBox) {
        routeBox.remove();
      }
    });
  }

  function handleGift(button, event) {
    const gs = state();
    if (!gs || (gs.resources.gold || 0) < 10) return;
    const civ = civById(gs, button.dataset.civId);
    if (!civ || civ.relation === "war") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    gs.resources.gold -= 10;
    readableRelationship(gs, civ, 14, "Ардена отправила ценный дар");
    if (civ.diplomacy && Array.isArray(civ.diplomacy.history)) {
      civ.diplomacy.history[0] = "Ход " + (gs.turn || 1) + ": Ардена отправила дар: −10 золота, +14 доверия.";
    }
    addEvent(gs, "major-diplomatic-event", "Ардена отправила дар государству " + civ.name + ": −10 золота, +14 доверия.", null, civ.civilizationId);
    const value = debug();
    if (value && typeof value.render === "function") value.render();
    window.setTimeout(function () {
      if (window.EpohiStrategyUX) window.EpohiStrategyUX.openDiplomacy(civ.civilizationId);
    }, 0);
  }

  function handleProposal(button, event) {
    const gs = state();
    if (!gs) return;
    const item = proposalById(gs, button.dataset.proposal);
    if (!item || item.type !== "trade") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    resolveTradeProposal(gs, item.id, button.dataset.answer === "yes");
    const value = debug();
    if (value && typeof value.render === "function") value.render();
  }

  function selectedPlayerUnit(gs) {
    const value = debug();
    const id = value && typeof value.getSelectedUnitId === "function" ? value.getSelectedUnitId() : null;
    return (gs.units || []).find(function (unit) { return String(unit.id) === String(id); }) || null;
  }

  function playerUnitAt(gs, x, y) {
    return (gs.units || []).some(function (unit) { return unit.hp > 0 && unit.x === x && unit.y === y; });
  }

  function rivalAt(gs, x, y) {
    for (const civ of (gs.rivals || [])) {
      const unit = (civ.units || []).find(function (item) { return item.hp > 0 && item.x === x && item.y === y; });
      if (unit) return { civ: civ, unit: unit };
      const city = (civ.cities || []).find(function (item) { return item.hp > 0 && item.x === x && item.y === y; });
      if (city) return { civ: civ, city: city };
    }
    return null;
  }

  function inspectedRival(gs) {
    const tile = document.querySelector("#map .tile.inspect-tile");
    if (!tile || !gs) return null;
    return rivalAt(gs, Number(tile.dataset.x), Number(tile.dataset.y));
  }

  function cleanContextCommands() {
    if (contextCleaning) return;
    const gs = state();
    const rival = inspectedRival(gs);
    if (!rival) return;
    const actions = document.getElementById("contextActions");
    if (!actions) return;
    contextCleaning = true;
    Array.from(actions.querySelectorAll("button")).forEach(function (button) {
      const contextAction = button.dataset.contextAction || "";
      const allowed = contextAction === "diplomacy" || contextAction === "attack" ||
        button.textContent.indexOf("Дипломатия") >= 0 ||
        (rival.civ.relation === "war" && button.textContent.indexOf("Атака") >= 0);
      if (!allowed) button.remove();
    });
    contextCleaning = false;
  }

  function blockStaleContextAction(event) {
    const actions = event.target.closest && event.target.closest("#contextActions");
    if (!actions) return;
    const gs = state();
    const rival = inspectedRival(gs);
    if (!rival) return;
    const button = event.target.closest("button");
    if (!button) return;
    const contextAction = button.dataset.contextAction || "";
    const allowed = contextAction === "diplomacy" || contextAction === "attack" ||
      button.textContent.indexOf("Дипломатия") >= 0 ||
      (rival.civ.relation === "war" && button.textContent.indexOf("Атака") >= 0);
    if (!allowed) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      toast("Сначала выбери свой отряд. Чужому или нейтральному юниту нельзя отдавать приказы.");
    }
  }

  function ensureImmediatePoi(gs, unit) {
    if (!gs || !unit || !unit.travelOrder || unit.travelOrder.type !== "poi") return false;
    if (unit.travelOrder.status === "awaiting-choice") return false;
    const located = window.EpohiHumansPathing.locateTarget(gs, unit.travelOrder);
    if (!located || unit.x !== located.x || unit.y !== located.y) return false;
    unit.travelOrder.status = "awaiting-choice";
    unit.moves = 0;
    unit.acted = true;
    if (window.EpohiStrategyUX && typeof window.EpohiStrategyUX.openPoiChoice === "function") {
      window.EpohiStrategyUX.openPoiChoice(gs, unit, located);
    }
    return true;
  }

  function installPathingHooks() {
    const pathing = window.EpohiHumansPathing;
    if (!pathing || pathing.playerFeedbackWrapped) return;
    pathing.playerFeedbackWrapped = true;
    originalPathing.assignTravelOrder = pathing.assignTravelOrder;
    originalPathing.processUnit = pathing.processUnit;
    originalPathing.processOrders = pathing.processOrders;

    pathing.assignTravelOrder = function (unitId, destination) {
      const result = originalPathing.assignTravelOrder(unitId, destination);
      const gs = state();
      const unit = gs && (gs.units || []).find(function (item) { return String(item.id) === String(unitId); });
      if (result) ensureImmediatePoi(gs, unit);
      return result;
    };

    pathing.processUnit = function (gs, unit, options) {
      const result = originalPathing.processUnit(gs, unit, options);
      return ensureImmediatePoi(gs, unit) || result;
    };

    pathing.processOrders = function (gs, options) {
      let result = originalPathing.processOrders(gs, options);
      (gs && gs.units || []).forEach(function (unit) {
        result = ensureImmediatePoi(gs, unit) || result;
      });
      return result;
    };
  }

  function unitSpawn(gs) {
    const city = gs.city || (gs.cities || [])[0];
    return city ? { x: city.x, y: city.y } : { x: 0, y: 0 };
  }

  function createPlayerUnit(gs, type, options) {
    const def = window.EpohiData.UNIT_DEFS[type];
    if (!def) return null;
    const spawn = unitSpawn(gs);
    const id = "u" + (gs.nextUnitId++);
    const number = Number(String(id).replace(/\D/g, "")) || gs.nextUnitId;
    const unit = {
      id: id,
      type: type,
      x: spawn.x,
      y: spawn.y,
      moves: 0,
      acted: true,
      hp: def.maxHealth,
      maxHp: def.maxHealth,
      name: (options && options.name) || (def.name + " «Казна-" + number + "»")
    };
    if (options && options.contractUntil) {
      unit.contractUntil = options.contractUntil;
      unit.contractSource = options.contractSource || null;
      unit.hiredContingent = true;
    }
    gs.units.push(unit);
    return unit;
  }

  function marketOffers(gs) {
    ensureState(gs);
    const rotation = [
      ["scout", "worker", "warrior"],
      ["worker", "warrior", "settler"],
      ["scout", "warrior", "settler"]
    ];
    const cycle = Math.floor(((gs.turn || 1) - 1) / 6);
    return rotation[cycle % rotation.length].map(function (id) { return MERCENARIES[id]; });
  }

  function buyMercenary(gs, type) {
    ensureState(gs);
    const offer = MERCENARIES[type];
    if (!offer || marketOffers(gs).indexOf(offer) < 0) return false;
    if ((gs.turn || 1) < offer.unlockTurn || !hasPlayerTech(gs, offer.tech)) return false;
    if ((gs.resources.gold || 0) < offer.cost) return false;
    gs.resources.gold -= offer.cost;
    const unit = createPlayerUnit(gs, offer.type, { name: offer.label });
    gs.treasuryPurchases.push({ turn: gs.turn, kind: "mercenary", type: type, cost: offer.cost, unitId: unit.id });
    addEvent(gs, "treasury-purchase", "Казна наняла отряд «" + offer.label + "» за " + offer.cost + " золота.", { x: unit.x, y: unit.y }, null);
    toast("Нанят новый отряд: " + offer.label + ".");
    return true;
  }

  function alliedContingents(gs) {
    ensureState(gs);
    const result = [];
    (gs.rivals || []).forEach(function (civ) {
      if (civ.relation !== "ally" || civ.defeated || (civ.nextContingentTurn || 0) > gs.turn) return;
      const diplomacy = civ.diplomacy || {};
      if ((Number(diplomacy.trust) || 0) < 60) return;
      ["scout", "warrior", "worker"].forEach(function (type) {
        const def = window.EpohiData.UNIT_DEFS[type];
        const matching = (civ.units || []).filter(function (unit) { return unit.type === type && unit.hp > 0; });
        const threatened = (gs.barbarians || []).some(function (enemy) { return (civ.cities || []).some(function (city) { return window.EpohiUtils.chebyshev(enemy.x, enemy.y, city.x, city.y) <= 5; }); });
        const exists = matching.length > 0 && !(type === "warrior" && (matching.length <= 1 || threatened));
        if (!exists || !hasCivTech(civ, def.tech)) return;
        const base = type === "warrior" ? 38 : (type === "worker" ? 30 : 27);
        result.push({ civ: civ, type: type, cost: base, turns: 10 });
      });
    });
    return result;
  }

  function hireContingent(gs, civId, type) {
    const offer = alliedContingents(gs).find(function (item) {
      return item.civ.civilizationId === civId && item.type === type;
    });
    if (!offer || (gs.resources.gold || 0) < offer.cost) return false;
    gs.resources.gold -= offer.cost;
    const def = window.EpohiData.UNIT_DEFS[type];
    const unit = createPlayerUnit(gs, type, {
      name: def.name + " — контингент " + offer.civ.name,
      contractUntil: (gs.turn || 1) + offer.turns,
      contractSource: offer.civ.name
    });
    offer.civ.nextContingentTurn = (gs.turn || 1) + 8;
    readableRelationship(gs, offer.civ, 2, "Ардена честно оплатила союзный контингент");
    gs.treasuryPurchases.push({ turn: gs.turn, kind: "contingent", type: type, cost: offer.cost, unitId: unit.id, civId: civId });
    addEvent(gs, "treasury-purchase", offer.civ.name + " передал Ардене отряд на " + offer.turns + " ходов за " + offer.cost + " золота.", { x: unit.x, y: unit.y }, offer.civ.civilizationId);
    toast("Союзный контингент прибыл на " + offer.turns + " ходов.");
    return true;
  }

  function healSelected(gs) {
    const unit = selectedPlayerUnit(gs);
    if (!unit || unit.hp >= unit.maxHp || (gs.resources.gold || 0) < 12) return false;
    gs.resources.gold -= 12;
    unit.hp = Math.min(unit.maxHp, unit.hp + 35);
    addEvent(gs, "treasury-purchase", "Оплачено лечение отряда «" + (unit.name || window.EpohiData.UNIT_DEFS[unit.type].name) + "»: −12 золота.", { x: unit.x, y: unit.y }, null);
    toast("Отряд получил лечение: +35 здоровья.");
    return true;
  }

  function fundProduction(gs) {
    const value = debug();
    const selectedId = value && value.getSelectedCityId ? value.getSelectedCityId() : null;
    const city = (gs.cities || []).find(function (item) { return String(item.id) === String(selectedId); }) || null;
    if (!city || (gs.resources.gold || 0) < 20) return false;
    gs.resources.gold -= 20;
    city.production = (city.production || 0) + 12;
    addEvent(gs, "treasury-purchase", "Казна вложила 20 золота в мастерские " + city.name + ": +12 локального производства.", { x: city.x, y: city.y }, null);
    toast("Город получил +12 локального производства.");
    return true;
  }

  function buyMap(gs) {
    if ((gs.resources.gold || 0) < 24) return false;
    const size = Number(gs.mapSize) || gs.map.length;
    let best = null;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const tile = gs.map[y][x];
        if (!tile || tile.revealed || !window.EpohiUtils.passableTile(tile)) continue;
        let frontier = 0;
        window.EpohiUtils.neighborsOf(x, y, size).forEach(function (point) {
          if (gs.map[point.y][point.x].revealed) frontier += 1;
        });
        if (!best || frontier > best.frontier) best = { x: x, y: y, frontier: frontier };
      }
    }
    if (!best) return false;
    gs.resources.gold -= 24;
    for (let y = Math.max(0, best.y - 2); y <= Math.min(size - 1, best.y + 2); y += 1) {
      for (let x = Math.max(0, best.x - 2); x <= Math.min(size - 1, best.x + 2); x += 1) {
        gs.map[y][x].revealed = true;
      }
    }
    addEvent(gs, "treasury-purchase", "Куплены карты путешественников: открыт новый участок мира.", { x: best.x, y: best.y }, null);
    const value = debug();
    if (value && typeof value.centerCameraOnTile === "function") value.centerCameraOnTile(best.x, best.y, true);
    toast("Карта путешественников открыла новые земли.");
    return true;
  }

  function ensureTreasuryModal() {
    if (treasuryModal && document.body.contains(treasuryModal)) return treasuryModal;
    treasuryModal = document.getElementById("feedbackTreasuryModal");
    if (treasuryModal) return treasuryModal;
    treasuryModal = document.createElement("div");
    treasuryModal.id = "feedbackTreasuryModal";
    treasuryModal.className = "modal";
    treasuryModal.setAttribute("role", "dialog");
    treasuryModal.setAttribute("aria-modal", "true");
    treasuryModal.innerHTML = '<section class="sheet feedback-treasury-sheet"><header class="sheet-head"><h2>Казна</h2><button type="button" class="close-btn" data-feedback-treasury-close aria-label="Закрыть">×</button></header><div id="feedbackTreasuryContent" class="sheet-scroll"></div></section>';
    document.body.appendChild(treasuryModal);
    treasuryModal.querySelector("[data-feedback-treasury-close]").addEventListener("click", function () { treasuryModal.classList.remove("show"); });
    treasuryModal.addEventListener("click", function (event) {
      const button = event.target.closest("[data-treasury-action]");
      if (!button || button.disabled) return;
      const gs = state();
      if (!gs) return;
      let changed = false;
      if (button.dataset.treasuryAction === "mercenary") changed = buyMercenary(gs, button.dataset.type);
      else if (button.dataset.treasuryAction === "contingent") changed = hireContingent(gs, button.dataset.civId, button.dataset.type);
      else if (button.dataset.treasuryAction === "heal") changed = healSelected(gs);
      else if (button.dataset.treasuryAction === "production") changed = fundProduction(gs);
      else if (button.dataset.treasuryAction === "map") changed = buyMap(gs);
      if (changed) {
        const value = debug();
        if (value && typeof value.render === "function") value.render();
        renderTreasury(gs);
      }
    });
    return treasuryModal;
  }

  function offerCard(gs, offer) {
    const lockedTurn = (gs.turn || 1) < offer.unlockTurn;
    const lockedTech = !hasPlayerTech(gs, offer.tech);
    const affordable = (gs.resources.gold || 0) >= offer.cost;
    let reason = "";
    if (lockedTurn) reason = "Доступно с хода " + offer.unlockTurn;
    else if (lockedTech) reason = "Нужна технология «" + window.EpohiData.TECHS[offer.tech].name + "»";
    return '<article class="game-card"><div><h3>🪙 ' + escapeText(offer.label) + '</h3><p>' + escapeText(offer.description) + (reason ? '<br><strong>' + escapeText(reason) + '</strong>' : '') + '</p></div><button class="card-button" data-treasury-action="mercenary" data-type="' + offer.type + '" ' + ((!affordable || reason) ? 'disabled' : '') + '>' + offer.cost + ' 🪙</button></article>';
  }

  function renderTreasury(gs) {
    ensureState(gs);
    const modal = ensureTreasuryModal();
    const content = modal.querySelector("#feedbackTreasuryContent");
    const selected = selectedPlayerUnit(gs);
    const routes = gs.tradeRoutes.filter(function (route) { return route.status === "active"; });
    const tradeHtml = routes.length ? routes.map(function (route) {
      return '<div class="feedback-route-row"><strong>⚖️ ' + escapeText(route.civName) + '</strong><span>+' + route.goldPerTurn + ' 🪙/ход · осталось ' + route.remainingTurns + '</span></div>';
    }).join("") : '<div class="inline-note">Активных торговых путей нет. Для договора обеим сторонам нужна технология «Торговля».</div>';
    const mercenaries = marketOffers(gs).map(function (offer) { return offerCard(gs, offer); }).join("");
    const contingents = alliedContingents(gs);
    const contingentHtml = contingents.length ? contingents.map(function (offer) {
      const def = window.EpohiData.UNIT_DEFS[offer.type];
      return '<article class="game-card"><div><h3>🤝 ' + escapeText(offer.civ.name) + ': ' + escapeText(def.name) + ' · ' + offer.turns + ' ходов</h3><p>Временный союзный отряд. После найма оставшийся срок виден в карточке отряда.</p></div><button class="card-button" data-treasury-action="contingent" data-civ-id="' + offer.civ.civilizationId + '" data-type="' + offer.type + '" ' + ((gs.resources.gold || 0) < offer.cost ? 'disabled' : '') + '>' + offer.cost + ' 🪙</button></article>';
    }).join("") : '<div class="inline-note">Нет доступных союзных контингентов. Нужен союз, доверие 60+ и подходящий отряд у союзника.</div>';
    const value = debug();
    const selectedId = value && value.getSelectedCityId ? value.getSelectedCityId() : null;
    const city = (gs.cities || []).find(function (item) { return String(item.id) === String(selectedId); }) || null;
    content.innerHTML = '<div class="feedback-treasury-balance"><small>Доступно</small><strong>' + Math.floor(gs.resources.gold || 0) + ' 🪙</strong></div>' +
      '<div class="section-title">Торговые пути</div>' + tradeHtml +
      '<div class="section-title">Рынок наёмников</div><div class="card-list">' + mercenaries + '</div>' +
      '<div class="inline-note">Ассортимент меняется каждые 6 ходов. Покупка не занимает очередь города.</div>' +
      '<div class="section-title">Союзные контингенты</div><div class="card-list">' + contingentHtml + '</div>' +
      '<div class="section-title">Государственные расходы</div><div class="card-list">' +
      '<article class="game-card"><div><h3>❤️ Лечение выбранного отряда</h3><p>' + (selected ? escapeText(selected.name || window.EpohiData.UNIT_DEFS[selected.type].name) + ': ' + Math.ceil(selected.hp) + '/' + selected.maxHp : 'Сначала выбери свой отряд.') + '</p></div><button class="card-button" data-treasury-action="heal" ' + ((!selected || selected.hp >= selected.maxHp || (gs.resources.gold || 0) < 12) ? 'disabled' : '') + '>12 🪙</button></article>' +
      '<article class="game-card"><div><h3>🔨 Финансировать мастерские' + (city ? ': ' + escapeText(city.name) : '') + '</h3><p>' + (city ? escapeText(city.name) + ' получает +12 локального производства.' : 'Сначала выбери город.') + '</p></div><button class="card-button" data-treasury-action="production" ' + ((!city || (gs.resources.gold || 0) < 20) ? 'disabled' : '') + '>20 🪙</button></article>' +
      '<article class="game-card"><div><h3>🗺️ Купить карты путешественников</h3><p>Открывает участок 5×5 у границы разведанных земель.</p></div><button class="card-button" data-treasury-action="map" ' + ((gs.resources.gold || 0) < 24 ? 'disabled' : '') + '>24 🪙</button></article>' +
      '</div>';
  }

  function openTreasury() {
    const gs = state();
    if (!gs) return false;
    renderTreasury(gs);
    ensureTreasuryModal().classList.add("show");
    return true;
  }

  function injectTreasuryEntrances() {
    const gold = document.getElementById("goldValue");
    const resource = gold && gold.closest(".resource");
    if (resource && resource.dataset.treasuryEntry !== "1") {
      resource.dataset.treasuryEntry = "1";
      resource.setAttribute("role", "button");
      resource.setAttribute("tabindex", "0");
      resource.setAttribute("title", "Открыть казну");
      resource.addEventListener("click", openTreasury);
      resource.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openTreasury(); }
      });
    }
    const menu = document.getElementById("menuModal");
    const content = document.getElementById("menuContent");
    if (menu && content && menu.classList.contains("show") && !content.querySelector("[data-feedback-treasury]")) {
      const wrapper = document.createElement("div");
      wrapper.className = "menu-actions feedback-treasury-menu";
      wrapper.innerHTML = '<button type="button" class="wide-btn" data-feedback-treasury>🪙 Казна</button>';
      wrapper.querySelector("button").addEventListener("click", function () {
        menu.classList.remove("show");
        openTreasury();
      });
      content.insertBefore(wrapper, content.firstChild);
    }
  }

  function patchGoldIncome(gs) {
    const active = gs.tradeRoutes.filter(function (route) { return route.status === "active"; });
    const bonus = active.reduce(function (sum, route) { return sum + route.goldPerTurn; }, 0);
    const node = document.getElementById("goldIncome");
    if (!node || !bonus) return;
    const base = node.textContent.replace(/ · торговля \+\d+/, "");
    node.textContent = base + " · торговля +" + bonus;
  }

  function ensureEventTicker() {
    if (eventTicker && document.body.contains(eventTicker)) return eventTicker;
    eventTicker = document.getElementById("feedbackWorldEvents");
    if (eventTicker) return eventTicker;
    eventTicker = document.createElement("aside");
    eventTicker.id = "feedbackWorldEvents";
    eventTicker.className = "feedback-world-events";
    eventTicker.setAttribute("aria-live", "polite");
    document.getElementById("gameApp").appendChild(eventTicker);
    eventTicker.addEventListener("click", function (event) {
      const close = event.target.closest("[data-feedback-events-close]");
      if (close) {
        closedEventSignature = eventTicker.dataset.signature || "";
        eventTicker.classList.remove("show");
        return;
      }
      const item = event.target.closest("[data-event-x]");
      const value = debug();
      if (item && value && typeof value.centerCameraOnTile === "function") {
        value.centerCameraOnTile(Number(item.dataset.eventX), Number(item.dataset.eventY), true);
      }
    });
    return eventTicker;
  }

  function eventId(item) {
    return item.eventId || item.id || [item.turn, item.eventType, item.text].join(":");
  }

  function renderWorldEvents(gs) {
    const panel = ensureEventTicker();
    const events = (gs.eventLog || []).filter(function (item) {
      return MAJOR_EVENT_TYPES.has(item.eventType) && item.turn >= (gs.turn || 1) - 1;
    }).slice(0, 3);
    const signature = events.map(eventId).join("|");
    panel.dataset.signature = signature;
    if (!events.length || signature === closedEventSignature) {
      panel.classList.remove("show");
      return;
    }
    panel.innerHTML = '<header><strong>События мира</strong><button type="button" data-feedback-events-close aria-label="Скрыть">×</button></header>' + events.map(function (item) {
      const point = item.position || item.coordinates;
      return '<button type="button" class="feedback-world-event" ' + (point ? 'data-event-x="' + point.x + '" data-event-y="' + point.y + '"' : 'disabled') + '><small>Ход ' + item.turn + '</small><span>' + escapeText(item.text) + '</span></button>';
    }).join("");
    panel.classList.add("show");
  }

  function reopenWorldEvents(gs) {
    closedEventSignature = "";
    renderWorldEvents(gs || state());
  }

  function patchMovementExplanation() {
    const title = document.getElementById("contextTitle");
    const text = document.getElementById("contextText");
    if (!title || !text) return;
    const gs = state();
    const tile = document.querySelector("#map .tile.inspect-tile");
    if (!gs || !tile || title.textContent.indexOf("Клетка") < 0 || text.textContent.indexOf("Стоимость пути") >= 0) return;
    const x = Number(tile.dataset.x), y = Number(tile.dataset.y);
    const data = gs.map[y] && gs.map[y][x];
    if (!data) return;
    const rule = window.EpohiData.TERRAIN[data.terrain];
    text.textContent += rule.passable === false
      ? " · Стоимость движения: непроходимо — " + rule.impassableReason + ". Защита: " + rule.defenseModifier + "%."
      : " · Стоимость движения: " + rule.movementCost + " очк. Защита: " + (rule.defenseModifier >= 0 ? "+" : "") + rule.defenseModifier + "%.";
  }

  function patchWiki() {
    if (wikiPatching) return;
    const content = document.getElementById("wikiContent");
    if (!content || !document.getElementById("wikiModal").classList.contains("show") || content.querySelector("[data-feedback-movement-wiki]")) return;
    wikiPatching = true;
    const details = document.createElement("details");
    details.className = "wiki-details";
    details.dataset.feedbackMovementWiki = "1";
    details.innerHTML = '<summary>Маршруты и стоимость перемещения</summary><div class="wiki-details-body"><div class="wiki-callout"><strong>Взвешенные маршруты.</strong> Равнина и пустошь: 1 очко; лес, холмы и мёртвые земли: 2; болото: 3; вода непроходима. Защита: лес +20%, холмы +25%, болото +10%, мёртвые земли −10%. Маршрут минимизирует суммарную стоимость и копит очки между ходами.</div></div>';
    content.insertBefore(details, content.firstChild);
    wikiPatching = false;
  }

  function continueAfterOutcome(gs) {
    ensureState(gs);
    gs.continueAfterOutcome = true;
    gs.victory = false;
    gs.defeat = false;
    if (gs.outcome) gs.outcome.status = "active";
    const modal = document.getElementById("victoryModal");
    if (modal) modal.classList.remove("show");
    toast("Свободная игра продолжается. Победа сохранена в летописи.");
  }

  function handleOutcomeButtons(event) {
    const goals = event.target.closest && event.target.closest("#outcomeGoalsBtn");
    const map = event.target.closest && event.target.closest("#outcomeMapBtn");
    if (!goals && !map) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const gs = state();
    if (!gs) return;
    if (goals) {
      document.getElementById("victoryModal").classList.remove("show");
      if (window.EpohiHumansOutcomes) window.EpohiHumansOutcomes.openGoals();
    } else {
      continueAfterOutcome(gs);
    }
  }

  function preparePostOutcomeTurn(event) {
    const button = event.target.closest && event.target.closest("#endTurnBtn");
    const gs = state();
    if (!button || !gs || !gs.continueAfterOutcome) return;
    gs.victory = false;
    gs.defeat = false;
    if (gs.outcome) gs.outcome.status = "active";
  }

  function hideRepeatedOutcome() {
    const gs = state();
    const modal = document.getElementById("victoryModal");
    const goals = document.getElementById("humansGoalsModal");
    const suppress = gs && (gs.continueAfterOutcome || (goals && goals.classList.contains("show")));
    if (suppress && modal && modal.classList.contains("show")) modal.classList.remove("show");
  }

  function injectStyles() {
    if (document.getElementById("feedbackPlayerStyles")) return;
    const style = document.createElement("style");
    style.id = "feedbackPlayerStyles";
    style.textContent = [
      ".resource[data-treasury-entry='1']{cursor:pointer;outline:none}.resource[data-treasury-entry='1']:focus-visible{box-shadow:0 0 0 3px rgba(232,188,83,.42)}",
      ".feedback-treasury-sheet{max-width:760px}.feedback-treasury-balance{display:flex;align-items:end;justify-content:space-between;padding:12px 14px;margin-bottom:10px;border-radius:14px;background:linear-gradient(135deg,rgba(91,119,78,.18),rgba(197,155,72,.18))}.feedback-treasury-balance small{color:#657064}.feedback-treasury-balance strong{font:700 28px Georgia,serif;color:#4c563f}",
      ".feedback-route-row{display:flex;justify-content:space-between;gap:10px;padding:9px 11px;margin:6px 0;border-radius:10px;background:rgba(255,255,255,.38);font-size:11px}.feedback-trade-status{margin:0 10px 9px;padding:7px 9px;border-radius:9px;background:rgba(91,140,78,.13);color:#426246;font-size:10px;font-weight:800}",
      ".feedback-world-events{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:calc(82px + env(safe-area-inset-bottom));z-index:92;width:min(390px,calc(100vw - 24px));display:none;padding:8px;border:1px solid rgba(218,179,94,.45);border-radius:14px;background:rgba(25,43,31,.94);box-shadow:0 10px 28px rgba(0,0,0,.38);backdrop-filter:blur(4px)}.feedback-world-events.show{display:block}.feedback-world-events header{display:flex;justify-content:space-between;align-items:center;padding:2px 4px 6px;color:#f3dfaa}.feedback-world-events header button{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.08);color:#f5e6ba}.feedback-world-event{width:100%;display:grid;grid-template-columns:48px 1fr;gap:8px;text-align:left;padding:7px 8px;margin-top:4px;border-radius:9px;background:rgba(255,255,255,.07);color:#edf0e8}.feedback-world-event small{color:#d8b96f}.feedback-world-event:disabled{opacity:1}",
      ".strategy-diplomacy-actions button small{display:block;margin-top:2px;color:rgba(255,255,255,.78);font-size:8px}.piece.ai-city .strategy-faction-marker,.piece.city .strategy-faction-marker{right:auto;left:-7px;top:-7px}.feedback-treasury-menu{margin-bottom:8px}",
      "@media(max-width:720px){.feedback-world-events{bottom:calc(74px + env(safe-area-inset-bottom));width:calc(100vw - 20px);left:10px}.feedback-route-row{font-size:10px}.feedback-treasury-balance strong{font-size:23px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function refresh() {
    installLivingHooks();
    installPathingHooks();
    injectTreasuryEntrances();
    cleanContextCommands();
    patchMovementExplanation();
    patchWiki();
    hideRepeatedOutcome();
    const gs = state();
    if (gs) {
      ensureState(gs);
      renderWorldEvents(gs);
      patchGoldIncome(gs);
    }
  }

  function install() {
    injectStyles();
    ensureTreasuryModal();
    ensureEventTicker();
    installLivingHooks();
    installPathingHooks();
    document.addEventListener("click", function (event) {
      const proposal = event.target.closest && event.target.closest("[data-proposal]");
      if (proposal) handleProposal(proposal, event);
      const gift = event.target.closest && event.target.closest('[data-dip-action="gift"]');
      if (gift) handleGift(gift, event);
      blockStaleContextAction(event);
      handleOutcomeButtons(event);
      preparePostOutcomeTurn(event);
      window.setTimeout(refresh, 0);
    }, true);
    const context = document.getElementById("contextPanel");
    if (context) new MutationObserver(refresh).observe(context, { childList: true, subtree: true, characterData: true });
    const menu = document.getElementById("menuModal");
    if (menu) new MutationObserver(refresh).observe(menu, { attributes: true, attributeFilter: ["class"] });
    const menuContent = document.getElementById("menuContent");
    if (menuContent) new MutationObserver(refresh).observe(menuContent, { childList: true });
    const wiki = document.getElementById("wikiModal");
    if (wiki) new MutationObserver(refresh).observe(wiki, { attributes: true, attributeFilter: ["class"] });
    const wikiContent = document.getElementById("wikiContent");
    if (wikiContent) new MutationObserver(refresh).observe(wikiContent, { childList: true });
    const victory = document.getElementById("victoryModal");
    if (victory) new MutationObserver(refresh).observe(victory, { attributes: true, attributeFilter: ["class"] });
    const map = document.getElementById("map");
    if (map) new MutationObserver(refresh).observe(map, { childList: true, subtree: true });
    refresh();
  }

  window.EpohiPlayerFeedback = {
    version: VERSION,
    ensureState: ensureState,
    canTrade: canTrade,
    activeTradeRoute: activeTradeRoute,
    resolveTradeProposal: resolveTradeProposal,
    processTurn: processTurn,
    processRivalGrowth: processRivalGrowth,
    processContracts: processContracts,
    marketOffers: marketOffers,
    buyMercenary: buyMercenary,
    alliedContingents: alliedContingents,
    hireContingent: hireContingent,
    healSelected: healSelected,
    fundProduction: fundProduction,
    buyMap: buyMap,
    openTreasury: openTreasury,
    ensureImmediatePoi: ensureImmediatePoi,
    cleanContextCommands: cleanContextCommands,
    renderWorldEvents: renderWorldEvents,
    reopenWorldEvents: reopenWorldEvents,
    continueAfterOutcome: continueAfterOutcome,
    refresh: refresh
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
