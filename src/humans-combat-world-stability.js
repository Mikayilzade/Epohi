(function () {
  "use strict";

  const VERSION = 1;
  const MAJOR = new Set(["capital-fallen", "civilization-founded", "victory", "major-diplomatic-event", "trade-route-opened"]);
  let lastMajorId = null;

  function debug() { return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null; }
  function state() { const value = debug(); return value && value.state; }
  function escape(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]; }); }

  const RULES = window.EpohiWorldStabilityActions;
  const { migrate, administrationCost } = RULES;
  function createUrgentDecision(gs, input) {
    const result = RULES.createUrgentDecision(gs, input);
    render();
    return result;
  }
  function resolveUrgentDecision(gs, id, optionId) {
    const result = RULES.resolveUrgentDecision(gs, id, optionId);
    if (result) render();
    return result;
  }
  function expandAdministration(gs) {
    const result = RULES.expandAdministration(gs);
    if (result) render();
    return result;
  }
  function confirmEndTurn(gs) {
    const pending = gs && (gs.urgentDecisions || []).some(function (item) {
      return item.status === "pending" && item.expiresTurn === gs.turn;
    });
    return !pending || window.confirm("Есть нерешённое срочное событие. Завершить ход без награды?");
  }

  function ensureUi() {
    if (!document.getElementById("stabilityMajorModal")) document.body.insertAdjacentHTML("beforeend", '<div id="stabilityMajorModal" class="modal" role="dialog" aria-modal="true"><section class="sheet"><header class="sheet-head"><h2 id="stabilityMajorTitle">Событие мира</h2><button class="close-btn" data-stability-close="major" aria-label="Закрыть">×</button></header><div id="stabilityMajorContent" class="sheet-scroll"></div></section></div><button id="urgentDecisionIndicator" class="wide-btn stability-decision-indicator" type="button">⚠ Требуется решение</button><div id="stabilityDecisionModal" class="modal" role="dialog" aria-modal="true"><section class="sheet"><header class="sheet-head"><h2>Требуется решение</h2><button class="close-btn" data-stability-close="decision" aria-label="Закрыть">×</button></header><div id="stabilityDecisionContent" class="sheet-scroll"></div></section></div>');
  }

  function render() {
    const gs = state(); if (!gs) return; ensureUi();
    const pending = gs.urgentDecisions.find(function (item) { return item.status === "pending"; });
    const indicator = document.getElementById("urgentDecisionIndicator"); indicator.classList.toggle("show", Boolean(pending));
    if (pending) {
      const city = (gs.cities || []).find(function (item) { return item.id === pending.cityId; });
      document.getElementById("stabilityDecisionContent").innerHTML = '<div class="wiki-callout"><strong>' + escape(pending.title) + '</strong><br>' + escape(pending.text || "") + '<br><small>Город: ' + escape(city ? city.name : "утрачен") + ' · решение до конца хода</small></div><div class="card-list">' + (pending.options || []).map(function (option) { return '<button class="wide-btn" data-decision-id="' + escape(pending.id) + '" data-option-id="' + escape(option.id) + '">' + escape(option.label) + '</button>'; }).join("") + '</div>';
      if (!pending.presented) { pending.presented = true; document.getElementById("stabilityDecisionModal").classList.add("show"); }
    }
    const cityContent = document.getElementById("cityContent");
    if (cityContent) { let status=cityContent.querySelector("[data-administration-status]"); if(!status){cityContent.insertAdjacentHTML("afterbegin",'<div class="inline-note" data-administration-status></div>');status=cityContent.querySelector("[data-administration-status]");} status.innerHTML='Административная ёмкость: <strong>'+(gs.cities||[]).length+'/'+gs.cityCapacity+'</strong>'; }
    const treasury = document.getElementById("feedbackTreasuryContent");
    if (treasury) { let card=treasury.querySelector("[data-administration-card]"); if(!card){treasury.insertAdjacentHTML("beforeend",'<article class="game-card" data-administration-card></article>');card=treasury.querySelector("[data-administration-card]");} card.innerHTML='<div><h3>🏛️ Расширить администрацию</h3><p>Города: '+(gs.cities||[]).length+'/'+gs.cityCapacity+'. Повышает ёмкость на один.</p></div><button class="card-button" data-expand-administration '+((gs.resources.gold||0)<administrationCost(gs)?'disabled':'')+'>'+administrationCost(gs)+' 🪙</button>'; }
    const menuContent = document.getElementById("menuContent");
    if (menuContent && !menuContent.querySelector("[data-world-events-open]")) menuContent.insertAdjacentHTML("afterbegin", '<button class="wide-btn secondary" data-world-events-open>🌍 События мира</button>');
    const event = (gs.eventLog || []).find(function (item) { return MAJOR.has(item.eventType) && gs.majorEventsSeen.indexOf(item.eventId) < 0; });
    if (event && event.eventId !== lastMajorId) { lastMajorId = event.eventId; gs.majorEventsSeen.push(event.eventId); document.getElementById("stabilityMajorContent").textContent = event.text; document.getElementById("stabilityMajorModal").classList.add("show"); }
  }

  function install() {
    ensureUi();
    document.addEventListener("epohi:treasury-rendered", render);
    document.addEventListener("click", function (event) {
      const close = event.target.closest && event.target.closest("[data-stability-close]");
      if (close) document.getElementById(close.dataset.stabilityClose === "major" ? "stabilityMajorModal" : "stabilityDecisionModal").classList.remove("show");
      if (event.target.closest && event.target.closest("#urgentDecisionIndicator")) document.getElementById("stabilityDecisionModal").classList.add("show");
      const choice = event.target.closest && event.target.closest("[data-decision-id]"); if (choice) { const gs=state(), item=(gs.urgentDecisions||[]).find(function(entry){return entry.id===choice.dataset.decisionId;}); if(item&&item.journeyEventId&&window.EpohiHumansJourney)window.EpohiHumansJourney.resolveEvent(item.journeyEventId,choice.dataset.optionId);else resolveUrgentDecision(gs,choice.dataset.decisionId,choice.dataset.optionId); }
      const expand = event.target.closest && event.target.closest("[data-expand-administration]"); if (expand) expandAdministration(state());
      if (event.target.closest && event.target.closest("[data-world-events-open]")) { if(window.EpohiPlayerFeedback&&window.EpohiPlayerFeedback.reopenWorldEvents)window.EpohiPlayerFeedback.reopenWorldEvents(state()); }
      const needsStabilitySheet = event.target.closest && event.target.closest(
        "#cityBtn, #menuBtn, [data-context-action='open-city'], [data-city-select]");
      if (needsStabilitySheet) window.setTimeout(render, 0);
    });
    if(window.EpohiHumansJourney&&!window.EpohiHumansJourney.stabilityWrapped){
      const journey=window.EpohiHumansJourney, originalSync=journey.sync, originalResolve=journey.resolveEvent;
      journey.stabilityWrapped=true;
      journey.sync=function(options){const result=originalSync(options);const gs=state(),eventId=result&&result.queuedEvents&&result.queuedEvents[0],event=eventId&&journey.eventById(eventId);if(gs&&event&&!gs.urgentDecisions.some(function(item){return item.journeyEventId===event.id&&item.status==='pending';})){const city=(gs.cities||[]).find(function(item){return item.capital;})||(gs.cities||[])[0];createUrgentDecision(gs,{id:'journey-'+event.id+'-'+gs.turn,journeyEventId:event.id,title:event.title,text:event.text,cityId:city&&city.id,options:event.choices.map(function(option){return{id:option.id,label:option.label};})});}return result;};
      journey.resolveEvent=function(eventId,choiceId){const result={},ok=originalResolve(eventId,choiceId,result),gs=state();if(ok&&gs){const item=(gs.urgentDecisions||[]).find(function(entry){return entry.journeyEventId===eventId&&entry.status==='pending';});if(item){item.status='resolved';item.resolvedTurn=gs.turn;item.chosenOption=choiceId;}if(result.workforceChanges&&window.EpohiPopulationWorkforce)window.EpohiPopulationWorkforce.presentChanges(result.workforceChanges);const value=debug();if(value&&typeof value.render==="function")value.render();render();}return ok;};
      journey.sync({render:false});
    }
    render();
  }

  window.EpohiCombatWorldStability = { version:VERSION, migrate:migrate, createUrgentDecision:createUrgentDecision, resolveUrgentDecision:resolveUrgentDecision, confirmEndTurn:confirmEndTurn, administrationCost:administrationCost, expandAdministration:expandAdministration, proposalValid:window.EpohiStabilityRules.proposalValid, render:render };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once:true }); else install();
})();
