(function () {
  "use strict";

  const PERSONALITIES = {
    zarr: { name: "Завоеватель", strategy: "военная экспансия", aggression: 82, generosity: 18, commerce: 25, techs: ["mining", "engineering"] },
    velm: { name: "Купец", strategy: "торговля и богатство", aggression: 22, generosity: 48, commerce: 92, techs: ["writing", "trade"] },
    elaria: { name: "Хранитель", strategy: "рост, оборона и союзы", aggression: 12, generosity: 86, commerce: 55, techs: ["agriculture", "engineering"] },
    varkesh: { name: "Интриган", strategy: "наука и дипломатическое давление", aggression: 55, generosity: 28, commerce: 62, techs: ["writing", "statehood"] }
  };
  const LABELS = { trade: "Торговый договор", gift: "Дар", alliance: "Союз", peace: "Мир", threat: "Угроза", jointWar: "Совместная война" };
  let callbacks = {};

  function profile(civ) { return PERSONALITIES[civ.cultureKey] || PERSONALITIES.elaria; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function escapeText(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function connect(next) { callbacks = next || {}; }

  function addWorldEvent(gs, type, text, civ, position) {
    const item = { id: "living-" + gs.turn + "-" + (gs.nextLivingEventId++), turn: gs.turn, eventType: type, text: text, position: position || null, actorType: "civilization", actorId: civ && civ.civilizationId, phase: "diplomacy" };
    gs.eventLog.unshift(item);
    gs.eventLog = gs.eventLog.slice(0, 240);
    gs.livingWorldEvents.unshift(item);
    gs.livingWorldEvents = gs.livingWorldEvents.slice(0, 60);
  }

  function migrate(gs) {
    if (!gs) return null;
    gs.diplomacySchemaVersion = 2;
    gs.nextLivingEventId = Number(gs.nextLivingEventId) || 1;
    if (!Array.isArray(gs.eventLog)) gs.eventLog = [];
    if (!Array.isArray(gs.livingWorldEvents)) gs.livingWorldEvents = [];
    if (!Array.isArray(gs.diplomaticProposals)) gs.diplomaticProposals = [];
    (gs.rivals || []).forEach(function (civ) {
      const identity = profile(civ), diplomacy = civ.diplomacy || (civ.diplomacy = {}), oldScore = Number(diplomacy.score) || 0;
      if (!Number.isFinite(diplomacy.trust)) diplomacy.trust = clamp(35 + oldScore, 0, 100);
      if (!Number.isFinite(diplomacy.fear)) diplomacy.fear = civ.relation === "war" ? 45 : 15;
      if (!Number.isFinite(diplomacy.grievances)) diplomacy.grievances = oldScore < 0 ? Math.abs(oldScore) : 0;
      if (!Array.isArray(diplomacy.memories)) diplomacy.memories = [];
      if (!Array.isArray(diplomacy.history)) diplomacy.history = [];
      civ.personality = civ.personality || identity.name;
      civ.developmentStrategy = civ.developmentStrategy || identity.strategy;
      if (!Array.isArray(civ.technologies)) civ.technologies = [];
    });
    return gs;
  }

  function remember(gs, civ, kind, amount, reason) {
    const diplomacy = civ.diplomacy;
    diplomacy.memories.unshift({ turn: gs.turn, kind: kind, amount: amount, reason: reason });
    diplomacy.memories = diplomacy.memories.slice(0, 30);
    diplomacy.history.unshift("Ход " + gs.turn + ": " + reason + " (" + (amount >= 0 ? "+" : "") + amount + ")");
    diplomacy.history = diplomacy.history.slice(0, 30);
  }

  function changeRelationship(gs, civ, field, amount, reason) {
    migrate(gs);
    const diplomacy = civ.diplomacy;
    diplomacy[field] = clamp(diplomacy[field] + amount, 0, 100);
    diplomacy.score = clamp(Math.round(diplomacy.trust * .7 - diplomacy.fear * .25 - diplomacy.grievances * .65), -50, 50);
    remember(gs, civ, field, amount, reason);
  }

  function recordAttack(gs, civ, attacker) {
    if (!civ) return;
    if (attacker === "player") {
      changeRelationship(gs, civ, "grievances", 12, "Ардена атаковала наших людей");
      changeRelationship(gs, civ, "fear", 4, "военная сила Ардены внушает опасение");
    } else {
      changeRelationship(gs, civ, "trust", -8, civ.name + " атаковал Ардену");
    }
  }

  function createProposal(gs, civ, type, text, targetId) {
    migrate(gs);
    if (gs.diplomaticProposals.some(function (item) { return item.status === "pending" && item.civId === civ.civilizationId && item.type === type; })) return null;
    const item = { id: "proposal-" + gs.turn + "-" + civ.civilizationId + "-" + type, turn: gs.turn, civId: civ.civilizationId, type: type, targetId: targetId || null, text: text, status: "pending" };
    gs.diplomaticProposals.unshift(item);
    addWorldEvent(gs, "diplomatic-proposal", civ.name + ": «" + text + "»", civ);
    return item;
  }

  function chooseProposal(gs, civ) {
    if (!civ.met || civ.defeated || gs.turn % 4 !== (Number(String(civ.civilizationId).replace(/\D/g, "")) || 0) % 4) return;
    const diplomacy = civ.diplomacy, identity = profile(civ);
    if (civ.relation === "war") return createProposal(gs, civ, "peace", "Предлагаем мир: взаимная вражда уже слишком дорога.");
    if (diplomacy.grievances >= 45) return createProposal(gs, civ, "threat", "Возместите старые обиды даром, иначе последует война.");
    if (civ.relation !== "ally" && diplomacy.trust >= 62) return createProposal(gs, civ, "alliance", "Наше доверие окрепло. Заключим союз?");
    const enemy = (gs.rivals || []).find(function (other) { return other !== civ && other.relation === "war"; });
    if (civ.relation === "ally" && enemy) return createProposal(gs, civ, "jointWar", "Выступим вместе против " + enemy.name + ".", enemy.civilizationId);
    if (identity.generosity > 70 && gs.turn % 8 === 0) return createProposal(gs, civ, "gift", "Примите 12 золота в память о нашей дружбе.");
    if (identity.commerce > 50) createProposal(gs, civ, "trade", "Откроем торговый путь: обе стороны получат золото.");
  }

  function resolveProposal(gs, id, accepted) {
    migrate(gs);
    const item = gs.diplomaticProposals.find(function (proposal) { return proposal.id === id; });
    if (!item || item.status !== "pending") return false;
    const civ = gs.rivals.find(function (candidate) { return candidate.civilizationId === item.civId; });
    if (!civ) return false;
    item.status = accepted ? "accepted" : "declined";
    item.resolvedTurn = gs.turn;
    if (!accepted) changeRelationship(gs, civ, "trust", -5, "Ардена отклонила предложение «" + LABELS[item.type] + "»");
    else if (item.type === "trade") { gs.resources.gold += 8; civ.resources.gold += 8; changeRelationship(gs, civ, "trust", 7, "торговый договор оказался взаимовыгодным"); }
    else if (item.type === "gift") { gs.resources.gold += 12; changeRelationship(gs, civ, "trust", 5, "Ардена с благодарностью приняла дар"); }
    else if (item.type === "alliance") { civ.relation = "ally"; changeRelationship(gs, civ, "trust", 12, "заключён союз"); }
    else if (item.type === "peace") { civ.relation = "neutral"; civ.warStartTurn = null; changeRelationship(gs, civ, "grievances", -20, "заключён мир"); }
    else if (item.type === "threat") { if (gs.resources.gold >= 10) gs.resources.gold -= 10; changeRelationship(gs, civ, "grievances", -12, "Ардена уступила дипломатическому давлению"); }
    else if (item.type === "jointWar") {
      const target = gs.rivals.find(function (candidate) { return candidate.civilizationId === item.targetId; });
      if (target) { target.relation = "war"; changeRelationship(gs, civ, "trust", 10, "Ардена поддержала совместную войну"); addWorldEvent(gs, "joint-war-declared", "Ардена и " + civ.name + " объявили совместную войну: " + target.name + ".", civ); }
    }
    addWorldEvent(gs, "major-diplomatic-event", (accepted ? "Принято: " : "Отклонено: ") + LABELS[item.type] + " — " + civ.name + ".", civ);
    return true;
  }

  function alliedHelp(gs, civ, helpers) {
    if (civ.relation !== "ally") return;
    const city = gs.city || (gs.cities || [])[0], soldiers = (civ.units || []).filter(function (unit) { return unit.hp > 0 && unit.type !== "worker" && unit.type !== "settler"; });
    if (!city) return;
    const danger = (gs.barbarians || []).slice().sort(function (a, b) { return helpers.distance(a, city) - helpers.distance(b, city); })[0];
    if (danger && helpers.distance(danger, city) <= 7 && soldiers.length) {
      const unit = soldiers[0], distance = helpers.distance(unit, danger);
      if (distance <= 1) { helpers.attackBarbarian(civ, unit, danger); addWorldEvent(gs, "allied-battle", civ.name + " пришёл на помощь и атаковал варваров.", civ, { x: danger.x, y: danger.y }); remember(gs, civ, "help", 5, "Союзники вместе сражались с варварами"); }
      else if (distance <= 9 && helpers.stepToward(unit, danger, civ)) addWorldEvent(gs, "allied-aid", civ.name + " направляет отряд против угрозы Ардене.", civ, { x: unit.x, y: unit.y });
    }
    (gs.rivals || []).filter(function (enemy) { return enemy !== civ && enemy.relation === "war"; }).forEach(function (enemy) {
      if (civ.diplomacy[enemy.civilizationId] !== "war") { civ.diplomacy[enemy.civilizationId] = "war"; addWorldEvent(gs, "joint-war-declared", civ.name + " выполняет союзный долг и вступает в войну против " + enemy.name + ".", civ); }
      if (helpers.warAction && helpers.warAction(civ, enemy)) addWorldEvent(gs, "allied-war-action", civ.name + " оказывает военную помощь против " + enemy.name + ".", civ);
    });
  }

  function processTurn(gs, helpers) {
    migrate(gs);
    (gs.rivals || []).forEach(function (civ) {
      const identity = profile(civ);
      civ.strategicGoal = identity.strategy;
      alliedHelp(gs, civ, helpers);
      chooseProposal(gs, civ);
      if (gs.turn % 6 === 0 && civ.resources && civ.resources.science >= 12) {
        const tech = identity.techs.find(function (id) { return civ.technologies.indexOf(id) < 0; });
        if (tech) { civ.technologies.push(tech); civ.resources.science -= 12; addWorldEvent(gs, "technology-completed", civ.name + " изучил технологию «" + window.EpohiData.TECHS[tech].name + "».", civ); }
      }
      if (civ.diplomacy.grievances > 0 && gs.turn % 5 === 0) changeRelationship(gs, civ, "grievances", -1, "время понемногу смягчило старые обиды");
    });
  }

  function renderUI(gs) {
    migrate(gs);
    document.querySelectorAll("[data-diplomacy-civ]").forEach(function (card) {
      const civ = gs.rivals.find(function (candidate) { return candidate.civilizationId === card.dataset.diplomacyCiv; });
      if (!civ) return;
      let box = card.querySelector(".living-relation-details");
      if (!box) { box = document.createElement("div"); box.className = "living-relation-details"; card.querySelector(".strategy-diplomacy-actions").before(box); }
      box.innerHTML = "<div><b>Доверие " + civ.diplomacy.trust + "</b><b>Страх " + civ.diplomacy.fear + "</b><b>Обиды " + civ.diplomacy.grievances + "</b></div><small>Личность: " + escapeText(civ.personality) + " · Стратегия: " + escapeText(civ.developmentStrategy) + "</small>" + (civ.diplomacy.history.length ? "<ul>" + civ.diplomacy.history.slice(0, 3).map(function (line) { return "<li>" + escapeText(line) + "</li>"; }).join("") + "</ul>" : "");
    });
    let panel = document.getElementById("livingProposals");
    if (!panel) {
      panel = document.createElement("aside"); panel.id = "livingProposals"; panel.className = "living-proposals"; document.getElementById("gameApp").appendChild(panel);
      panel.addEventListener("click", function (event) { const button = event.target.closest("[data-proposal]"); if (!button || !callbacks.getState) return; if (resolveProposal(callbacks.getState(), button.dataset.proposal, button.dataset.answer === "yes")) { if (callbacks.save) callbacks.save(); if (callbacks.render) callbacks.render(); } });
    }
    const pending = gs.diplomaticProposals.filter(function (item) { return item.status === "pending"; });
    panel.replaceChildren();
    pending.slice(0, 2).forEach(function (item) {
      const civ = gs.rivals.find(function (candidate) { return candidate.civilizationId === item.civId; }), article = document.createElement("article"), title = document.createElement("small"), text = document.createElement("p");
      title.textContent = LABELS[item.type] + " · " + (civ ? civ.name : ""); text.textContent = item.text; article.append(title, text);
      [["Принять", "yes", ""], ["Отклонить", "no", "secondary"]].forEach(function (choice) { const button = document.createElement("button"); button.textContent = choice[0]; button.dataset.proposal = item.id; button.dataset.answer = choice[1]; button.className = choice[2]; article.appendChild(button); }); panel.appendChild(article);
    });
    panel.classList.toggle("show", pending.length > 0);
  }

  window.EpohiLivingCivilizations = { version: 2, personalities: PERSONALITIES, connect: connect, migrate: migrate, processTurn: processTurn, resolveProposal: resolveProposal, changeRelationship: changeRelationship, createProposal: createProposal, alliedHelp: alliedHelp, recordAttack: recordAttack, renderUI: renderUI, addWorldEvent: addWorldEvent };
})();
