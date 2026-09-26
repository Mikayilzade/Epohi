(function () {
  "use strict";

  if (!window.EpohiHumansJourneyData || !window.EpohiUtils) {
    throw new Error("Journey data and utils are required before humans-journey-core.js");
  }

  const DATA = window.EpohiHumansJourneyData;
  const { chebyshev } = window.EpohiUtils;
  let pendingScenario = null;
  let pendingScenarioArmed = false;
  let syncing = false;

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function state() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function cities(gs) {
    const list = Array.isArray(gs.cities) ? gs.cities : (gs.city ? [gs.city] : []);
    return list.filter(function (city) { return typeof city.hp !== "number" || city.hp > 0; });
  }

  function cityIds(gs) {
    const ids = new Set();
    cities(gs).forEach(function (city) { ids.add(city.id); ids.add(city.name); });
    return ids;
  }

  function totalPopulation(gs) {
    return cities(gs).reduce(function (sum, city) { return sum + (Number(city.population) || 0); }, 0);
  }

  function improvements(gs) {
    const owners = cityIds(gs);
    let count = 0;
    (gs.map || []).forEach(function (row) {
      row.forEach(function (tile) {
        if (tile.improvement && !tile.pillaged && owners.has(tile.owner)) count += 1;
      });
    });
    return count;
  }

  function buildings(gs) {
    return cities(gs).reduce(function (sum, city) { return sum + (city.buildings || []).length; }, 0);
  }

  function hasBuilding(gs, id) {
    return cities(gs).some(function (city) { return (city.buildings || []).includes(id); });
  }

  function revealed(gs) {
    let count = 0;
    (gs.map || []).forEach(function (row) { row.forEach(function (tile) { if (tile.revealed) count += 1; }); });
    return count;
  }

  function military(gs) {
    return (gs.units || []).filter(function (unit) {
      return !["worker", "scout", "settler"].includes(unit.type) && (typeof unit.hp !== "number" || unit.hp > 0);
    }).length;
  }

  function objective(label, current, target) {
    return { label: label, current: current, target: target, done: current >= target };
  }

  function log(gs, type, text) {
    gs.eventCounter = (gs.eventCounter || 0) + 1;
    if (!Array.isArray(gs.eventLog)) gs.eventLog = [];
    gs.eventLog.unshift({
      eventId: "ev" + gs.eventCounter,
      turn: gs.turn || 1,
      phase: "player",
      actorType: "system",
      actorId: null,
      eventType: type,
      text: text,
      coordinates: null,
      data: {}
    });
    gs.eventLog = gs.eventLog.slice(0, 180);
    if (!Array.isArray(gs.history)) gs.history = [];
    gs.history.unshift("Ход " + (gs.turn || 1) + ": " + text);
    gs.history = gs.history.slice(0, 60);
  }

  function inferScenario(gs) {
    if (gs.mapSize <= 20 && (gs.rivals || []).length === 0) return "peaceful";
    if (gs.barbarianActivity === "high") return "frontier";
    if ((gs.rivals || []).length >= 2) return "rivalry";
    return "balanced";
  }

  function armScenario(key) {
    pendingScenario = DATA.scenarios[key] ? key : "balanced";
    pendingScenarioArmed = true;
  }

  function ensure(gs) {
    if (!gs) return null;
    const old = gs.humanJourney || {};
    if (old.version !== DATA.version) {
      gs.humanJourney = {
        version: DATA.version,
        scenario: old.scenario || null,
        chapter: Number.isFinite(old.chapter) ? old.chapter : 0,
        completedChapters: Array.isArray(old.completedChapters) ? old.completedChapters : [],
        rewardKeys: Array.isArray(old.rewardKeys) ? old.rewardKeys : [],
        queuedEvents: Array.isArray(old.queuedEvents) ? old.queuedEvents : [],
        resolvedEvents: Array.isArray(old.resolvedEvents) ? old.resolvedEvents : [],
        lastBonusTurn: Number.isFinite(old.lastBonusTurn) ? old.lastBonusTurn : (gs.turn || 1),
        scenarioBonusGranted: !!old.scenarioBonusGranted
      };
    }
    const journey = gs.humanJourney;
    ["completedChapters", "rewardKeys", "queuedEvents", "resolvedEvents"].forEach(function (key) {
      if (!Array.isArray(journey[key])) journey[key] = [];
    });
    if (!Number.isFinite(journey.chapter)) journey.chapter = 0;
    if (!Number.isFinite(journey.lastBonusTurn)) journey.lastBonusTurn = gs.turn || 1;
    if (!journey.scenario) {
      journey.scenario = pendingScenarioArmed && pendingScenario ? pendingScenario : inferScenario(gs);
      pendingScenarioArmed = false;
    }
    return journey;
  }

  function grantScenarioBonus(gs, journey) {
    if (journey.scenarioBonusGranted) return false;
    const capital = cities(gs)[0] || gs.city;
    if (!capital) return false;
    if (journey.scenario === "peaceful") gs.resources.science = (gs.resources.science || 0) + 5;
    else if (journey.scenario === "frontier") capital.production = (capital.production || 0) + 8;
    else if (journey.scenario === "rivalry") gs.resources.gold = (gs.resources.gold || 0) + 8;
    else capital.food = (capital.food || 0) + 4;
    journey.scenarioBonusGranted = true;
    return true;
  }

  function objectives(gs, index) {
    if (index === 0) {
      return [
        objective("Изучить первую технологию", (gs.researched || []).length, 1),
        objective("Построить первое улучшение", improvements(gs), 1),
        objective("Дожить до 4 хода", gs.turn || 1, 4)
      ];
    }
    if (index === 1) {
      return [
        objective("Открыть земли", revealed(gs), gs.mapSize <= 20 ? 45 : 60),
        objective("Построить здание", buildings(gs), 1),
        objective("Иметь четыре юнита", (gs.units || []).length, 4)
      ];
    }
    if (index === 2) {
      return [
        objective("Основать второй город", cities(gs).length, 2),
        objective("Достичь общего населения 5", totalPopulation(gs), 5),
        objective("Иметь три улучшения", improvements(gs), 3)
      ];
    }
    if (index === 3) {
      return [
        objective("Изучить Законы", (gs.researched || []).includes("laws") ? 1 : 0, 1),
        objective("Построить Совет", hasBuilding(gs, "council") ? 1 : 0, 1),
        objective("Иметь два военных отряда", military(gs), 2)
      ];
    }
    if (window.EpohiHumansOutcomes) {
      return window.EpohiHumansOutcomes.statehoodProgress(gs).requirements.map(function (item) {
        return {
          label: item.label,
          current: item.current == null ? (item.done ? 1 : 0) : item.current,
          target: item.target == null ? 1 : item.target,
          done: item.done
        };
      });
    }
    return [objective("Изучить Государственность", (gs.researched || []).includes("statehood") ? 1 : 0, 1)];
  }

  function progress(gs) {
    const journey = ensure(gs);
    const index = Math.min(journey.chapter, DATA.chapters.length - 1);
    const list = objectives(gs, index);
    return {
      index: index,
      chapter: DATA.chapters[index],
      objectives: list,
      done: list.filter(function (item) { return item.done; }).length,
      complete: list.every(function (item) { return item.done; })
    };
  }

  function rewardChapter(gs, index) {
    const capital = cities(gs)[0];
    if (index === 0) {
      if (capital) { capital.food = (capital.food || 0) + 10; capital.production = (capital.production || 0) + 8; }
      gs.resources.science = (gs.resources.science || 0) + 4;
    } else if (index === 1) {
      gs.resources.gold = (gs.resources.gold || 0) + 12;
      gs.resources.science = (gs.resources.science || 0) + 10;
      (gs.units || []).forEach(function (unit) { if (unit.type === "scout") unit.hp = unit.maxHp; });
    } else if (index === 2) {
      cities(gs).forEach(function (city) { city.food = (city.food || 0) + 8; city.production = (city.production || 0) + 8; });
    } else if (index === 3) {
      gs.resources.gold = (gs.resources.gold || 0) + 18;
      gs.resources.science = (gs.resources.science || 0) + 12;
      (gs.units || []).forEach(function (unit) {
        if (!["worker", "scout", "settler"].includes(unit.type)) unit.hp = Math.min(unit.maxHp, unit.hp + 25);
      });
    }
  }

  function completeChapters(gs, journey) {
    let changed = false;
    while (journey.chapter < DATA.chapters.length - 1) {
      const current = progress(gs);
      if (!current.complete) break;
      const chapter = current.chapter;
      if (!journey.rewardKeys.includes(chapter.id)) {
        rewardChapter(gs, current.index);
        journey.rewardKeys.push(chapter.id);
        journey.completedChapters.push(chapter.id);
        log(gs, "journey-chapter-completed", "Завершена глава «" + chapter.title + "».");
      }
      journey.chapter += 1;
      changed = true;
    }
    return changed;
  }

  function queueEvent(gs, journey) {
    if (journey.queuedEvents.length) return false;
    const next = DATA.events.find(function (event) {
      return (gs.turn || 1) >= event.minTurn &&
        !journey.resolvedEvents.includes(event.id) &&
        !journey.queuedEvents.includes(event.id);
    });
    if (!next) return false;
    journey.queuedEvents.push(next.id);
    log(gs, "story-decision-ready", "Требуется решение: «" + next.title + "».");
    return true;
  }

  function eventById(id) {
    return DATA.events.find(function (event) { return event.id === id; }) || null;
  }

  function canAfford(gs, choice) {
    const capital = cities(gs)[0] || gs.city;
    const cost = choice.cost || {};
    if (cost.gold && (gs.resources.gold || 0) < cost.gold) return false;
    if (cost.cityFood && (!capital || (capital.food || 0) < cost.cityFood)) return false;
    if (cost.cityProduction && (!capital || (capital.production || 0) < cost.cityProduction)) return false;
    return true;
  }

  function revealCapital(gs, radius) {
    const capital = cities(gs).find(function (city) { return city.capital; }) || cities(gs)[0];
    if (!capital) return;
    for (let y = Math.max(0, capital.y - radius); y <= Math.min(gs.map.length - 1, capital.y + radius); y += 1) {
      for (let x = Math.max(0, capital.x - radius); x <= Math.min(gs.map[y].length - 1, capital.x + radius); x += 1) {
        if (chebyshev(capital.x, capital.y, x, y) <= radius) gs.map[y][x].revealed = true;
      }
    }
  }

  function applyChoice(gs, event, choice) {
    const capital = cities(gs)[0] || gs.city;
    const cost = choice.cost || {};
    if (cost.gold) gs.resources.gold -= cost.gold;
    if (cost.cityFood) capital.food -= cost.cityFood;
    if (cost.cityProduction) capital.production -= cost.cityProduction;

    if (event.id === "wandering-smith") {
      if (choice.id === "hire") capital.production = (capital.production || 0) + 18;
      else gs.resources.science = (gs.resources.science || 0) + 10;
    } else if (event.id === "refugees") {
      if (choice.id === "welcome") capital.population = Math.min(10, (capital.population || 1) + 1);
      else { capital.food = (capital.food || 0) + 4; capital.production = (capital.production || 0) + 10; }
    } else if (event.id === "old-map") {
      if (choice.id === "follow") revealCapital(gs, 4);
      else gs.resources.gold = (gs.resources.gold || 0) + 16;
    } else if (event.id === "border-feud") {
      if (choice.id === "fortify") {
        (gs.units || []).forEach(function (unit) {
          if (!["worker", "scout", "settler"].includes(unit.type)) { unit.maxHp += 5; unit.hp += 5; }
        });
      } else {
        gs.resources.science = (gs.resources.science || 0) + 12;
        gs.resources.gold = (gs.resources.gold || 0) + 4;
      }
    } else if (event.id === "festival") {
      if (choice.id === "harvest") {
        cities(gs).forEach(function (city) { city.food = (city.food || 0) + 8; });
        (gs.units || []).forEach(function (unit) { unit.hp = Math.min(unit.maxHp, unit.hp + 12); });
      } else {
        cities(gs).forEach(function (city) { city.production = (city.production || 0) + 8; });
        gs.resources.science = (gs.resources.science || 0) + 8;
      }
    }
  }

  function resolveEvent(eventId, choiceId) {
    const gs = state();
    if (!gs) return false;
    const journey = ensure(gs);
    const event = eventById(eventId);
    const choice = event && event.choices.find(function (item) { return item.id === choiceId; });
    if (!event || !choice || !journey.queuedEvents.includes(eventId) || !canAfford(gs, choice)) return false;
    applyChoice(gs, event, choice);
    journey.queuedEvents = journey.queuedEvents.filter(function (id) { return id !== eventId; });
    journey.resolvedEvents.push(eventId);
    log(gs, "story-decision-resolved", event.title + ": " + choice.label + ".");
    const value = debug();
    if (value && typeof value.render === "function") value.render();
    sync({ render: false });
    return true;
  }

  function chooseSpecialization(cityId, key) {
    const gs = state();
    const city = gs && cities(gs).find(function (item) { return item.id === cityId; });
    if (!city || city.specialization || city.population < 3 || !DATA.specializations[key]) return false;
    city.specialization = key;
    log(gs, "city-specialized", city.name + " выбрал специализацию «" + DATA.specializations[key].name + "».");
    return true;
  }

  function specializationBonuses(gs, journey) {
    const current = gs.turn || 1;
    if (current <= journey.lastBonusTurn) return false;
    const elapsed = Math.min(5, current - journey.lastBonusTurn);
    for (let i = 0; i < elapsed; i += 1) {
      cities(gs).forEach(function (city) {
        if (city.specialization === "food") city.food = (city.food || 0) + 2;
        else if (city.specialization === "production") city.production = (city.production || 0) + 2;
        else if (city.specialization === "science") gs.resources.science = (gs.resources.science || 0) + 2;
        else if (city.specialization === "gold") gs.resources.gold = (gs.resources.gold || 0) + 2;
      });
    }
    journey.lastBonusTurn = current;
    return elapsed > 0;
  }

  function sync(options) {
    if (syncing) return null;
    const gs = state();
    if (!gs) return null;
    syncing = true;
    try {
      const journey = ensure(gs);
      let changed = false;
      changed = grantScenarioBonus(gs, journey) || changed;
      changed = specializationBonuses(gs, journey) || changed;
      changed = completeChapters(gs, journey) || changed;
      changed = queueEvent(gs, journey) || changed;
      if (window.EpohiHumansJourneyUI) window.EpohiHumansJourneyUI.refresh(gs);
      if (changed && (!options || options.render !== false)) {
        const value = debug();
        if (value && typeof value.render === "function") value.render();
      }
      return journey;
    } finally {
      syncing = false;
    }
  }

  window.EpohiHumansJourney = {
    version: DATA.version,
    scenarios: DATA.scenarios,
    specializations: DATA.specializations,
    chapters: DATA.chapters,
    storyEvents: DATA.events,
    cities: cities,
    ensureJourneyState: ensure,
    chapterProgress: progress,
    canAffordChoice: canAfford,
    eventById: eventById,
    resolveEvent: resolveEvent,
    chooseSpecialization: chooseSpecialization,
    armScenario: armScenario,
    sync: sync
  };
})();