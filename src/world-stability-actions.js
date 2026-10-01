(function () {
  "use strict";

  const VERSION = 1;
  const { PLAYER_CITY_RULES, WORLD_STABILITY_RULES } = window.EpohiData;

  function migrate(gs) {
    if (!gs) return null;
    gs.combatWorldStabilityVersion = VERSION;
    if (!Number.isFinite(gs.cityCapacity)) gs.cityCapacity = Math.max(PLAYER_CITY_RULES.defaultCapacity, (gs.cities || []).length);
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
    (gs.eventLog||[]).forEach(function(item,index){if(!item.eventId)item.eventId="event-"+(item.turn||0)+"-"+(item.eventType||"world")+"-"+String(item.actorId||"none")+"-"+index;});
    gs.majorEventsSeen=gs.majorEventsSeen.filter(function(id){return typeof id==="string"&&id.length>0;});
    return gs;
  }

  function addEvent(gs, type, text, coordinates) {
    return window.EpohiEventJournal.append(gs,function(counter){
      return {eventId:"stability-"+counter,turn:gs.turn||1,eventType:type,
        text:text,coordinates:coordinates||null,phase:"world"};
    },{eventLimit:240,historyLimit:120});
  }

  function createUrgentDecision(gs, input) {
    migrate(gs);
    const item = Object.assign({ id:"decision-" + (gs.turn || 1) + "-" + (gs.urgentDecisions.length + 1), createdTurn:gs.turn || 1, expiresTurn:gs.turn || 1, status:"pending", title:"Требуется решение", options:[] }, input || {});
    if (!item.cityId && gs.cities && gs.cities[0]) item.cityId = gs.cities[0].id;
    gs.urgentDecisions.push(item); return item;
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
    return true;
  }

  function expireUrgentDecisions(gs) {
    (gs.urgentDecisions || []).forEach(function (item) { if (item.status === "pending" && (gs.turn || 1) > item.expiresTurn) { item.status = "expired"; if(item.journeyEventId&&gs.humanJourney){gs.humanJourney.queuedEvents=(gs.humanJourney.queuedEvents||[]).filter(function(id){return id!==item.journeyEventId;});if(!(gs.humanJourney.resolvedEvents||[]).includes(item.journeyEventId))gs.humanJourney.resolvedEvents.push(item.journeyEventId);} addEvent(gs, "urgent-decision-expired", item.title + ": возможность упущена."); } });
  }

  function administrationCost(gs) {
    return WORLD_STABILITY_RULES.administrationBaseCost
      + (gs.cityCapacityPurchases || 0) * WORLD_STABILITY_RULES.administrationCostStep;
  }
  function expandAdministration(gs) {
    migrate(gs); const cost = administrationCost(gs); if ((gs.resources.gold || 0) < cost) return false;
    gs.resources.gold -= cost; gs.cityCapacity += 1; gs.cityCapacityPurchases += 1;
    addEvent(gs, "treasury-purchase", "Административная ёмкость расширена до " + gs.cityCapacity + " за " + cost + " золота."); return true;
  }

  window.EpohiWorldStabilityActions = { migrate, createUrgentDecision,
    resolveUrgentDecision, expireUrgentDecisions, administrationCost, expandAdministration };
})();
