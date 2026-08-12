(function () {
  "use strict";

  const BUILDINGS = window.EpohiData && window.EpohiData.BUILDINGS || {};
  const TECHS = window.EpohiData && window.EpohiData.TECHS || {};
  const SPECIALIZATION_NAMES = { food:"Житница", production:"Кузницы", science:"Школа мудрецов", gold:"Торговый квартал" };
  const PLUNDER_SCIENCE_SHARE = 0.20;

  let originalFactionDefeat = null;
  let originalAssignTravelOrder = null;
  let originalProcessOrders = null;
  let originalLivingProcessTurn = null;
  let captureCounter = 0;
  let queued = false;

  function debug(){ return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null; }
  function state(){ const value=debug(); return value&&value.state?value.state:null; }
  function esc(value){ return String(value==null?"":value).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];}); }
  function playerCities(gs){ return gs && Array.isArray(gs.cities) && gs.cities.length ? gs.cities : (gs&&gs.city?[gs.city]:[]); }
  function civById(gs,id){ return (gs.rivals||[]).find(function(civ){return String(civ.civilizationId)===String(id);})||null; }
  function hasTech(gs,id){ return [gs.researched,gs.technologies].some(function(list){return Array.isArray(list)&&list.indexOf(id)>=0;}); }

  function addEvent(gs,type,text,actorId,position){
    gs.eventCounter=(Number(gs.eventCounter)||0)+1;
    if(!Array.isArray(gs.eventLog))gs.eventLog=[];
    if(!Array.isArray(gs.history))gs.history=[];
    const item={eventId:"capture-state-"+gs.eventCounter,turn:Number(gs.turn)||1,phase:"capture-state",actorType:actorId?"civilization":"player",actorId:actorId||"player",eventType:type,text:text,coordinates:position||null,position:position||null};
    gs.eventLog.unshift(item); gs.eventLog=gs.eventLog.slice(0,300);
    const line="Ход "+(Number(gs.turn)||1)+": "+text; if(gs.history.indexOf(line)<0)gs.history.unshift(line); gs.history=gs.history.slice(0,300);
    if(window.EpohiDiplomacyEventFlow&&typeof window.EpohiDiplomacyEventFlow.syncChronicle==="function")window.EpohiDiplomacyEventFlow.syncChronicle(gs);
    return item;
  }

  function ensureExperience(holder){
    if(window.EpohiWorkerLearning&&typeof window.EpohiWorkerLearning.ensureState==="function"&&holder===state())window.EpohiWorkerLearning.ensureState(holder);
    if(!holder.experience)holder.experience={};
    if(!holder.experience.buildings)holder.experience.buildings={};
    if(!holder.experience.foreignBuildings)holder.experience.foreignBuildings={};
    if(!holder.experience.units)holder.experience.units={};
    return holder.experience;
  }

  function ensureState(gs){
    if(!gs)return null;
    ensureExperience(gs);
    if(!gs.techInsights)gs.techInsights={};
    if(!Array.isArray(gs.captureHistory))gs.captureHistory=[];
    if(!Array.isArray(gs.pendingCityCaptures))gs.pendingCityCaptures=[];
    if(!Number.isFinite(gs.nextBanditId))gs.nextBanditId=1;
    (gs.rivals||[]).forEach(function(civ){
      if(!Array.isArray(civ.cities))civ.cities=[];
      if(!Array.isArray(civ.units))civ.units=[];
      if(!Array.isArray(civ.technologies))civ.technologies=[];
      ensureExperience(civ);
      civ.cities.forEach(function(city){if(!Array.isArray(city.buildings))city.buildings=[];});
    });
    return gs;
  }

  function activeCity(gs){
    const value=debug(),id=value&&value.getSelectedCityId?value.getSelectedCityId():null;
    return playerCities(gs).find(function(city){return String(city.id)===String(id);})||playerCities(gs)[0]||null;
  }

  function learnBuildings(gs,city,civId){
    const exp=ensureExperience(gs), learned=[];
    (city.buildings||[]).forEach(function(id){
      if(!BUILDINGS[id]||id==="palace")return;
      if(!Array.isArray(exp.foreignBuildings[id]))exp.foreignBuildings[id]=[];
      if(exp.foreignBuildings[id].indexOf(civId)>=0)return;
      exp.foreignBuildings[id].push(civId); learned.push(id);
    });
    return learned;
  }

  function plunderScience(gs,civ,city){
    if(city.knowledgePlundered)return null;
    const candidates=(civ.technologies||[]).filter(function(id){return TECHS[id]&&!hasTech(gs,id);}).sort(function(a,b){
      const ar=(TECHS[a].prereq||[]).every(function(req){return hasTech(gs,req);})?1:0;
      const br=(TECHS[b].prereq||[]).every(function(req){return hasTech(gs,req);})?1:0;
      return br-ar||Number(TECHS[b].cost||0)-Number(TECHS[a].cost||0);
    });
    city.knowledgePlundered=true;
    if(!candidates.length)return null;
    const id=candidates[0], amount=Math.max(1,Math.round(Number(TECHS[id].cost||0)*PLUNDER_SCIENCE_SHARE));
    gs.techInsights[id]=Number(gs.techInsights[id]||0)+amount;
    return{id:id,amount:amount};
  }

  function applyInsight(gs){
    const id=gs&&gs.currentResearch;
    if(!id||!TECHS[id]||!Number(gs.techInsights&&gs.techInsights[id]))return false;
    const amount=Number(gs.techInsights[id]); gs.techInsights[id]=0;
    gs.resources.science=Number(gs.resources.science||0)+amount;
    addEvent(gs,"technology-insight-applied","Использованы захваченные знания по технологии «"+TECHS[id].name+"»: +"+amount+" науки.");
    return true;
  }

  function transferTerritory(gs,city,oldCivId){
    if(!window.EpohiUtils||!window.EpohiUtils.chebyshev)return;
    const radius=window.EpohiTerritory&&typeof window.EpohiTerritory.cityRadius==="function"?window.EpohiTerritory.cityRadius(city):(Number(city.population||1)>=6?3:Number(city.population||1)>=3?2:1);
    (gs.map||[]).forEach(function(row,y){row.forEach(function(tile,x){if(tile.owner===oldCivId&&window.EpohiUtils.chebyshev(city.x,city.y,x,y)<=radius)tile.owner=city.id;});});
  }

  function removeCity(civ,city){ civ.cities=(civ.cities||[]).filter(function(item){return String(item.id)!==String(city.id);}); }

  function chooseNewCapital(civ){
    if(!civ||!civ.cities||!civ.cities.length)return null;
    civ.cities.forEach(function(city){city.capital=false;});
    const next=civ.cities.slice().sort(function(a,b){return Number(b.population||0)-Number(a.population||0)||Number((b.buildings||[]).length)-Number((a.buildings||[]).length);})[0];
    next.capital=true; next.becameCapitalTurn=Number(state()&&state().turn)||1; return next;
  }

  function convertUnitsToBandits(gs,civ){
    const count=(civ.units||[]).length;
    (civ.units||[]).forEach(function(unit){
      const maxHp=Math.max(1,Number(unit.maxHp||75)), ratio=Math.max(.01,Math.min(1,Number(unit.hp||maxHp)/maxHp));
      gs.barbarians.push({id:"bandit-"+(gs.nextBanditId++),x:unit.x,y:unit.y,hp:Math.max(1,Math.round(maxHp*ratio)),maxHp:maxHp,homeX:unit.x,homeY:unit.y,last:null,bandit:true,formerCivilizationId:civ.civilizationId,formerCivilizationName:civ.name,formerUnitType:unit.type});
    });
    civ.units=[]; return count;
  }

  function finalizeFaction(gs,civ){
    const alive=(civ.cities||[]).filter(function(city){return Number(city.hp||0)>0;});
    if(alive.length){
      civ.defeated=false; if(civ.relation==="defeated")civ.relation="war";
      if(!alive.some(function(city){return city.capital;})){
        const next=chooseNewCapital(civ); if(next)addEvent(gs,"capital-relocated",civ.name+" перенёс столицу в "+next.name+".",civ.civilizationId,{x:next.x,y:next.y});
      }
      return false;
    }
    civ.defeated=true; civ.defeatedTurn=Number(gs.turn)||1; civ.relation="defeated";
    const bandits=convertUnitsToBandits(gs,civ);
    (gs.diplomaticProposals||[]).forEach(function(item){if(item.status==="pending"&&(item.civId===civ.civilizationId||item.targetId===civ.civilizationId))item.status="cancelled";});
    (gs.tradeRoutes||[]).forEach(function(route){if(route.civId===civ.civilizationId&&route.status==="active")route.status="cancelled";});
    addEvent(gs,"state-destroyed","Государство «"+civ.name+"» прекратило существование. Остатки армии и рабочих стали бандитами: "+bandits+".",civ.civilizationId);
    return true;
  }

  function recordCapture(gs,civ,city,choice){
    gs.captureHistory.unshift({turn:Number(gs.turn)||1,civId:civ.civilizationId,cityId:city.id,cityName:city.name,choice:choice});
    gs.captureHistory=gs.captureHistory.slice(0,120);
  }

  function annex(gs,civ,city){
    const wasCapital=!!city.capital, learned=learnBuildings(gs,city,civ.civilizationId);
    removeCity(civ,city); city.capturePending=false; city.capital=false; city.historicCapital=city.historicCapital||wasCapital;
    city.formerCivilizationId=civ.civilizationId; city.formerCivilizationName=civ.name;
    city.population=Math.max(1,Number(city.population||1)-1); city.hp=Math.max(1,Math.round(Number(city.maxHp||150)*.35));
    city.food=Math.floor(Number(city.food||0)*.5); city.production=Math.floor(Number(city.production||0)*.5); city.queue=null;
    if(!Array.isArray(gs.cities))gs.cities=gs.city?[gs.city]:[];
    if(!gs.cities.some(function(item){return String(item.id)===String(city.id);} ))gs.cities.push(city);
    transferTerritory(gs,city,civ.civilizationId); recordCapture(gs,civ,city,"annex");
    addEvent(gs,"city-captured","Ардена присоединила город "+city.name+". Население после осады: "+city.population+".",null,{x:city.x,y:city.y});
    if(learned.length)addEvent(gs,"captured-building-knowledge","Изучены чужие строительные приёмы: "+learned.map(function(id){return BUILDINGS[id].name+" +5%";}).join(", ")+".");
    if(wasCapital&&civ.cities.length){const next=chooseNewCapital(civ);if(next)addEvent(gs,"capital-relocated",civ.name+" перенёс столицу в "+next.name+".",civ.civilizationId,{x:next.x,y:next.y});}
    finalizeFaction(gs,civ); return true;
  }

  function plunder(gs,civ,city){
    const learned=learnBuildings(gs,city,civ.civilizationId), science=plunderScience(gs,civ,city), population=Math.max(1,Number(city.population||1));
    const gold=8+population*4, production=5+population*3;
    gs.resources.gold=Number(gs.resources.gold||0)+gold;
    const target=activeCity(gs); if(target)target.production=Number(target.production||0)+production;
    city.population=Math.max(1,population-1); city.hp=Math.max(1,Math.round(Number(city.maxHp||150)*.25)); city.queue=null; city.capturePending=false;
    recordCapture(gs,civ,city,"plunder");
    let text="Ардена разграбила "+city.name+": +"+gold+" золота, +"+production+" производства.";
    if(science)text+=" Захвачены знания по «"+TECHS[science.id].name+"»: +"+science.amount+" науки при её изучении.";
    addEvent(gs,"city-plundered",text,null,{x:city.x,y:city.y});
    if(learned.length)addEvent(gs,"captured-building-knowledge","Изучены здания города: "+learned.map(function(id){return BUILDINGS[id].name+" +5%";}).join(", ")+".");
    return true;
  }

  function liberate(gs,civ,city){
    const former=city.formerCivilizationId&&civById(gs,city.formerCivilizationId);
    if(!former||former===civ)return false;
    removeCity(civ,city); city.capturePending=false; city.capital=false; city.hp=Math.max(1,Math.round(Number(city.maxHp||150)*.5)); city.queue=null;
    former.cities=former.cities||[]; former.cities.push(city); former.defeated=false; if(!former.cities.some(function(item){return item.capital;}))chooseNewCapital(former);
    recordCapture(gs,civ,city,"liberate"); addEvent(gs,"city-liberated","Ардена освободила город "+city.name+" и вернула его государству "+former.name+".",former.civilizationId,{x:city.x,y:city.y});
    finalizeFaction(gs,civ); return true;
  }

  function ensureModal(){
    let modal=document.getElementById("captureChoiceModal"); if(modal)return modal;
    modal=document.createElement("div"); modal.id="captureChoiceModal"; modal.className="modal capture-choice-modal"; modal.setAttribute("role","dialog"); modal.setAttribute("aria-modal","true");
    modal.innerHTML='<section class="sheet"><header class="sheet-head"><h2>Город повержен</h2></header><div id="captureChoiceContent" class="sheet-scroll"></div></section>'; document.body.appendChild(modal);
    modal.addEventListener("click",function(event){
      const button=event.target.closest&&event.target.closest("[data-capture-choice]"); if(!button)return;
      const gs=ensureState(state()),civ=gs&&civById(gs,button.dataset.civId),city=civ&&(civ.cities||[]).find(function(item){return String(item.id)===String(button.dataset.cityId);});
      if(!gs||!civ||!city){modal.classList.remove("show");return;}
      const choice=button.dataset.captureChoice; if(choice==="annex")annex(gs,civ,city); else if(choice==="plunder")plunder(gs,civ,city); else if(choice==="liberate")liberate(gs,civ,city);
      gs.pendingCityCaptures=(gs.pendingCityCaptures||[]).filter(function(item){return String(item.cityId)!==String(city.id);}); modal.classList.remove("show");
      const value=debug(); if(value&&typeof value.render==="function")value.render(); schedule();
    }); return modal;
  }

  function showCapture(gs,civ,city){
    const modal=ensureModal(),content=document.getElementById("captureChoiceContent"),capacity=Number(gs.cityCapacity||4),after=playerCities(gs).length+1;
    const former=city.formerCivilizationId&&civById(gs,city.formerCivilizationId);
    content.innerHTML='<article class="capture-card"><h3>'+esc(city.name)+'</h3><p>'+esc(civ.name)+(city.capital?' · столица':'')+' · население '+Number(city.population||1)+'</p>'+ 
      '<button type="button" class="wide-btn" data-capture-choice="annex" data-civ-id="'+esc(civ.civilizationId)+'" data-city-id="'+esc(city.id)+'">Присоединить<small>Население −1 · здания и специализация сохранятся · города '+after+'/'+capacity+(after>capacity?' ⚠ сверх лимита':'')+'</small></button>'+ 
      '<button type="button" class="wide-btn secondary" data-capture-choice="plunder" data-civ-id="'+esc(civ.civilizationId)+'" data-city-id="'+esc(city.id)+'">Разграбить и отойти<small>Добыча · +5% знания по каждому увиденному здесь типу здания · 20% чужой неизвестной технологии</small></button>'+ 
      (former&&former!==civ?'<button type="button" class="wide-btn secondary" data-capture-choice="liberate" data-civ-id="'+esc(civ.civilizationId)+'" data-city-id="'+esc(city.id)+'">Освободить<small>Вернуть прежнему владельцу: '+esc(former.name)+'</small></button>':'')+'</article>';
    if(window.EpohiDiplomacyEventFlow&&typeof window.EpohiDiplomacyEventFlow.dismissToast==="function")window.EpohiDiplomacyEventFlow.dismissToast();
    modal.classList.add("show");
  }

  function queueCapture(gs,civ,city){
    ensureState(gs); if(!civ||!city||city.capturePending)return false;
    city.capturePending=true; city.hp=0;
    gs.pendingCityCaptures.push({id:"capture-"+(++captureCounter)+"-"+city.id,civId:civ.civilizationId,cityId:city.id,turn:Number(gs.turn)||1,wasCapital:!!city.capital});
    showCapture(gs,civ,city); return true;
  }

  function checkFallen(gs){
    let shown=false;
    (gs.rivals||[]).forEach(function(civ){
      if(civ.defeated&&(civ.cities||[]).length)civ.defeated=false;
      (civ.cities||[]).forEach(function(city){if(Number(city.hp||0)<=0&&!city.capturePending&&!shown)shown=queueCapture(gs,civ,city)||shown;});
    }); return shown;
  }

  function wrapFactionDefeat(){
    const stability=window.EpohiCombatWorldStability; if(!stability||stability.captureStateWrapped||typeof stability.resolveFactionDefeat!=="function")return;
    stability.captureStateWrapped=true; originalFactionDefeat=stability.resolveFactionDefeat;
    stability.resolveFactionDefeat=function(gs,civ,captor){
      ensureState(gs); if(!civ)return false;
      const fallen=(civ.cities||[]).find(function(city){return city.capital&&Number(city.hp||0)<=0;})||(civ.cities||[]).find(function(city){return Number(city.hp||0)<=0;});
      if(captor===gs||!captor||captor.id==="player")return fallen?queueCapture(gs,civ,fallen):false;
      if(!fallen)return false;
      removeCity(civ,fallen); fallen.capital=false; fallen.formerCivilizationId=civ.civilizationId; fallen.formerCivilizationName=civ.name; fallen.population=Math.max(1,Number(fallen.population||1)-1); fallen.hp=Math.max(1,Math.round(Number(fallen.maxHp||150)*.35)); fallen.queue=null;
      captor.cities=captor.cities||[]; captor.cities.push(fallen); if(civ.cities.length&&!civ.cities.some(function(city){return city.capital;}))chooseNewCapital(civ); finalizeFaction(gs,civ);
      addEvent(gs,"city-captured",(captor.name||"Держава")+" захватил город "+fallen.name+" у "+civ.name+".",captor.civilizationId,{x:fallen.x,y:fallen.y}); return true;
    };
  }

  function wrapPathing(){
    const pathing=window.EpohiHumansPathing; if(!pathing||pathing.captureStateWrapped)return; pathing.captureStateWrapped=true;
    originalAssignTravelOrder=pathing.assignTravelOrder; originalProcessOrders=pathing.processOrders;
    pathing.assignTravelOrder=function(){const result=originalAssignTravelOrder.apply(this,arguments),gs=ensureState(state());if(gs)checkFallen(gs);return result;};
    pathing.processOrders=function(){const result=originalProcessOrders.apply(this,arguments),gs=ensureState(arguments[0]||state());if(gs)checkFallen(gs);return result;};
  }

  function chooseSpecialization(civ){
    const key=String(civ.cultureKey||""),p=String(civ.personality||"");
    if(key==="velm"||p.indexOf("Купец")>=0)return"gold";
    if(key==="zarr"||p.indexOf("Завоеватель")>=0)return"production";
    if(key==="varkesh"||p.indexOf("Интриган")>=0)return"science";
    return"food";
  }

  function processAiSpecializations(gs){
    (gs.rivals||[]).forEach(function(civ){if(civ.defeated)return;(civ.cities||[]).forEach(function(city){
      if(Number(city.population||0)<3||city.specialization)return; city.specialization=chooseSpecialization(civ);
      addEvent(gs,"rival-city-specialized",civ.name+": город "+city.name+" выбрал специализацию «"+SPECIALIZATION_NAMES[city.specialization]+"».",civ.civilizationId,{x:city.x,y:city.y});
    });});
  }

  function processAiSpecializationYield(gs){
    if(gs.captureStateSpecializationTurn===gs.turn)return; gs.captureStateSpecializationTurn=gs.turn;
    (gs.rivals||[]).forEach(function(civ){if(civ.defeated)return;(civ.cities||[]).forEach(function(city){
      if(city.specialization==="food")city.food=Number(city.food||0)+2;
      else if(city.specialization==="production")city.production=Number(city.production||0)+2;
      else if(city.specialization==="science")civ.resources.science=Number(civ.resources.science||0)+2;
      else if(city.specialization==="gold")civ.resources.gold=Number(civ.resources.gold||0)+2;
    });});
  }

  function wrapLiving(){
    const living=window.EpohiLivingCivilizations; if(!living||living.captureStateWrapped||typeof living.processTurn!=="function")return;
    living.captureStateWrapped=true; originalLivingProcessTurn=living.processTurn;
    living.processTurn=function(gs){const result=originalLivingProcessTurn.apply(this,arguments);ensureState(gs);processAiSpecializations(gs);processAiSpecializationYield(gs);return result;};
  }

  function handleResearchClick(event){if(!event.target.closest||!event.target.closest("[data-research]"))return;window.setTimeout(function(){const gs=ensureState(state());if(gs&&applyInsight(gs)){const value=debug();if(value&&typeof value.render==="function")value.render();}},0);}

  function onTurn(){const gs=ensureState(state());if(!gs)return;applyInsight(gs);checkFallen(gs);schedule();}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;const gs=ensureState(state());if(gs)checkFallen(gs);});}

  function installStyles(){
    if(document.getElementById("captureStateStyles"))return; const style=document.createElement("style"); style.id="captureStateStyles";
    style.textContent='.capture-choice-modal{z-index:185!important;align-items:center!important;justify-content:center!important;padding:14px!important}.capture-choice-modal .sheet{width:min(560px,calc(100vw - 28px))!important;max-height:min(84dvh,720px)!important;margin:auto!important;border-radius:18px!important}.capture-card{padding:8px 2px 14px}.capture-card h3{font-size:20px;margin:6px 0}.capture-card>.wide-btn{margin-top:8px;text-align:left}.capture-card>.wide-btn small{display:block;margin-top:4px;font-size:9px;line-height:1.3;opacity:.8}@media(max-width:520px){.capture-choice-modal{padding:10px!important}.capture-card h3{font-size:18px}}'; document.head.appendChild(style);
  }

  function install(){installStyles();ensureModal();ensureState(state());wrapFactionDefeat();wrapPathing();wrapLiving();window.addEventListener("click",handleResearchClick,true);const turn=document.getElementById("turnValue");if(turn)new MutationObserver(onTurn).observe(turn,{childList:true,characterData:true,subtree:true});schedule();}

  window.EpohiCaptureState={version:1,ensureState:ensureState,learnBuildings:learnBuildings,plunderScience:plunderScience,applyInsight:applyInsight,annex:annex,plunder:plunder,liberate:liberate,queueCapture:queueCapture,finalizeFaction:finalizeFaction,processAiSpecializations:processAiSpecializations};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
