(function () {
  "use strict";

  const { UNIT_DEFS, AI_LIMITS, AI_PRODUCTION_RULES } = window.EpohiData;
  const { chebyshev } = window.EpohiUtils;

  function produceForAi(state,civ,options){
    const damaged=(civ.units||[]).filter(function(unit){return unit.hp>0&&unit.hp<unit.maxHp*AI_PRODUCTION_RULES.emergencyHealHealthFraction;}).sort(function(a,b){return a.hp/a.maxHp-b.hp/b.maxHp;})[0];
    if(damaged&&(civ.resources.gold||0)>=AI_PRODUCTION_RULES.emergencyHealGold){civ.resources.gold-=AI_PRODUCTION_RULES.emergencyHealGold;damaged.hp=Math.min(damaged.maxHp,damaged.hp+AI_PRODUCTION_RULES.emergencyHealAmount);options.logEvent(state,'rival-emergency-heal',civ.name+' оплачивает лечение защитников.',{x:damaged.x,y:damaged.y},{actorType:'civilization',actorId:civ.civilizationId,phase:'rivals'});}
    (civ.cities||[]).forEach(function(city){
      if(!city.queue){
        const context={
          threat:state.barbarians.some(function(b){return chebyshev(b.x,b.y,city.x,city.y)<=AI_PRODUCTION_RULES.queueThreatDistance;}),
          warriors:civ.units.filter(function(u){return u.type==='warrior';}).length,
          workers:civ.units.filter(function(u){return u.type==='worker';}).length,
          scouts:civ.units.filter(function(u){return u.type==='scout';}).length,
          canSettle:civ.cities.length<AI_LIMITS.maxCities
        };
        let type=options.chooseProduction?options.chooseProduction(civ,context):(context.threat||context.warriors<AI_PRODUCTION_RULES.minimumWarriors?'warrior':(context.workers<AI_PRODUCTION_RULES.minimumWorkers?'worker':(context.canSettle?'settler':'scout')));
        const def=UNIT_DEFS[type]; const productionCost=options.unitProductionCost?options.unitProductionCost(civ,type):(def.cost.production||0); city.queue={type:'unit',id:type,progress:0,cost:productionCost,upfront:{gold:def.cost.gold||0}};
        if(def.cost.gold)civ.resources.gold=Math.max(0,civ.resources.gold-def.cost.gold);
      }
      const inc=options.cityIncome(city); city.food=(city.food||0)+inc.food; civ.resources.gold+=inc.gold; civ.resources.science+=inc.science; city.queue.progress+=inc.production;
      const threatened=state.barbarians.some(function(b){return chebyshev(b.x,b.y,city.x,city.y)<=AI_PRODUCTION_RULES.rushThreatDistance;})||state.units.some(function(u){return civ.relation==='war'&&chebyshev(u.x,u.y,city.x,city.y)<=AI_PRODUCTION_RULES.rushThreatDistance;});
      if(threatened&&city.queue&&city.queue.id==='warrior'&&(civ.resources.gold||0)>=AI_PRODUCTION_RULES.rushGold&&city.queue.cost-city.queue.progress>AI_PRODUCTION_RULES.rushMinimumRemaining){civ.resources.gold-=AI_PRODUCTION_RULES.rushGold;city.queue.progress+=AI_PRODUCTION_RULES.rushProgress;options.logEvent(state,'rival-production-rush',civ.name+' ускоряет подготовку защитников в '+city.name+'.',{x:city.x,y:city.y},{actorType:'civilization',actorId:civ.civilizationId,phase:'rivals'});}
      if(city.queue.progress>=city.queue.cost){
        const type=city.queue.id,def=UNIT_DEFS[type]; civ.units.push({id:'ru'+(state.nextRivalUnitId++),civilizationId:civ.civilizationId,type:type,x:city.x,y:city.y,moves:0,acted:false,hp:def.maxHealth,maxHp:def.maxHealth});
        options.recordCompletion(civ,'unit',type);
        options.logEvent(state,'city-production-completed',civ.name+': '+city.name+' подготовил '+def.name+'.',{x:city.x,y:city.y},{actorType:'civilization',actorId:civ.civilizationId,phase:'rivals'}); city.queue=null;
      }
    });
  }

  window.EpohiAiProduction = { produceForAi: produceForAi };
})();
