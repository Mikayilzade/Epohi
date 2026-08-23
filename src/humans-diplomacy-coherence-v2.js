(function () {
  "use strict";

  const TECHS = window.EpohiData && window.EpohiData.TECHS || {};
  const UNIT_DEFS = window.EpohiData && window.EpohiData.UNIT_DEFS || {};
  const PROPOSAL_LABELS = {
    trade: "Торговый договор",
    gift: "Дар",
    alliance: "Союз",
    peace: "Мир",
    threat: "Угроза",
    jointWar: "Совместная война"
  };
  const PRIORITIES = {
    "Завоеватель": ["mining", "woodworking", "militaryOrganization", "fortification", "engineering", "agriculture", "writing", "trade", "laws", "statehood"],
    "Купец": ["agriculture", "writing", "trade", "woodworking", "laws", "engineering", "statehood", "mining", "militaryOrganization", "fortification"],
    "Хранитель": ["agriculture", "woodworking", "engineering", "fortification", "writing", "trade", "laws", "statehood", "mining", "militaryOrganization"],
    "Интриган": ["agriculture", "writing", "laws", "trade", "engineering", "statehood", "mining", "woodworking", "militaryOrganization", "fortification"]
  };

  let originalLivingProcessTurn = null;
  let originalDebugFactory = null;
  let originalStackSelect = null;
  let lastProposalId = "";
  let queued = false;

  function debug() { return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null; }
  function state() { const value = debug(); return value && value.state ? value.state : null; }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]; }); }
  function civById(gs, id) { return (gs.rivals || []).find(function (civ) { return String(civ.civilizationId) === String(id); }) || null; }

  function addEvent(gs, type, text, civ, position) {
    if (!gs) return;
    gs.eventCounter = (Number(gs.eventCounter) || 0) + 1;
    if (!Array.isArray(gs.eventLog)) gs.eventLog = [];
    if (!Array.isArray(gs.history)) gs.history = [];
    const item = {
      eventId: "coherence-" + gs.eventCounter,
      turn: Number(gs.turn) || 1,
      phase: "diplomacy-coherence",
      actorType: civ ? "civilization" : "player",
      actorId: civ ? civ.civilizationId : "player",
      eventType: type,
      text: text,
      coordinates: position || null,
      position: position || null
    };
    gs.eventLog.unshift(item);
    gs.eventLog = gs.eventLog.slice(0, 300);
    const line = "Ход " + (Number(gs.turn) || 1) + ": " + text;
    if (gs.history.indexOf(line) < 0) gs.history.unshift(line);
    gs.history = gs.history.slice(0, 300);
    if (window.EpohiDiplomacyEventFlow && typeof window.EpohiDiplomacyEventFlow.syncChronicle === "function") window.EpohiDiplomacyEventFlow.syncChronicle(gs);
  }

  function knownTech(holder, id) {
    return [holder && holder.researched, holder && holder.technologies].some(function (list) {
      return Array.isArray(list) && list.indexOf(id) >= 0;
    });
  }

  function ensureRivalResearch(gs) {
    if (!gs) return null;
    (gs.rivals || []).forEach(function (civ) {
      if (!Array.isArray(civ.technologies)) civ.technologies = [];
      if (!civ.science || typeof civ.science !== "object") civ.science = {};
      if (!Number.isFinite(civ.science.progress)) civ.science.progress = 0;
      if (civ.science.currentResearch && (knownTech(civ, civ.science.currentResearch) || !TECHS[civ.science.currentResearch])) {
        civ.science.currentResearch = null;
        civ.science.progress = 0;
      }
    });
    return gs;
  }

  function availableTechs(civ) {
    return Object.keys(TECHS).filter(function (id) {
      if (knownTech(civ, id)) return false;
      return (TECHS[id].prereq || []).every(function (req) { return knownTech(civ, req); });
    });
  }

  function personalityName(civ) {
    return String(civ.personality || "Хранитель");
  }

  function chooseResearch(civ) {
    const available = availableTechs(civ);
    if (!available.length) return null;
    const priority = PRIORITIES[personalityName(civ)] || PRIORITIES["Хранитель"];
    return available.slice().sort(function (a, b) {
      const ai = priority.indexOf(a), bi = priority.indexOf(b);
      const ar = ai < 0 ? 999 : ai, br = bi < 0 ? 999 : bi;
      return ar - br || Number(TECHS[a].cost || 0) - Number(TECHS[b].cost || 0);
    })[0];
  }

  function processResearch(gs) {
    ensureRivalResearch(gs);
    (gs.rivals || []).forEach(function (civ) {
      if (civ.defeated || !(civ.cities || []).length) return;
      if (!civ.science.currentResearch) {
        civ.science.currentResearch = chooseResearch(civ);
        civ.science.progress = 0;
      }
      const id = civ.science.currentResearch;
      if (!id || !TECHS[id]) return;
      const cost = Number(TECHS[id].cost || 0);
      const need = Math.max(0, cost - Number(civ.science.progress || 0));
      const available = Math.max(0, Number(civ.resources && civ.resources.science || 0));
      const spend = Math.min(available, need);
      civ.science.progress = Number(civ.science.progress || 0) + spend;
      if (civ.resources) civ.resources.science = available - spend;
      if (civ.science.progress + 1e-9 < cost) return;
      civ.technologies.push(id);
      civ.science.currentResearch = null;
      civ.science.progress = 0;
      addEvent(gs, "technology-completed", civ.name + " изучил технологию «" + TECHS[id].name + "».", civ);
      civ.science.currentResearch = chooseResearch(civ);
    });
  }

  function suppressLegacyResearchBefore(gs) {
    const held = [];
    if (!gs || Number(gs.turn || 1) % 6 !== 0) return held;
    (gs.rivals || []).forEach(function (civ) {
      if (!civ.resources || Number(civ.resources.science || 0) < 12) return;
      held.push({ civ:civ, amount:Number(civ.resources.science) - 11 });
      civ.resources.science = 11;
    });
    return held;
  }

  function restoreLegacyResearchHold(held) {
    held.forEach(function (item) {
      item.civ.resources.science = Number(item.civ.resources.science || 0) + item.amount;
    });
  }

  function wrapLivingResearch() {
    const living = window.EpohiLivingCivilizations;
    if (!living || living.coherenceResearchWrapped || typeof living.processTurn !== "function") return;
    living.coherenceResearchWrapped = true;
    originalLivingProcessTurn = living.processTurn;
    living.processTurn = function (gs) {
      ensureRivalResearch(gs);
      const held = suppressLegacyResearchBefore(gs);
      let result;
      try { result = originalLivingProcessTurn.apply(this, arguments); }
      finally { restoreLegacyResearchHold(held); }
      processResearch(gs);
      window.setTimeout(schedule, 0);
      return result;
    };
  }

  function proposalEffects(item) {
    if (window.EpohiDiplomacyEventFlow && typeof window.EpohiDiplomacyEventFlow.proposalEffects === "function") return window.EpohiDiplomacyEventFlow.proposalEffects(item);
    const accept = {
      trade: "+2 золота за ход 8 ходов; доверие +7",
      gift: "+12 золота; доверие +5",
      alliance: "союз; доверие +12",
      peace: "завершить войну; обиды −20",
      threat: "−10 золота; обиды −12",
      jointWar: "вступить в войну; доверие +10"
    };
    return { accept:accept[item && item.type] || "принять условия", decline:"доверие −5" };
  }

  function proposalTitle(item, civ, target) {
    let title = PROPOSAL_LABELS[item.type] || "Дипломатическое предложение";
    if (item.type === "jointWar" && target) title += " против " + target.name;
    return title + " · " + (civ ? civ.name : "неизвестное государство");
  }

  function ensureProposalModal() {
    let modal = document.getElementById("coherenceProposalModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "coherenceProposalModal";
    modal.className = "modal coherence-proposal-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = '<section class="sheet"><header class="sheet-head"><h2 id="coherenceProposalTitle">Дипломатическое предложение</h2></header><div id="coherenceProposalContent" class="sheet-scroll"></div></section>';
    document.body.appendChild(modal);
    modal.addEventListener("click", function (event) {
      const button = event.target.closest && event.target.closest("[data-coherence-proposal-answer]");
      if (!button) return;
      const gs = state();
      const item = gs && (gs.diplomaticProposals || []).find(function (proposal) { return String(proposal.id) === String(button.dataset.proposalId); });
      if (!gs || !item || item.status !== "pending") { modal.classList.remove("show"); return; }
      const accepted = button.dataset.coherenceProposalAnswer === "yes";
      let resolved = false;
      if (item.type === "trade" && window.EpohiPlayerFeedback && typeof window.EpohiPlayerFeedback.resolveTradeProposal === "function") {
        resolved = window.EpohiPlayerFeedback.resolveTradeProposal(gs, item.id, accepted);
      } else if (window.EpohiLivingCivilizations && typeof window.EpohiLivingCivilizations.resolveProposal === "function") {
        resolved = window.EpohiLivingCivilizations.resolveProposal(gs, item.id, accepted);
      }
      if (resolved || item.status !== "pending") {
        lastProposalId = "";
        const value = debug();
        if (value && typeof value.render === "function") value.render();
        window.setTimeout(schedule, 0);
      }
    });
    return modal;
  }

  function renderProposal(gs) {
    const modal = ensureProposalModal();
    const pending = (gs.diplomaticProposals || []).find(function (item) { return item.status === "pending"; });
    if (!pending) { modal.classList.remove("show"); lastProposalId = ""; return; }
    const civ = civById(gs, pending.civId), target = civById(gs, pending.targetId), effects = proposalEffects(pending);
    document.getElementById("coherenceProposalTitle").textContent = proposalTitle(pending, civ, target);
    document.getElementById("coherenceProposalContent").innerHTML =
      '<article class="coherence-proposal-card"><div class="coherence-proposer">' + esc(civ ? civ.name : "Неизвестное государство") + '</div>' +
      '<p class="coherence-proposal-text">' + esc(pending.text || "") + '</p>' +
      (target ? '<div class="coherence-target">Цель: <strong>' + esc(target.name) + '</strong></div>' : '') +
      '<div class="coherence-effects"><div><strong>Принять</strong><span>' + esc(effects.accept) + '</span></div><div><strong>Отклонить</strong><span>' + esc(effects.decline) + '</span></div></div>' +
      '<div class="coherence-proposal-actions"><button type="button" class="wide-btn" data-coherence-proposal-answer="yes" data-proposal-id="' + esc(pending.id) + '">Принять</button><button type="button" class="wide-btn secondary" data-coherence-proposal-answer="no" data-proposal-id="' + esc(pending.id) + '">Отклонить</button></div></article>';
    if (window.EpohiDiplomacyEventFlow && typeof window.EpohiDiplomacyEventFlow.dismissToast === "function") window.EpohiDiplomacyEventFlow.dismissToast();
    const baseToast = document.getElementById("toast"); if (baseToast) baseToast.classList.remove("show");
    if (!modal.classList.contains("show") || lastProposalId !== String(pending.id)) {
      lastProposalId = String(pending.id);
      modal.classList.add("show");
    }
  }

  function techList(civ) {
    const known = (civ.technologies || []).filter(function (id) { return TECHS[id]; });
    return known.length ? known.map(function (id) { return TECHS[id].name; }).join(", ") : "нет изученных технологий";
  }

  function researchText(civ) {
    const id = civ.science && civ.science.currentResearch;
    if (!id || !TECHS[id]) return "исследование не выбрано";
    return TECHS[id].name + " — " + Math.floor(Number(civ.science.progress || 0)) + "/" + Number(TECHS[id].cost || 0);
  }

  function patchDiplomacy(gs) {
    document.querySelectorAll("[data-diplomacy-civ]").forEach(function (card) {
      const civ = civById(gs, card.dataset.diplomacyCiv); if (!civ) return;
      let box = card.querySelector("[data-coherence-techs]");
      if (!box) { box=document.createElement("div"); box.dataset.coherenceTechs="1"; box.className="coherence-techs"; const actions=card.querySelector(".strategy-diplomacy-actions"); if(actions)actions.before(box); else card.appendChild(box); }
      box.innerHTML = '<strong>Технологии</strong><span>' + esc(techList(civ)) + '</span><small>Сейчас исследует: ' + esc(researchText(civ)) + '</small>';
      card.querySelectorAll(".living-relation-details li").forEach(function (li) {
        let text = li.textContent;
        if (/совместн.*войн/i.test(text)) text = text.replace(/\(\+10\)/g, "(доверие +10)");
        if (/отклонил/i.test(text)) text = text.replace(/\(-5\)/g, "(доверие −5)");
        if (/обид/i.test(text)) text = text.replace(/\(-1\)/g, "(обиды −1)");
        li.textContent = text;
      });
    });
  }

  function wrapDebugCityFocus() {
    if (originalDebugFactory || typeof window.__epohiDebug !== "function") return;
    originalDebugFactory = window.__epohiDebug;
    window.__epohiDebug = function () {
      const value = originalDebugFactory();
      if (!value || value.coherenceCityFocusWrapped) return value;
      const originalSetActiveCity = value.setActiveCity;
      if (typeof originalSetActiveCity === "function") {
        value.setActiveCity = function (id) {
          const result = originalSetActiveCity.apply(this, arguments);
          window.setTimeout(function () {
            const gs=value.state, city=gs&&((gs.cities||[]).find(function(item){return String(item.id)===String(id);}) || (gs.city&&String(gs.city.id)===String(id)?gs.city:null));
            if(!city)return;
            const tile=document.querySelector('#map .tile[data-x="'+city.x+'"][data-y="'+city.y+'"]');
            if(tile){ const piece=tile.querySelector(".piece.city,.city-pop")||tile; piece.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window})); }
            const cityTab=document.querySelector('#contextTabs [data-inspect-layer="city"]'); if(cityTab)cityTab.click();
          },0);
          return result;
        };
      }
      value.coherenceCityFocusWrapped = true;
      return value;
    };
  }

  function strengthenStackSelection() {
    const cleanup = window.EpohiContextReviewCleanup;
    if (!cleanup || cleanup.coherenceSelectionWrapped || typeof cleanup.selectStackUnit !== "function") return;
    cleanup.coherenceSelectionWrapped = true;
    originalStackSelect = cleanup.selectStackUnit;
    cleanup.selectStackUnit = function (id) {
      const run = function () {
        originalStackSelect.call(cleanup, id);
        const value=debug(), selected=value&&value.getSelectedUnitId?value.getSelectedUnitId():null;
        if(String(selected)!==String(id)){
          const gs=value&&value.state,unit=gs&&(gs.units||[]).find(function(item){return String(item.id)===String(id);});
          const tile=unit&&document.querySelector('#map .tile[data-x="'+unit.x+'"][data-y="'+unit.y+'"]');
          if(tile)tile.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}));
          originalStackSelect.call(cleanup,id);
        }
      };
      run(); window.setTimeout(run,0); window.requestAnimationFrame(run);
    };
  }

  function enemyUnitAt(gs, x, y) {
    for (const civ of (gs.rivals || [])) {
      const unit=(civ.units||[]).find(function(item){return Number(item.x)===x&&Number(item.y)===y&&Number(item.hp||0)>0;});
      if(unit)return{civ:civ,unit:unit};
    }
    return null;
  }

  function showEnemyContext(gs, civ, unit) {
    const def=UNIT_DEFS[unit.type]||{name:unit.type||"Юнит",icon:"⚔️",attack:0,defense:0};
    const title=document.getElementById("contextTitle"),text=document.getElementById("contextText"),actions=document.getElementById("contextActions");
    if(!title||!text||!actions)return;
    title.textContent=(def.icon||"⚔️")+" "+(unit.name||def.name);
    text.textContent="Владелец: "+civ.name+" · тип: "+def.name+" · здоровье: "+Math.ceil(unit.hp)+"/"+unit.maxHp+" · атака: "+(def.attack||0)+" · защита: "+(def.defense||0)+" · отношения: "+(civ.relation==="war"?"война":civ.relation==="ally"?"союз":"нейтральные");
    actions.innerHTML="";
    const value=debug(),selectedId=value&&value.getSelectedUnitId?value.getSelectedUnitId():null,attacker=gs.units&&gs.units.find(function(item){return String(item.id)===String(selectedId);});
    if(civ.relation==="war"&&attacker&&Number(attacker.moves||0)>0&&!attacker.acted&&window.EpohiUtils&&window.EpohiUtils.isAdjacent(attacker.x,attacker.y,unit.x,unit.y)){
      const attack=document.createElement("button"); attack.type="button"; attack.className="context-btn danger"; attack.dataset.contextAction="attack"; attack.innerHTML="⚔️<br>Атаковать"; attack.onclick=function(){if(window.EpohiHumansPathing)window.EpohiHumansPathing.assignTravelOrder(attacker.id,{type:"attack",targetKind:"rival",targetId:unit.id,civilizationId:civ.civilizationId,x:unit.x,y:unit.y,civ:civ});}; actions.appendChild(attack);
    }
    const dip=document.createElement("button"); dip.type="button"; dip.className="context-btn alt"; dip.dataset.contextAction="diplomacy"; dip.textContent="Дипломатия"; dip.onclick=function(){if(window.EpohiStrategyUX&&typeof window.EpohiStrategyUX.openDiplomacy==="function")window.EpohiStrategyUX.openDiplomacy(civ.civilizationId);}; actions.appendChild(dip);
    actions.style.setProperty("--context-action-count",String(actions.children.length||1));
  }

  function interceptEnemyTap(event) {
    const piece=event.target&&event.target.closest&&event.target.closest("#map .piece.ai-unit"); if(!piece)return;
    const tile=piece.closest(".tile"),gs=state(); if(!tile||!gs)return;
    const enemy=enemyUnitAt(gs,Number(tile.dataset.x),Number(tile.dataset.y)); if(!enemy)return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    showEnemyContext(gs,enemy.civ,enemy.unit);
  }

  function hideUrgentIndicator() {
    const node=document.getElementById("urgentDecisionIndicator"); if(node){node.classList.remove("show");node.hidden=true;node.setAttribute("aria-hidden","true");}
  }

  function decorate() {
    const gs=ensureRivalResearch(state()); if(!gs)return;
    hideUrgentIndicator(); patchDiplomacy(gs); renderProposal(gs);
  }

  function schedule() { if(queued)return; queued=true; requestAnimationFrame(function(){queued=false;decorate();}); }

  function installStyles() {
    if(document.getElementById("diplomacyCoherenceStyles"))return;
    const style=document.createElement("style"); style.id="diplomacyCoherenceStyles";
    style.textContent=[
      "#urgentDecisionIndicator{display:none!important}",
      "#livingProposals{display:none!important;opacity:0!important;pointer-events:none!important}",
      ".coherence-proposal-modal{z-index:184!important;align-items:center!important;justify-content:center!important;padding:14px!important}",
      ".coherence-proposal-modal .sheet{width:min(560px,calc(100vw - 28px))!important;max-height:min(82dvh,700px)!important;margin:auto!important;border-radius:18px!important}",
      ".coherence-proposal-card{padding:8px 2px 14px}.coherence-proposer{font-size:12px;font-weight:850;opacity:.72}.coherence-proposal-text{font-size:16px;line-height:1.4;margin:10px 0 12px}",
      ".coherence-target{margin:8px 0;padding:8px 10px;border-radius:10px;background:rgba(110,80,55,.1)}",
      ".coherence-effects{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.coherence-effects>div{padding:10px;border-radius:12px;background:rgba(70,94,69,.1)}.coherence-effects strong,.coherence-effects span{display:block}.coherence-effects span{font-size:11px;line-height:1.35;margin-top:4px}",
      ".coherence-proposal-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}",
      ".coherence-techs{display:flex;flex-direction:column;gap:3px;margin:7px 10px;padding:8px 9px;border-radius:10px;background:rgba(75,94,68,.08);font-size:10px;line-height:1.3}.coherence-techs strong{font-size:11px}.coherence-techs small{opacity:.72}",
      "@media(max-width:520px){.coherence-proposal-modal{padding:10px!important}.coherence-proposal-text{font-size:15px}.coherence-effects{grid-template-columns:1fr}.coherence-effects span{font-size:10px}}"
    ].join(""); document.head.appendChild(style);
  }

  function wrapHooks(){
    const living=window.EpohiLivingCivilizations;
    if(living&&typeof living.renderUI==="function"&&!living.coherenceRenderWrapped){living.coherenceRenderWrapped=true;const original=living.renderUI;living.renderUI=function(){const result=original.apply(this,arguments);window.setTimeout(schedule,0);return result;};}
    const flow=window.EpohiDiplomacyEventFlow;
    if(flow&&typeof flow.refresh==="function"&&!flow.coherenceRefreshWrapped){flow.coherenceRefreshWrapped=true;const original=flow.refresh;flow.refresh=function(){const result=original.apply(this,arguments);window.setTimeout(schedule,0);return result;};}
  }

  function install(){
    installStyles(); ensureProposalModal(); ensureRivalResearch(state()); strengthenStackSelection(); wrapLivingResearch(); wrapHooks();
    window.addEventListener("click",interceptEnemyTap,true);
    document.addEventListener("click",function(event){if(event.target.closest&&event.target.closest("[data-dip-action],[data-proposal],[data-research],#endTurnBtn"))window.setTimeout(schedule,0);});
    const turn=document.getElementById("turnValue"); if(turn)new MutationObserver(schedule).observe(turn,{childList:true,characterData:true,subtree:true});
    ["strategyDiplomacyModal","livingProposals","stabilityDecisionModal"].forEach(function(id){const node=document.getElementById(id);if(node)new MutationObserver(schedule).observe(node,{attributes:true,childList:true,subtree:true,attributeFilter:["class"]});});
    schedule();
  }

  window.EpohiDiplomacyCoherence={version:2,ensureRivalResearch:ensureRivalResearch,availableTechs:availableTechs,chooseResearch:chooseResearch,processResearch:processResearch,renderProposal:renderProposal,patchDiplomacy:patchDiplomacy,showEnemyContext:showEnemyContext};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
})();
