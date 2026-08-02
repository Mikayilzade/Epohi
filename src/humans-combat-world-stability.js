(function () {
  "use strict";

  const VERSION = 1;
  const MAJOR = new Set(["capital-fallen", "civilization-founded", "victory", "major-diplomatic-event", "trade-route-opened"]);
  let lastMajorId = null;

  function debug() { return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null; }
  function state() { const value = debug(); return value && value.state; }
  function escape(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]; }); }

  function migrate(gs) {
    if (!gs) return null;
    gs.combatWorldStabilityVersion = VERSION;
    if (!Number.isFinite(gs.cityCapacity)) gs.cityCapacity = Math.max(4, (gs.cities || []).length);
    if (!Number.isFinite(gs.cityCapacityPurchases)) gs.cityCapacityPurchases = 0;
    if (!Array.isArray(gs.urgentDecisions)) gs.urgentDecisions = [];
    if (!Array.isArray(gs.majorEventsSeen)) gs.majorEventsSeen = [];
    if (typeof gs.worldEventsOpen !== "boolean") gs.worldEventsOpen = true;
    (gs.units || []).forEach(function (unit) {
      if (unit.travelOrder && !Number.isFinite(unit.travelOrder.movementBank)) unit.travelOrder.movementBank = 0;
    });
    (gs.rivals || []).forEach(function (civ) {
      if (typeof civ.defeated !== "boolean") civ.defeated = false;
      if (!Number.isFinite(civ.nextJointWarProposalTurn)) civ.nextJointWarProposalTurn = 0;
    });
    return gs;
  }

  function addEvent(gs, type, text, coordinates) {
    gs.eventCounter = (gs.eventCounter || 0) + 1;
    const item = { eventId:"stability-" + gs.eventCounter, turn:gs.turn || 1, eventType:type, text:text, coordinates:coordinates || null, phase:"world" };
    gs.eventLog = [item].concat(gs.eventLog || []).slice(0, 240);
    gs.history = ["Ход " + (gs.turn || 1) + ": " + text].concat(gs.history || []).slice(0, 120);
    return item;
  }

  function resolveFactionDefeat(gs, defeated, captor) {
    migrate(gs);
    if (!defeated || defeated.defeated) return false;
    const cities = (defeated.cities || []).slice();
    const forces = (defeated.units || []).length;
    defeated.defeated = true;
    defeated.defeatedTurn = gs.turn;
    defeated.defeatedBy = captor && (captor.civilizationId || captor.id || "player");
    defeated.relation = "defeated";
    defeated.units = [];
    if (!captor || captor === gs || captor.id === "player") {
      gs.cities = gs.cities || [];
      cities.forEach(function (city) { city.capital = false; city.hp = city.maxHp || 150; city.formerCivilizationId = defeated.civilizationId; if (!gs.cities.some(function (item) { return item.id === city.id; })) gs.cities.push(city); });
    } else {
      captor.cities = captor.cities || [];
      cities.forEach(function (city) { city.capital = false; city.hp = city.maxHp || 150; city.formerCivilizationId = defeated.civilizationId; if (!captor.cities.some(function (item) { return item.id === city.id; })) captor.cities.push(city); });
    }
    defeated.cities = [];
    (gs.map || []).forEach(function (row, y) { row.forEach(function (tile, x) { if (tile.owner !== defeated.civilizationId) return; if (captor && captor.civilizationId) tile.owner=captor.civilizationId; else { const nearest=cities.slice().sort(function(a,b){return Math.max(Math.abs(a.x-x),Math.abs(a.y-y))-Math.max(Math.abs(b.x-x),Math.abs(b.y-y));})[0]; tile.owner=nearest?nearest.id:null; } }); });
    (gs.rivals || []).forEach(function (civ) { if (civ.diplomacy) delete civ.diplomacy[defeated.civilizationId]; if(civ.jointWars)delete civ.jointWars[defeated.civilizationId]; });
    (gs.diplomaticProposals || []).forEach(function (proposal) { if (proposal.status === "pending" && (proposal.civId === defeated.civilizationId || proposal.targetId === defeated.civilizationId)) { proposal.status = "cancelled"; proposal.resolvedTurn=gs.turn; proposal.reason="государство разгромлено"; } });
    (gs.tradeRoutes || []).forEach(function (route) { if (route.civId === defeated.civilizationId && route.status === "active") route.status = "cancelled"; });
    defeated.nextTradeProposalTurn=Infinity; defeated.nextContingentTurn=Infinity; defeated.nextJointWarProposalTurn=Infinity; defeated.allianceCooldownUntil=Infinity;
    const victorName = captor && captor.name ? captor.name : "Ардена";
    addEvent(gs, "capital-fallen", "Пала столица государства «" + defeated.name + "». Победитель: " + victorName + "; передано городов: " + cities.length + "; сложили оружие отрядов: " + forces + ".", cities[0] && { x:cities[0].x, y:cities[0].y });
    render();
    return true;
  }

  function createUrgentDecision(gs, input) {
    migrate(gs);
    const item = Object.assign({ id:"decision-" + (gs.turn || 1) + "-" + (gs.urgentDecisions.length + 1), createdTurn:gs.turn || 1, expiresTurn:gs.turn || 1, status:"pending", title:"Требуется решение", options:[] }, input || {});
    if (!item.cityId && gs.cities && gs.cities[0]) item.cityId = gs.cities[0].id;
    gs.urgentDecisions.push(item); render(); return item;
  }

  function resolveUrgentDecision(gs, id, optionId) {
    const item = (gs.urgentDecisions || []).find(function (decision) { return decision.id === id && decision.status === "pending"; });
    if (!item) return false;
    const option = (item.options || []).find(function (candidate) { return candidate.id === optionId; });
    if (!option) return false;
    const city = (gs.cities || []).find(function (candidate) { return candidate.id === item.cityId; });
    if (city && option.production) city.production = (city.production || 0) + option.production;
    if (option.gold) gs.resources.gold = (gs.resources.gold || 0) + option.gold;
    if (option.science) gs.resources.science = (gs.resources.science || 0) + option.science;
    item.status = "resolved"; item.resolvedTurn = gs.turn; item.chosenOption = option.id;
    addEvent(gs, "urgent-decision-resolved", item.title + ": " + option.label + (city ? " (" + city.name + ")" : "") + ".", city && { x:city.x, y:city.y });
    render(); return true;
  }

  function expireUrgentDecisions(gs) {
    (gs.urgentDecisions || []).forEach(function (item) { if (item.status === "pending" && (gs.turn || 1) > item.expiresTurn) { item.status = "expired"; if(item.journeyEventId&&gs.humanJourney){gs.humanJourney.queuedEvents=(gs.humanJourney.queuedEvents||[]).filter(function(id){return id!==item.journeyEventId;});if(!(gs.humanJourney.resolvedEvents||[]).includes(item.journeyEventId))gs.humanJourney.resolvedEvents.push(item.journeyEventId);} addEvent(gs, "urgent-decision-expired", item.title + ": возможность упущена."); } });
  }

  function administrationCost(gs) { return 60 + (gs.cityCapacityPurchases || 0) * 40; }
  function expandAdministration(gs) {
    migrate(gs); const cost = administrationCost(gs); if ((gs.resources.gold || 0) < cost) return false;
    gs.resources.gold -= cost; gs.cityCapacity += 1; gs.cityCapacityPurchases += 1;
    addEvent(gs, "treasury-purchase", "Административная ёмкость расширена до " + gs.cityCapacity + " за " + cost + " золота."); render(); return true;
  }

  function proposalValid(gs, proposal) {
    const proposer = (gs.rivals || []).find(function (civ) { return civ.civilizationId === proposal.civId; });
    const target = (gs.rivals || []).find(function (civ) { return civ.civilizationId === proposal.targetId; });
    if (!proposer || proposer.defeated || (target && target.defeated)) return false;
    if (proposal.type !== "jointWar") return true;
    if (!target || proposer.diplomacy && proposer.diplomacy[target.civilizationId] === "war" || target.relation === "war") return false;
    return !(gs.diplomaticProposals || []).some(function (other) { return other !== proposal && other.type === "jointWar" && other.status === "pending" && other.civId === proposal.civId && other.targetId === proposal.targetId; });
  }

  function ensureUi() {
    if (!document.getElementById("stabilityMajorModal")) document.body.insertAdjacentHTML("beforeend", '<div id="stabilityMajorModal" class="modal" role="dialog" aria-modal="true"><section class="sheet"><header class="sheet-head"><h2 id="stabilityMajorTitle">Событие мира</h2><button class="close-btn" data-stability-close="major" aria-label="Закрыть">×</button></header><div id="stabilityMajorContent" class="sheet-scroll"></div></section></div><button id="urgentDecisionIndicator" class="wide-btn stability-decision-indicator" type="button">⚠ Требуется решение</button><div id="stabilityDecisionModal" class="modal" role="dialog" aria-modal="true"><section class="sheet"><header class="sheet-head"><h2>Требуется решение</h2><button class="close-btn" data-stability-close="decision" aria-label="Закрыть">×</button></header><div id="stabilityDecisionContent" class="sheet-scroll"></div></section></div>');
  }

  function render() {
    const gs = migrate(state()); if (!gs) return; ensureUi();
    const pending = gs.urgentDecisions.find(function (item) { return item.status === "pending"; });
    const indicator = document.getElementById("urgentDecisionIndicator"); indicator.classList.toggle("show", Boolean(pending));
    if (pending) {
      const city = (gs.cities || []).find(function (item) { return item.id === pending.cityId; });
      document.getElementById("stabilityDecisionContent").innerHTML = '<div class="wiki-callout"><strong>' + escape(pending.title) + '</strong><br>' + escape(pending.text || "") + '<br><small>Город: ' + escape(city ? city.name : "утрачен") + ' · решение до конца хода</small></div><div class="card-list">' + (pending.options || []).map(function (option) { return '<button class="wide-btn" data-decision-id="' + escape(pending.id) + '" data-option-id="' + escape(option.id) + '">' + escape(option.label) + '</button>'; }).join("") + '</div>';
      if (!pending.presented) { pending.presented = true; document.getElementById("stabilityDecisionModal").classList.add("show"); }
    }
    const cityContent = document.getElementById("cityContent");
    if (cityContent && !cityContent.querySelector("[data-administration-status]")) cityContent.insertAdjacentHTML("afterbegin", '<div class="inline-note" data-administration-status>Административная ёмкость: <strong>' + (gs.cities || []).length + '/' + gs.cityCapacity + '</strong></div>');
    const treasury = document.getElementById("feedbackTreasuryContent");
    if (treasury && !treasury.querySelector("[data-expand-administration]")) treasury.insertAdjacentHTML("beforeend", '<article class="game-card"><div><h3>🏛️ Расширить администрацию</h3><p>Города: ' + (gs.cities || []).length + '/' + gs.cityCapacity + '. Повышает ёмкость на один.</p></div><button class="card-button" data-expand-administration ' + ((gs.resources.gold || 0) < administrationCost(gs) ? 'disabled' : '') + '>' + administrationCost(gs) + ' 🪙</button></article>');
    const menuContent = document.getElementById("menuContent");
    if (menuContent && !menuContent.querySelector("[data-world-events-open]")) menuContent.insertAdjacentHTML("afterbegin", '<button class="wide-btn secondary" data-world-events-open>🌍 События мира</button>');
    (gs.diplomaticProposals || []).forEach(function (proposal) { if (proposal.status === "pending" && !proposalValid(gs, proposal)) proposal.status = "cancelled"; });
    const event = (gs.eventLog || []).find(function (item) { return MAJOR.has(item.eventType) && gs.majorEventsSeen.indexOf(item.eventId) < 0; });
    if (event && event.eventId !== lastMajorId) { lastMajorId = event.eventId; gs.majorEventsSeen.push(event.eventId); document.getElementById("stabilityMajorContent").textContent = event.text; document.getElementById("stabilityMajorModal").classList.add("show"); }
  }

  function install() {
    ensureUi();
    document.addEventListener("click", function (event) {
      const close = event.target.closest && event.target.closest("[data-stability-close]");
      if (close) document.getElementById(close.dataset.stabilityClose === "major" ? "stabilityMajorModal" : "stabilityDecisionModal").classList.remove("show");
      if (event.target.closest && event.target.closest("#urgentDecisionIndicator")) document.getElementById("stabilityDecisionModal").classList.add("show");
      const choice = event.target.closest && event.target.closest("[data-decision-id]"); if (choice) { const gs=state(), item=(gs.urgentDecisions||[]).find(function(entry){return entry.id===choice.dataset.decisionId;}); if(item&&item.journeyEventId&&window.EpohiHumansJourney)window.EpohiHumansJourney.resolveEvent(item.journeyEventId,choice.dataset.optionId);else resolveUrgentDecision(gs,choice.dataset.decisionId,choice.dataset.optionId); }
      const expand = event.target.closest && event.target.closest("[data-expand-administration]"); if (expand) expandAdministration(state());
      if (event.target.closest && event.target.closest("[data-world-events-open]")) { if(window.EpohiPlayerFeedback&&window.EpohiPlayerFeedback.reopenWorldEvents)window.EpohiPlayerFeedback.reopenWorldEvents(state()); }
      window.setTimeout(render, 0);
    });
    const end = document.getElementById("endTurnBtn"); if (end) end.addEventListener("click", function (event) { const gs=state(), pending=gs && (gs.urgentDecisions || []).some(function (item) { return item.status === "pending" && item.expiresTurn === gs.turn; }); if (pending && !window.confirm("Есть нерешённое срочное событие. Завершить ход без награды?")) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
    const turn = document.getElementById("turnValue"); if (turn) new MutationObserver(function () { const gs=state(); if (gs) { expireUrgentDecisions(gs); render(); } }).observe(turn, { childList:true, subtree:true });
    if(window.EpohiHumansJourney&&!window.EpohiHumansJourney.stabilityWrapped){
      const journey=window.EpohiHumansJourney, originalSync=journey.sync, originalResolve=journey.resolveEvent;
      journey.stabilityWrapped=true;
      journey.sync=function(options){const result=originalSync(options);const gs=state(),eventId=result&&result.queuedEvents&&result.queuedEvents[0],event=eventId&&journey.eventById(eventId);if(gs&&event&&!gs.urgentDecisions.some(function(item){return item.journeyEventId===event.id&&item.status==='pending';})){const city=(gs.cities||[]).find(function(item){return item.capital;})||(gs.cities||[])[0];createUrgentDecision(gs,{id:'journey-'+event.id+'-'+gs.turn,journeyEventId:event.id,title:event.title,text:event.text,cityId:city&&city.id,options:event.choices.map(function(option){return{id:option.id,label:option.label};})});}return result;};
      journey.resolveEvent=function(eventId,choiceId){const ok=originalResolve(eventId,choiceId),gs=state();if(ok&&gs){const item=(gs.urgentDecisions||[]).find(function(entry){return entry.journeyEventId===eventId&&entry.status==='pending';});if(item){item.status='resolved';item.resolvedTurn=gs.turn;item.chosenOption=choiceId;}render();}return ok;};
      journey.sync({render:false});
    }
    render();
  }

  window.EpohiCombatWorldStability = { version:VERSION, migrate:migrate, resolveFactionDefeat:resolveFactionDefeat, createUrgentDecision:createUrgentDecision, resolveUrgentDecision:resolveUrgentDecision, expireUrgentDecisions:expireUrgentDecisions, administrationCost:administrationCost, expandAdministration:expandAdministration, proposalValid:proposalValid, render:render };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once:true }); else install();
})();
