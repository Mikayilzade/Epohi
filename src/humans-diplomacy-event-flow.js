(function () {
  "use strict";

  const VERSION = 1;
  const TRADE_DURATION = 8;
  const TRADE_GOLD_PER_TURN = 2;
  const TRADE_COOLDOWN = 10;
  const activityCursor = { kind: null, signature: "", index: -1 };
  const dedicatedModalTypes = new Set(["capital-fallen", "civilization-founded", "victory", "defeat"]);
  const silentEventTypes = new Set(["diplomatic-proposal"]);
  let lastToastId = "";
  let toastTimer = 0;
  let uiQueued = false;

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

  function eventId(item, index) {
    return String(item && (item.eventId || item.id) || [item && item.turn, item && item.eventType, item && item.text, index || 0].join(":"));
  }

  function ensureState(gs) {
    if (!gs) return null;
    gs.diplomacyEventFlowVersion = VERSION;
    if (!Array.isArray(gs.eventLog)) gs.eventLog = [];
    if (!Array.isArray(gs.history)) gs.history = [];
    if (!Array.isArray(gs.chronicleEventIds)) gs.chronicleEventIds = [];
    if (!Array.isArray(gs.tradeRoutes)) gs.tradeRoutes = [];
    return gs;
  }

  function saveAndRender() {
    const value = debug();
    if (!value) return;
    if (typeof value.save === "function") value.save();
    if (typeof value.render === "function") value.render();
  }

  function addEvent(gs, type, text, civId, position) {
    ensureState(gs);
    gs.eventCounter = (Number(gs.eventCounter) || 0) + 1;
    const item = {
      eventId: "flow-" + gs.eventCounter + "-" + (gs.turn || 1),
      turn: gs.turn || 1,
      phase: "diplomacy-event-flow",
      actorType: civId ? "civilization" : "player",
      actorId: civId || "player",
      eventType: type,
      text: text,
      position: position || null,
      coordinates: position || null
    };
    gs.eventLog.unshift(item);
    gs.eventLog = gs.eventLog.slice(0, 240);
    syncChronicle(gs);
    return item;
  }

  function syncChronicle(gs) {
    ensureState(gs);
    const known = new Set(gs.chronicleEventIds.map(String));
    const additions = [];
    gs.eventLog.slice().reverse().forEach(function (item, index) {
      if (!item || !item.text) return;
      const id = eventId(item, index);
      if (known.has(id)) return;
      known.add(id);
      additions.push({ id: id, line: "Ход " + (item.turn || gs.turn || 1) + ": " + item.text });
    });
    additions.forEach(function (entry) {
      const already = gs.history.some(function (line) { return String(line) === entry.line; });
      if (!already) gs.history.unshift(entry.line);
    });
    gs.history = gs.history.slice(0, 240);
    gs.chronicleEventIds = Array.from(known).slice(-500);
    return additions.length;
  }

  function ensureToast() {
    let node = document.getElementById("flowEventToast");
    if (node) return node;
    node = document.createElement("div");
    node.id = "flowEventToast";
    node.className = "flow-event-toast";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    document.body.appendChild(node);
    return node;
  }

  function dismissToast() {
    window.clearTimeout(toastTimer);
    const node = document.getElementById("flowEventToast");
    if (node) node.classList.remove("show");
  }

  function modalBlockingToast() {
    return ["victoryModal", "stabilityMajorModal", "stabilityDecisionModal"].some(function (id) {
      const modal = document.getElementById(id);
      return modal && modal.classList.contains("show");
    });
  }

  function showTransientEvent(item) {
    if (!item || !item.text || modalBlockingToast()) return;
    const node = ensureToast();
    node.textContent = item.text;
    node.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      node.classList.remove("show");
    }, 1800);
  }

  function syncEvents(gs) {
    ensureState(gs);
    syncChronicle(gs);
    const oldPanel = document.getElementById("feedbackWorldEvents");
    if (oldPanel) {
      oldPanel.classList.remove("show");
      oldPanel.setAttribute("aria-hidden", "true");
    }
    if (modalBlockingToast()) {
      dismissToast();
      return;
    }
    const newest = (gs.eventLog || []).find(function (item) {
      if (!item || !item.text) return false;
      if (dedicatedModalTypes.has(item.eventType) || silentEventTypes.has(item.eventType)) return false;
      return (item.turn || gs.turn || 1) === (gs.turn || 1);
    });
    if (!newest) return;
    const id = eventId(newest, 0);
    if (id === lastToastId) return;
    lastToastId = id;
    showTransientEvent(newest);
  }

  function livingUnits(gs, workerOnly) {
    return (gs && gs.units || []).filter(function (unit) {
      if (Number(unit.hp || 0) <= 0) return false;
      return workerOnly ? unit.type === "worker" : unit.type !== "worker";
    });
  }

  function cities(gs) {
    if (!gs) return [];
    const list = Array.isArray(gs.cities) && gs.cities.length ? gs.cities : (gs.city ? [gs.city] : []);
    return list.filter(function (city) { return Number(city.hp || 0) > 0; });
  }

  function hasUnitAction(unit) {
    return Number(unit.moves || 0) > 0 && !unit.acted;
  }

  function hasCityAction(city) {
    return !city.queue;
  }

  function activityData(gs, kind) {
    let items = [];
    let ready = function () { return false; };
    if (kind === "units") { items = livingUnits(gs, false); ready = hasUnitAction; }
    else if (kind === "workers") { items = livingUnits(gs, true); ready = hasUnitAction; }
    else if (kind === "cities") { items = cities(gs); ready = hasCityAction; }
    const ordered = items.filter(ready).concat(items.filter(function (item) { return !ready(item); }));
    return {
      items: ordered,
      signature: ordered.map(function (item) { return String(item.id) + ":" + (ready(item) ? "1" : "0"); }).join("|")
    };
  }

  function tileAt(x, y) {
    return document.querySelector('#map .tile[data-x="' + x + '"][data-y="' + y + '"]');
  }

  function focusUnit(unit) {
    const value = debug();
    if (!value || !unit) return;
    if (typeof value.centerCameraOnTile === "function") value.centerCameraOnTile(unit.x, unit.y, true);
    const tile = tileAt(unit.x, unit.y);
    if (!tile) return;
    const piece = tile.querySelector(".piece.unit") || tile;
    piece.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    if (window.EpohiContextReviewCleanup && typeof window.EpohiContextReviewCleanup.selectStackUnit === "function") {
      window.EpohiContextReviewCleanup.selectStackUnit(unit.id);
    }
  }

  function focusCity(city) {
    const value = debug();
    if (!value || !city) return;
    if (typeof value.setActiveCity === "function") value.setActiveCity(city.id);
    if (typeof value.centerCameraOnTile === "function") value.centerCameraOnTile(city.x, city.y, true);
    const tile = tileAt(city.x, city.y);
    if (!tile) return;
    const piece = tile.querySelector(".piece.city") || tile.querySelector(".city-pop") || tile;
    piece.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  }

  function resetActivityCursor(kind) {
    if (!kind || activityCursor.kind !== kind) {
      activityCursor.kind = kind || null;
      activityCursor.signature = "";
      activityCursor.index = -1;
    }
  }

  function handleActivity(kind) {
    const gs = state();
    if (!gs) return;
    if (kind === "science") {
      resetActivityCursor("science");
      const science = document.getElementById("scienceBtn");
      if (science) science.click();
      return;
    }
    const data = activityData(gs, kind);
    if (!data.items.length) return;
    if (activityCursor.kind !== kind || activityCursor.signature !== data.signature) {
      activityCursor.kind = kind;
      activityCursor.signature = data.signature;
      activityCursor.index = 0;
    } else {
      activityCursor.index = (activityCursor.index + 1) % data.items.length;
    }
    const target = data.items[activityCursor.index];
    if (kind === "cities") focusCity(target);
    else focusUnit(target);
  }

  function knownTech(holder, id) {
    if (!holder) return false;
    return [holder.researched, holder.technologies].some(function (list) {
      return Array.isArray(list) && list.indexOf(id) >= 0;
    });
  }

  function activeTradeRoute(gs, civId) {
    return (gs.tradeRoutes || []).find(function (route) {
      return String(route.civId) === String(civId) && route.status === "active" && Number(route.remainingTurns || 0) > 0;
    }) || null;
  }

  function tradeStatus(gs, civ) {
    ensureState(gs);
    if (!civ || civ.defeated) return { allowed: false, reason: "государство больше не существует" };
    if (!civ.met) return { allowed: false, reason: "государство ещё не установило контакт с Арденой" };
    if (civ.relation === "war") return { allowed: false, reason: "во время войны торговый путь невозможен" };
    if (!knownTech(gs, "trade")) return { allowed: false, reason: "Ардена ещё не изучила технологию «Торговля»" };
    if (!knownTech(civ, "trade")) return { allowed: false, reason: civ.name + " ещё не изучил технологию «Торговля»" };
    const route = activeTradeRoute(gs, civ.civilizationId);
    if (route) return { allowed: false, active: route, reason: "путь уже действует ещё " + route.remainingTurns + " ход." };
    if (Number(civ.nextTradeProposalTurn || 0) > Number(gs.turn || 1)) return { allowed: false, reason: "новое предложение возможно с хода " + civ.nextTradeProposalTurn };
    const diplomacy = civ.diplomacy || {};
    const trust = Number(diplomacy.trust || 0);
    const grievances = Number(diplomacy.grievances || 0);
    const score = Number(diplomacy.score || 0);
    if (trust < 35) return { allowed: false, reason: "нужно доверие 35; сейчас " + trust };
    if (grievances >= 30) return { allowed: false, reason: "обиды должны быть ниже 30; сейчас " + grievances };
    if (score < 0) return { allowed: false, reason: "общее отношение должно быть не ниже нейтрального; сейчас " + score };
    return { allowed: true, reason: "+" + TRADE_GOLD_PER_TURN + " золота за ход обеим сторонам в течение " + TRADE_DURATION + " ходов; +7 доверия" };
  }

  function civById(gs, id) {
    return (gs.rivals || []).find(function (civ) { return String(civ.civilizationId) === String(id); }) || null;
  }

  function proposeTrade(gs, civ) {
    const status = tradeStatus(gs, civ);
    if (!status.allowed) return false;
    const route = {
      id: "trade-player-" + (gs.turn || 1) + "-" + civ.civilizationId,
      civId: civ.civilizationId,
      civName: civ.name,
      startedTurn: gs.turn || 1,
      remainingTurns: TRADE_DURATION,
      goldPerTurn: TRADE_GOLD_PER_TURN,
      payments: 0,
      status: "active",
      proposedBy: "player"
    };
    gs.tradeRoutes.push(route);
    civ.nextTradeProposalTurn = (gs.turn || 1) + TRADE_DURATION + TRADE_COOLDOWN;
    const living = window.EpohiLivingCivilizations;
    if (living && typeof living.changeRelationship === "function") {
      living.changeRelationship(gs, civ, "trust", 7, "Ардена предложила взаимовыгодный торговый путь");
    }
    addEvent(gs, "trade-route-opened", "Ардена открыла торговый путь с " + civ.name + ": +" + TRADE_GOLD_PER_TURN + " золота за ход в течение " + TRADE_DURATION + " ходов.", civ.civilizationId);
    saveAndRender();
    const strategy = window.EpohiStrategyUX;
    if (strategy && typeof strategy.openDiplomacy === "function") strategy.openDiplomacy(civ.civilizationId);
    scheduleUi();
    return true;
  }

  function proposalEffects(item) {
    const accept = {
      trade: "+2 золота за ход в течение 8 ходов; +7 доверия",
      gift: "+12 золота; +5 доверия",
      alliance: "заключить союз; +12 доверия",
      peace: "завершить войну; обиды −20",
      threat: "−10 золота; обиды −12",
      jointWar: "вступить в войну против цели; +10 доверия"
    };
    return {
      accept: accept[item && item.type] || "принять условия предложения",
      decline: "доверие −5"
    };
  }

  function decorateProposals(gs) {
    const panel = document.getElementById("livingProposals");
    if (!panel) return;
    panel.querySelectorAll("article").forEach(function (article) {
      const button = article.querySelector("[data-proposal]");
      if (!button) return;
      const item = (gs.diplomaticProposals || []).find(function (proposal) { return String(proposal.id) === String(button.dataset.proposal); });
      if (!item) return;
      const effects = proposalEffects(item);
      const yes = article.querySelector('[data-answer="yes"]');
      const no = article.querySelector('[data-answer="no"]');
      if (yes) yes.innerHTML = 'Принять<small>' + escapeText(effects.accept) + '</small>';
      if (no) no.innerHTML = 'Отклонить<small>' + escapeText(effects.decline) + '</small>';
      let note = article.querySelector("[data-proposal-consequences]");
      if (!note) {
        note = document.createElement("div");
        note.dataset.proposalConsequences = "1";
        note.className = "flow-proposal-consequences";
        const text = article.querySelector("p");
        if (text) text.insertAdjacentElement("afterend", note);
        else article.prepend(note);
      }
      note.textContent = "Принять: " + effects.accept + ". Отклонить: " + effects.decline + ".";
    });
  }

  function actionExplanation(action) {
    return {
      gift: "−10 золота · +14 доверия",
      ally: "статус «Союз» · +8 доверия",
      break: "статус «Нейтральные» · обиды +18",
      peace: "−20 золота · завершение войны · обиды −20",
      war: "начало войны · обиды +12 · страх +4"
    }[action] || "";
  }

  function decorateDiplomacy(gs) {
    const content = document.getElementById("strategyDiplomacyContent");
    if (!content) return;
    content.querySelectorAll("[data-diplomacy-civ]").forEach(function (card) {
      const civ = civById(gs, card.dataset.diplomacyCiv);
      if (!civ) return;
      const actions = card.querySelector(".strategy-diplomacy-actions");
      if (!actions) return;
      actions.querySelectorAll("[data-dip-action]").forEach(function (button) {
        const action = button.dataset.dipAction;
        const explanation = actionExplanation(action);
        if (!explanation) return;
        const label = button.childNodes.length ? String(button.childNodes[0].textContent || button.textContent).trim() : button.textContent.trim();
        button.innerHTML = escapeText(label) + "<small>" + escapeText(explanation) + "</small>";
      });
      let trade = actions.querySelector("[data-player-trade]");
      let note = card.querySelector("[data-player-trade-note]");
      const status = tradeStatus(gs, civ);
      if (status.allowed) {
        if (!trade) {
          trade = document.createElement("button");
          trade.type = "button";
          trade.dataset.playerTrade = civ.civilizationId;
          actions.appendChild(trade);
        }
        trade.disabled = false;
        trade.innerHTML = "⚖️ Предложить торговый путь<small>+2 золота/ход · 8 ходов · +7 доверия</small>";
        if (note) note.remove();
      } else {
        if (trade) trade.remove();
        if (!note) {
          note = document.createElement("div");
          note.dataset.playerTradeNote = "1";
          note.className = "flow-trade-note";
          actions.insertAdjacentElement("beforebegin", note);
        }
        note.textContent = status.active ? "⚖️ " + status.reason : "Торговый путь недоступен: " + status.reason + ".";
      }
    });
  }

  function openChronicle() {
    dismissToast();
    const oldPanel = document.getElementById("feedbackWorldEvents");
    if (oldPanel) oldPanel.classList.remove("show");
    if (window.EpohiHumansJourneyUI && typeof window.EpohiHumansJourneyUI.open === "function") {
      window.EpohiHumansJourneyUI.open();
      return true;
    }
    const menu = document.getElementById("menuBtn");
    if (menu) menu.click();
    return false;
  }

  function patchWorldEventEntry() {
    const button = document.querySelector("[data-world-events-open]");
    if (!button) return;
    button.textContent = "📜 Летопись";
    button.setAttribute("aria-label", "Открыть летопись событий");
  }

  function scheduleUi() {
    if (uiQueued) return;
    uiQueued = true;
    window.requestAnimationFrame(function () {
      uiQueued = false;
      const gs = state();
      if (!gs) return;
      ensureState(gs);
      decorateDiplomacy(gs);
      decorateProposals(gs);
      patchWorldEventEntry();
      syncEvents(gs);
    });
  }

  function interceptClicks(event) {
    const activity = event.target && event.target.closest && event.target.closest("#strategyReadiness [data-ready-kind]");
    if (activity && !activity.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      handleActivity(activity.dataset.readyKind);
      scheduleUi();
      return;
    }
    const trade = event.target && event.target.closest && event.target.closest("[data-player-trade]");
    if (trade) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const gs = state();
      const civ = gs && civById(gs, trade.dataset.playerTrade);
      if (gs && civ) proposeTrade(gs, civ);
      return;
    }
    const chronicle = event.target && event.target.closest && event.target.closest("[data-world-events-open]");
    if (chronicle) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openChronicle();
      return;
    }
    if (event.target && event.target.closest && event.target.closest("[data-dip-action], [data-proposal], #endTurnBtn")) {
      window.setTimeout(scheduleUi, 0);
    }
  }

  function injectStyles() {
    if (document.getElementById("diplomacyEventFlowStyles")) return;
    const style = document.createElement("style");
    style.id = "diplomacyEventFlowStyles";
    style.textContent = [
      "#feedbackWorldEvents{display:none!important;opacity:0!important;pointer-events:none!important;backdrop-filter:none!important}",
      ".flow-event-toast{position:fixed;left:50%;bottom:calc(76px + env(safe-area-inset-bottom));z-index:118;max-width:min(520px,calc(100vw - 28px));padding:10px 14px;border-radius:13px;background:rgba(26,48,34,.94);border:1px solid rgba(226,190,103,.48);box-shadow:0 8px 24px rgba(0,0,0,.32);color:#f5edda;font-size:13px;font-weight:750;text-align:center;opacity:0;transform:translate(-50%,10px);pointer-events:none;transition:opacity .16s ease,transform .16s ease}.flow-event-toast.show{opacity:1;transform:translate(-50%,0)}",
      ".living-proposals article button small,.strategy-diplomacy-actions button small{display:block;margin-top:3px;font-size:8px;line-height:1.18;color:rgba(255,255,255,.8)}",
      ".flow-proposal-consequences{margin:6px 0;padding:7px 8px;border-radius:9px;background:rgba(75,94,68,.12);color:#596152;font-size:10px;line-height:1.3}",
      ".flow-trade-note{margin:7px 10px;padding:7px 9px;border-radius:9px;background:rgba(105,91,61,.1);color:#65604f;font-size:10px;line-height:1.3}",
      "@media(max-width:520px){.flow-event-toast{bottom:calc(68px + env(safe-area-inset-bottom));font-size:12px}.strategy-diplomacy-actions button{min-height:45px}.flow-proposal-consequences,.flow-trade-note{font-size:9px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function installHooks() {
    const living = window.EpohiLivingCivilizations;
    if (living && !living.diplomacyEventFlowWrapped && typeof living.renderUI === "function") {
      living.diplomacyEventFlowWrapped = true;
      const original = living.renderUI;
      living.renderUI = function (gs) {
        const result = original.apply(this, arguments);
        window.setTimeout(scheduleUi, 0);
        return result;
      };
    }
    const stability = window.EpohiCombatWorldStability;
    if (stability && !stability.diplomacyEventFlowWrapped && typeof stability.render === "function") {
      stability.diplomacyEventFlowWrapped = true;
      const original = stability.render;
      stability.render = function () {
        const result = original.apply(this, arguments);
        window.setTimeout(scheduleUi, 0);
        return result;
      };
    }
  }

  function install() {
    injectStyles();
    ensureToast();
    installHooks();
    window.addEventListener("click", interceptClicks, true);
    document.addEventListener("click", function () { window.setTimeout(scheduleUi, 0); });
    const turn = document.getElementById("turnValue");
    if (turn) new MutationObserver(scheduleUi).observe(turn, { childList: true, characterData: true, subtree: true });
    ["victoryModal", "stabilityMajorModal", "stabilityDecisionModal", "strategyDiplomacyModal", "livingProposals"].forEach(function (id) {
      const node = document.getElementById(id);
      if (node) new MutationObserver(scheduleUi).observe(node, { attributes: true, childList: true, subtree: true, attributeFilter: ["class"] });
    });
    scheduleUi();
  }

  window.EpohiDiplomacyEventFlow = {
    version: VERSION,
    ensureState: ensureState,
    syncChronicle: syncChronicle,
    syncEvents: syncEvents,
    handleActivity: handleActivity,
    activityData: activityData,
    tradeStatus: tradeStatus,
    proposeTrade: proposeTrade,
    proposalEffects: proposalEffects,
    decorateDiplomacy: decorateDiplomacy,
    decorateProposals: decorateProposals,
    dismissToast: dismissToast,
    openChronicle: openChronicle,
    refresh: scheduleUi
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
