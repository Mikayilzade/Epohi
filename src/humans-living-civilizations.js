(function () {
  "use strict";
  const PERSONALITIES = {
    zarr:{name:"Завоеватель",strategy:"военная экспансия",aggression:.82,generosity:.18,commerce:.25},
    velm:{name:"Купец",strategy:"торговля и богатство",aggression:.22,generosity:.48,commerce:.92},
    elaria:{name:"Хранитель",strategy:"рост, оборона и союзы",aggression:.12,generosity:.86,commerce:.55},
    varkesh:{name:"Интриган",strategy:"наука и дипломатическое давление",aggression:.55,generosity:.28,commerce:.62}
  };
  const LABELS={trade:"Торговый договор",gift:"Дар",alliance:"Союз",peace:"Мир",threat:"Угроза",jointWar:"Совместная война"};
  let lastTurn=0;
  function debug(){return typeof window.__epohiDebug==="function"?window.__epohiDebug():null;}
  function state(){const d=debug();return d&&d.state;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function profile(c){return PERSONALITIES[c.cultureKey]||PERSONALITIES.elaria;}
  function escapeText(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  function worldEvent(gs,type,text,civ,position){
    const item={id:"living-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),turn:gs.turn,eventType:type,text:text,position:position||null,actorType:"civilization",actorId:civ&&civ.civilizationId,phase:"diplomacy"};
    gs.eventLog=Array.isArray(gs.eventLog)?gs.eventLog:[];gs.eventLog.unshift(item);gs.eventLog=gs.eventLog.slice(0,240);
    gs.livingWorldEvents=Array.isArray(gs.livingWorldEvents)?gs.livingWorldEvents:[];gs.livingWorldEvents.unshift(item);gs.livingWorldEvents=gs.livingWorldEvents.slice(0,60);
  }
  function migrate(gs){
    if(!gs)return false;let changed=gs.diplomacySchemaVersion!==2;gs.diplomacySchemaVersion=2;
    if(!Array.isArray(gs.diplomaticProposals)){gs.diplomaticProposals=[];changed=true;}if(!Array.isArray(gs.livingWorldEvents)){gs.livingWorldEvents=[];changed=true;}
    (gs.rivals||[]).forEach(function(c){const p=profile(c),d=c.diplomacy||(c.diplomacy={}),score=Number(d.score)||0;
      if(!Number.isFinite(d.trust)){d.trust=clamp(35+score,0,100);changed=true;}if(!Number.isFinite(d.fear)){d.fear=c.relation==="war"?45:15;changed=true;}
      if(!Number.isFinite(d.grievances)){d.grievances=score<0?Math.abs(score):0;changed=true;}if(!Array.isArray(d.memories)){d.memories=[];changed=true;}if(!Array.isArray(d.history))d.history=[];
      if(!c.personality){c.personality=p.name;c.developmentStrategy=p.strategy;changed=true;}c.technologies=Array.isArray(c.technologies)?c.technologies:[];
    });return changed;
  }
  function remember(c,kind,amount,reason){const gs=state()||{turn:1},d=c.diplomacy;d.memories.unshift({turn:gs.turn,kind:kind,amount:amount,reason:reason});d.memories=d.memories.slice(0,30);d.history.unshift("Ход "+gs.turn+": "+reason+" ("+(amount>=0?"+":"")+amount+")");d.history=d.history.slice(0,30);}
  function change(c,field,amount,reason){const d=c.diplomacy;d[field]=clamp((Number(d[field])||0)+amount,0,100);d.score=clamp(Math.round(d.trust*.7-d.fear*.25-d.grievances*.65),-50,50);remember(c,field,amount,reason);}
  function propose(gs,c,type,text,targetId){if(gs.diplomaticProposals.some(p=>p.status==="pending"&&p.civId===c.civilizationId&&p.type===type))return null;const p={id:"proposal-"+gs.turn+"-"+c.civilizationId+"-"+type,turn:gs.turn,civId:c.civilizationId,type:type,targetId:targetId||null,text:text,status:"pending"};gs.diplomaticProposals.unshift(p);worldEvent(gs,"diplomatic-proposal",c.name+": «"+text+"»",c);return p;}
  function chooseProposal(gs,c){if(!c.met||c.defeated||gs.turn%4!==(Number(String(c.civilizationId).replace(/\D/g,""))||0)%4)return;const d=c.diplomacy,p=profile(c);
    if(c.relation==="war")return propose(gs,c,"peace","Предлагаем мир: взаимная вражда уже слишком дорога.");
    if(d.grievances>=45)return propose(gs,c,"threat","Возместите старые обиды даром, иначе последует война.");
    if(c.relation!=="ally"&&d.trust>=62)return propose(gs,c,"alliance","Наше доверие окрепло. Заключим союз?");
    const enemy=(gs.rivals||[]).find(o=>o!==c&&o.relation==="war");if(c.relation==="ally"&&enemy)return propose(gs,c,"jointWar","Выступим вместе против "+enemy.name+".",enemy.civilizationId);
    if(p.generosity>.7&&gs.turn%8===0)return propose(gs,c,"gift","Примите 12 золота в память о нашей дружбе.");if(p.commerce>.5)return propose(gs,c,"trade","Откроем торговый путь: обе стороны получат золото.");
  }
  function alliedHelp(gs,c){if(c.relation!=="ally")return;const city=gs.city||(gs.cities||[])[0];if(!city)return;const danger=(gs.barbarians||[]).slice().sort((a,b)=>Math.max(Math.abs(a.x-city.x),Math.abs(a.y-city.y))-Math.max(Math.abs(b.x-city.x),Math.abs(b.y-city.y)))[0];const soldiers=(c.units||[]).filter(u=>u.hp>0&&u.type!=="worker"&&u.type!=="settler");
    if(danger&&soldiers.length){const u=soldiers[0],distance=Math.max(Math.abs(u.x-danger.x),Math.abs(u.y-danger.y));if(distance<=1){const def=window.EpohiData.UNIT_DEFS[u.type]||{};danger.hp-=Math.max(5,(def.attack||8)-3);worldEvent(gs,"allied-battle",c.name+" пришёл на помощь и атаковал варваров.",c,{x:danger.x,y:danger.y});remember(c,"help",5,"Союзники вместе сражались с варварами");if(danger.hp<=0)gs.barbarians=gs.barbarians.filter(b=>b!==danger);}else if(distance<=9&&debug()&&debug().stepToward){debug().stepToward(u,danger,c);worldEvent(gs,"allied-aid",c.name+" направляет отряд против угрозы Ардене.",c,{x:u.x,y:u.y});}}
    const enemy=(gs.rivals||[]).find(o=>o!==c&&o.relation==="war");if(enemy&&c.diplomacy[enemy.civilizationId]!=="war"){c.diplomacy[enemy.civilizationId]="war";worldEvent(gs,"joint-war-declared",c.name+" выполняет союзный долг и вступает в войну против "+enemy.name+".",c);}
  }
  function develop(gs,c){const p=profile(c);c.strategicGoal=p.strategy;if(gs.turn%6===0&&c.resources&&(c.resources.science||0)>=12){const paths=p.aggression>.6?["army","fortifications"]:(p.commerce>.7?["trade","writing"]:["agriculture","engineering"]),tech=paths.find(id=>c.technologies.indexOf(id)<0);if(tech){c.technologies.push(tech);c.resources.science-=12;worldEvent(gs,"rival-technology-completed",c.name+" развил технологию «"+tech+"».",c);}}}
  function processTurn(gs){migrate(gs);(gs.rivals||[]).forEach(function(c){develop(gs,c);alliedHelp(gs,c);chooseProposal(gs,c);if(c.diplomacy.grievances>0&&gs.turn%5===0)change(c,"grievances",-1,"время понемногу смягчило старые обиды");});}
  function resolve(id,accepted){const gs=state(),p=gs&&gs.diplomaticProposals.find(x=>x.id===id);if(!p||p.status!=="pending")return false;const c=gs.rivals.find(x=>x.civilizationId===p.civId);if(!c)return false;p.status=accepted?"accepted":"declined";p.resolvedTurn=gs.turn;
    if(!accepted)change(c,"trust",-5,"Ардена отклонила предложение «"+LABELS[p.type]+"»");else if(p.type==="trade"){gs.resources.gold+=8;c.resources.gold+=8;change(c,"trust",7,"торговый договор оказался взаимовыгодным");}else if(p.type==="gift"){gs.resources.gold+=12;change(c,"trust",5,"Ардена с благодарностью приняла дар");}else if(p.type==="alliance"){c.relation="ally";change(c,"trust",12,"заключён союз");}else if(p.type==="peace"){c.relation="neutral";c.warStartTurn=null;change(c,"grievances",-20,"заключён мир");}else if(p.type==="threat"){if(gs.resources.gold>=10)gs.resources.gold-=10;change(c,"grievances",-12,"Ардена уступила дипломатическому давлению");}else if(p.type==="jointWar"){const target=gs.rivals.find(x=>x.civilizationId===p.targetId);if(target){target.relation="war";change(c,"trust",10,"Ардена поддержала совместную войну");worldEvent(gs,"joint-war-declared","Ардена и "+c.name+" объявили совместную войну: "+target.name+".",c);}}
    worldEvent(gs,"major-diplomatic-event",(accepted?"Принято: ":"Отклонено: ")+LABELS[p.type]+" — "+c.name+".",c);if(debug()&&debug().render)debug().render();render();return true;
  }
  function render(){const gs=state();if(!gs)return;migrate(gs);document.querySelectorAll("[data-diplomacy-civ]").forEach(function(card){const c=gs.rivals.find(x=>x.civilizationId===card.dataset.diplomacyCiv);if(!c)return;let box=card.querySelector(".living-relation-details");if(!box){box=document.createElement("div");box.className="living-relation-details";card.querySelector(".strategy-diplomacy-actions").before(box);}box.innerHTML="<div><b>Доверие "+c.diplomacy.trust+"</b><b>Страх "+c.diplomacy.fear+"</b><b>Обиды "+c.diplomacy.grievances+"</b></div><small>Личность: "+escapeText(c.personality)+" · Стратегия: "+escapeText(c.developmentStrategy)+"</small>"+(c.diplomacy.history.length?"<ul>"+c.diplomacy.history.slice(0,3).map(h=>"<li>"+escapeText(h)+"</li>").join("")+"</ul>":"");});
    let panel=document.getElementById("livingProposals");if(!panel){panel=document.createElement("aside");panel.id="livingProposals";panel.className="living-proposals";document.getElementById("gameApp").appendChild(panel);panel.addEventListener("click",function(e){const b=e.target.closest("[data-proposal]");if(b)resolve(b.dataset.proposal,b.dataset.answer==="yes");});}const pending=gs.diplomaticProposals.filter(p=>p.status==="pending");panel.innerHTML=pending.slice(0,2).map(function(p){const c=gs.rivals.find(x=>x.civilizationId===p.civId);return "<article><small>"+LABELS[p.type]+" · "+escapeText(c?c.name:"")+"</small><p>"+escapeText(p.text)+"</p><button data-proposal=\""+p.id+"\" data-answer=\"yes\">Принять</button><button class=\"secondary\" data-proposal=\""+p.id+"\" data-answer=\"no\">Отклонить</button></article>";}).join("");panel.classList.toggle("show",pending.length>0);
  }
  function tick(){const gs=state();if(gs){migrate(gs);if(gs.turn!==lastTurn){lastTurn=gs.turn;processTurn(gs);}render();}window.setTimeout(tick,350);}
  window.EpohiLivingCivilizations={version:2,personalities:PERSONALITIES,migrate:migrate,processTurn:processTurn,resolveProposal:resolve,changeRelationship:change,createProposal:propose,alliedHelp:alliedHelp,worldEvent:worldEvent};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",tick,{once:true});else tick();
})();
