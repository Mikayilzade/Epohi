(function () {
  "use strict";

  if (!window.EpohiData || !window.EpohiUtils) {
    throw new Error("Epohi data and utils modules are required before humans-outcomes.js");
  }

  const { TERRAIN, FEATURES, IMPROVEMENTS, BUILDINGS } = window.EpohiData;
  const { addYield, chebyshev } = window.EpohiUtils;
  const OUTCOME_VERSION = 1;
  const STATEHOOD_POPULATION_TARGET = 8;
  const STATEHOOD_CITY_TARGET = 2;

  let syncScheduled = false;
  let goalsModal = null;
  const announcedThisSession = new Set();

  function getDebug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function getState() {
    const debug = getDebug();
    return debug && debug.state ? debug.state : null;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function allCities(state) {
    if (Array.isArray(state.cities)) return state.cities;
    return state.city ? [state.city] : [];
  }

  function cityIsAlive(city) {
    return Boolean(city) && (typeof city.hp !== "number" || city.hp > 0);
  }

  function livingCities(state) {
    return allCities(state).filter(cityIsAlive);
  }

  function livingSettlers(state) {
    return (state.units || []).filter(function (unit) {
      return unit.type === "settler" && (typeof unit.hp !== "number" || unit.hp > 0);
    });
  }

  function ensureOutcomeState(state) {
    if (!state) return null;

    const hadOutcome = state.outcome && state.outcome.version === OUTCOME_VERSION;
    if (!hadOutcome) {
      if (state.victory) {
        state.outcome = {
          version: OUTCOME_VERSION,
          status: "victory",
          type: "legacy",
          turn: state.turn || 1,
          title: "Победа сохранена",
          summary: "Эта партия была завершена в предыдущей версии правил."
        };
      } else if (state.defeat) {
        state.outcome = {
          version: OUTCOME_VERSION,
          status: "defeat",
          type: "legacy",
          turn: state.turn || 1,
          title: "Партия завершена",
          summary: "Поражение было зафиксировано в предыдущей версии правил."
        };
      } else {
        state.outcome = {
          version: OUTCOME_VERSION,
          status: "active",
          type: null,
          turn: null,
          title: null,
          summary: null
        };
      }
    }

    if (!Array.isArray(state.outcomeNotices)) state.outcomeNotices = [];
    return state.outcome;
  }

  function addNotice(state, key, text, eventType) {
    ensureOutcomeState(state);
    if (state.outcomeNotices.includes(key)) return false;
    state.outcomeNotices.push(key);
    state.outcomeNotices = state.outcomeNotices.slice(-30);

    if (!Array.isArray(state.eventLog)) state.eventLog = [];
    state.eventCounter = (state.eventCounter || 0) + 1;
    state.eventLog.unshift({
      eventId: "ev" + state.eventCounter,
      turn: state.turn || 1,
      phase: "player",
      actorType: "system",
      actorId: null,
      eventType: eventType || "outcome-status",
      text: text,
      coordinates: null,
      data: {}
    });
    state.eventLog = state.eventLog.slice(0, 180);

    if (!Array.isArray(state.history)) state.history = [];
    state.history.unshift("Ход " + (state.turn || 1) + ": " + text);
    state.history = state.history.slice(0, 60);
    return true;
  }

  function totalPopulation(state) {
    return livingCities(state).reduce(function (sum, city) {
      return sum + Math.max(0, Number(city.population) || 0);
    }, 0);
  }

  function hasBuilding(state, buildingId) {
    return livingCities(state).some(function (city) {
      return (city.buildings || []).includes(buildingId);
    });
  }

  function cityOwnerMatches(tile, city) {
    if (!tile || !city) return false;
    return tile.owner === city.id || tile.owner === city.name;
  }

  function estimateBaseIncome(state) {
    const total = { food: 0, production: 0, gold: 0, science: 0 };

    livingCities(state).forEach(function (city) {
      const income = {
        food: 2 + Math.floor((Number(city.population) || 0) / 2),
        production: 2,
        gold: 1,
        science: 2
      };
      const cityTile = state.map && state.map[city.y] && state.map[city.y][city.x];
      if (cityTile && TERRAIN[cityTile.terrain]) addYield(income, TERRAIN[cityTile.terrain].base);

      (city.buildings || []).forEach(function (buildingId) {
        const building = BUILDINGS[buildingId];
        if (building && building.yield) addYield(income, building.yield);
      });

      (state.map || []).forEach(function (row) {
        row.forEach(function (tile) {
          if (!cityOwnerMatches(tile, city) || !tile.improvement || tile.pillaged) return;
          if (TERRAIN[tile.terrain]) addYield(income, TERRAIN[tile.terrain].base);
          if (IMPROVEMENTS[tile.improvement]) addYield(income, IMPROVEMENTS[tile.improvement].yield);
          if (tile.feature && FEATURES[tile.feature] && tile.feature !== "ruins") {
            addYield(income, FEATURES[tile.feature].bonus);
          }
        });
      });

      addYield(total, income);
    });

    return total;
  }

  function currentCapital(state) {
    const alive = livingCities(state);
    return alive.find(function (city) { return city.capital; }) ||
      (cityIsAlive(state.city) ? state.city : null) || alive[0] || null;
  }

  function knownHostiles(state) {
    const result = [];
    (state.barbarians || []).forEach(function (unit) {
      const tile = state.map && state.map[unit.y] && state.map[unit.y][unit.x];
      if (unit.hp > 0 && tile && tile.revealed) result.push({ x: unit.x, y: unit.y, kind: "barbarian" });
    });
    (state.rivals || []).forEach(function (civ) {
      if (civ.defeated || civ.relation !== "war") return;
      (civ.units || []).forEach(function (unit) {
        const tile = state.map && state.map[unit.y] && state.map[unit.y][unit.x];
        if (unit.hp > 0 && tile && tile.revealed) {
          result.push({ x: unit.x, y: unit.y, kind: "rival", civilizationId: civ.civilizationId });
        }
      });
    });
    return result;
  }

  function capitalThreats(state, radius) {
    const capital = currentCapital(state);
    if (!capital) return [];
    return knownHostiles(state).filter(function (hostile) {
      return chebyshev(capital.x, capital.y, hostile.x, hostile.y) <= radius;
    });
  }

  function statehoodProgress(state) {
    const cities = livingCities(state);
    const population = totalPopulation(state);
    const income = estimateBaseIncome(state);
    const threats = capitalThreats(state, 2);
    const requirements = [
      {
        id: "technology",
        label: "Изучить государственность",
        done: (state.researched || []).includes("statehood"),
        detail: (state.researched || []).includes("statehood") ? "изучено" : "не изучено"
      },
      {
        id: "palace",
        label: "Построить дворец",
        done: hasBuilding(state, "palace"),
        detail: hasBuilding(state, "palace") ? "построен" : "не построен"
      },
      {
        id: "cities",
        label: "Создать не менее двух устойчивых городов",
        done: cities.length >= STATEHOOD_CITY_TARGET,
        current: cities.length,
        target: STATEHOOD_CITY_TARGET,
        detail: cities.length + " / " + STATEHOOD_CITY_TARGET
      },
      {
        id: "population",
        label: "Достичь общего населения 8",
        done: population >= STATEHOOD_POPULATION_TARGET,
        current: population,
        target: STATEHOOD_POPULATION_TARGET,
        detail: population + " / " + STATEHOOD_POPULATION_TARGET
      },
      {
        id: "security",
        label: "Обезопасить столицу",
        done: threats.length === 0,
        current: threats.length,
        target: 0,
        detail: threats.length ? "угроз рядом: " + threats.length : "непосредственных угроз нет"
      },
      {
        id: "economy",
        label: "Сохранить положительную базовую экономику",
        done: income.food > 0 && income.production > 0 && income.gold > 0 && income.science > 0,
        detail: "🍞" + income.food + " · 🔨" + income.production + " · 🪙" + income.gold + " · 🔬" + income.science
      }
    ];

    return {
      complete: requirements.every(function (item) { return item.done; }),
      requirements: requirements,
      cities: cities.length,
      population: population,
      income: income,
      threats: threats.length
    };
  }

  function rivalIsDefeated(civ) {
    if (!civ) return true;
    if (civ.defeated) return true;
    const livingCapital = (civ.cities || []).some(function (city) {
      return city.capital && cityIsAlive(city);
    });
    const settler = (civ.units || []).some(function (unit) {
      return unit.type === "settler" && (typeof unit.hp !== "number" || unit.hp > 0);
    });
    return !livingCapital && !settler;
  }

  function militaryProgress(state) {
    const rivals = state.rivals || [];
    const defeated = rivals.filter(rivalIsDefeated).length;
    return {
      available: rivals.length > 0,
      complete: rivals.length > 0 && defeated === rivals.length,
      defeated: defeated,
      total: rivals.length
    };
  }

  function promoteSuccessorCapital(state) {
    const oldCapital = state.city;
    if (!oldCapital || cityIsAlive(oldCapital)) return null;
    const successor = livingCities(state)[0];
    if (!successor) return null;

    allCities(state).forEach(function (city) { city.capital = false; });
    successor.capital = true;
    state.city = successor;
    state.defeat = false;
    addNotice(
      state,
      "capital-successor-" + successor.id,
      "Столица потеряна, но " + successor.name + " принял управление. Сопротивление продолжается.",
      "capital-succeeded"
    );
    return successor;
  }

  function outcomeKey(outcome) {
    return [outcome.status, outcome.type || "none", outcome.turn || 0].join(":");
  }

  function terminalOutcome(status, type, state, title, summary) {
    return {
      version: OUTCOME_VERSION,
      status: status,
      type: type,
      turn: state.turn || 1,
      title: title,
      summary: summary
    };
  }

  function evaluate(state, options) {
    options = options || {};
    state = state || getState();
    if (!state) return null;

    const existing = ensureOutcomeState(state);
    if (!options.recalculate && (existing.status === "victory" || existing.status === "defeat")) {
      state.victory = existing.status === "victory";
      state.defeat = existing.status === "defeat";
      if (options.announce) showOutcomeModal(state, existing);
      return existing;
    }

    promoteSuccessorCapital(state);

    const statehood = statehoodProgress(state);
    const military = militaryProgress(state);
    const cities = livingCities(state);
    const settlers = livingSettlers(state);
    const trueDefeat = cities.length === 0 && settlers.length === 0;
    const prematurePalace = Boolean(state.victory && hasBuilding(state, "palace") && !statehood.complete && !military.complete);

    let next;
    if (trueDefeat) {
      next = terminalOutcome(
        "defeat",
        "extinction",
        state,
        "Цивилизация погибла",
        "Все города потеряны, и не осталось поселенца, способного основать новый центр."
      );
    } else if (military.complete) {
      next = terminalOutcome(
        "victory",
        "military",
        state,
        "Соперники подчинены!",
        "Все государства-соперники лишились столицы и возможности восстановиться."
      );
    } else if (statehood.complete) {
      next = terminalOutcome(
        "victory",
        "statehood",
        state,
        "Государство создано!",
        "Города объединены законами и институтами, а цивилизация стала устойчивым ранним государством."
      );
    } else {
      next = {
        version: OUTCOME_VERSION,
        status: cities.length ? "active" : "exile",
        type: cities.length ? null : "recovery",
        turn: null,
        title: null,
        summary: cities.length ? null : "Города потеряны, но поселенец ещё может восстановить цивилизацию."
      };
    }

    state.outcome = next;
    state.victory = next.status === "victory";
    state.defeat = next.status === "defeat";

    if (prematurePalace && next.status !== "victory") {
      addNotice(
        state,
        "palace-before-stable-state",
        "Дворец построен, но государство ещё неустойчиво. Выполните остальные цели государственной победы.",
        "statehood-incomplete"
      );
      hideLegacyOutcomeModal();
      if (options.showGoalsOnBlockedVictory !== false) openGoals();
    }

    if (next.status === "victory" || next.status === "defeat") {
      const key = outcomeKey(next);
      if (options.announce || !announcedThisSession.has(key)) {
        announcedThisSession.add(key);
        showOutcomeModal(state, next);
      }
    }

    return next;
  }

  function progressCard(title, progress, available) {
    const rows = progress.requirements ? progress.requirements : [];
    const body = rows.length
      ? rows.map(function (item) {
        return '<article class="game-card ' + (item.done ? 'done' : 'locked') + '">' +
          '<div><h3>' + (item.done ? '✅ ' : '⬜ ') + escapeHtml(item.label) + '</h3>' +
          '<p>' + escapeHtml(item.detail || '') + '</p></div>' +
          '<strong>' + (item.done ? 'Готово' : 'Нужно') + '</strong></article>';
      }).join("")
      : '<div class="inline-note">' + (available ? 'Условия ещё не определены.' : 'Недоступно в партии без соперников.') + '</div>';
    return '<div class="section-title">' + escapeHtml(title) + '</div><div class="card-list">' + body + '</div>';
  }

  function ensureGoalsModal() {
    if (goalsModal && document.body.contains(goalsModal)) return goalsModal;
    goalsModal = document.getElementById("humansGoalsModal");
    if (goalsModal) return goalsModal;

    goalsModal = document.createElement("div");
    goalsModal.id = "humansGoalsModal";
    goalsModal.className = "modal";
    goalsModal.setAttribute("role", "dialog");
    goalsModal.setAttribute("aria-modal", "true");
    goalsModal.setAttribute("aria-labelledby", "humansGoalsTitle");
    goalsModal.innerHTML = '<section class="sheet">' +
      '<header class="sheet-head"><h2 id="humansGoalsTitle">Цели партии</h2>' +
      '<button class="close-btn" data-close-human-goals aria-label="Закрыть">×</button></header>' +
      '<div id="humansGoalsContent" class="sheet-scroll"></div></section>';
    document.body.appendChild(goalsModal);
    goalsModal.querySelector("[data-close-human-goals]").addEventListener("click", function () {
      goalsModal.classList.remove("show");
    });
    return goalsModal;
  }

  function openGoals() {
    const state = getState();
    if (!state) return false;
    ensureOutcomeState(state);
    const statehood = statehoodProgress(state);
    const military = militaryProgress(state);
    const modal = ensureGoalsModal();
    const content = modal.querySelector("#humansGoalsContent");

    const militaryRequirements = military.available ? [{
      id: "rivals",
      label: "Лишить соперников столиц и возможности восстановиться",
      done: military.complete,
      detail: military.defeated + " / " + military.total
    }] : [];

    let status = '<div class="wiki-callout"><strong>Партия продолжается.</strong> Выберите государственный или военный путь победы.</div>';
    if (state.outcome.status === "exile") {
      status = '<div class="wiki-callout"><strong>Цивилизация в изгнании.</strong> Сохраните поселенца и основайте новый город.</div>';
    } else if (state.outcome.status === "victory" || state.outcome.status === "defeat") {
      status = '<div class="wiki-callout"><strong>' + escapeHtml(state.outcome.title) + '</strong> ' + escapeHtml(state.outcome.summary) + '</div>';
    }

    content.innerHTML = status +
      progressCard("Государственная победа", statehood, true) +
      progressCard("Военная победа", { requirements: militaryRequirements }, military.available) +
      '<div class="section-title">Поражение</div>' +
      '<div class="inline-note">Партия проиграна только тогда, когда потеряны все города и не осталось живого поселенца. Потеря одной столицы не завершает сопротивление автоматически.</div>';
    modal.classList.add("show");
    return true;
  }

  function hideLegacyOutcomeModal() {
    const modal = document.getElementById("victoryModal");
    if (modal) modal.classList.remove("show");
  }

  function showOutcomeModal(state, outcome) {
    const modal = document.getElementById("victoryModal");
    const title = document.getElementById("victoryModalTitle");
    const content = document.getElementById("victoryContent");
    if (!modal || !title || !content) return;

    title.textContent = outcome.title;
    const cityCount = livingCities(state).length;
    const population = totalPopulation(state);
    const icon = outcome.status === "defeat" ? "🕯️" : (outcome.type === "military" ? "⚔️" : "🏛️");
    content.innerHTML = '<span class="victory-mark">' + icon + '</span>' +
      '<p class="victory-copy">' + escapeHtml(outcome.summary) + '</p>' +
      '<div class="summary-grid">' +
      '<div class="summary-card"><strong>' + (state.turn || 1) + '</strong><small>ход</small></div>' +
      '<div class="summary-card"><strong>' + cityCount + '</strong><small>живых городов</small></div>' +
      '<div class="summary-card"><strong>' + population + '</strong><small>население</small></div>' +
      '</div><div class="menu-actions" style="margin-top:14px">' +
      '<button id="outcomeGoalsBtn" class="wide-btn secondary">Посмотреть цели</button>' +
      '<button id="outcomeMapBtn" class="wide-btn">Вернуться к карте</button></div>';

    content.querySelector("#outcomeGoalsBtn").addEventListener("click", function () {
      modal.classList.remove("show");
      openGoals();
    });
    content.querySelector("#outcomeMapBtn").addEventListener("click", function () {
      modal.classList.remove("show");
    });
    modal.classList.add("show");
  }

  function ensureMenuButton() {
    const menuModal = document.getElementById("menuModal");
    const menuContent = document.getElementById("menuContent");
    if (!menuModal || !menuContent || !menuModal.classList.contains("show")) return;
    if (menuContent.querySelector("[data-human-goals]")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "menu-actions";
    wrapper.style.marginBottom = "10px";
    wrapper.innerHTML = '<button type="button" class="wide-btn secondary" data-human-goals>🎯 Цели партии</button>';
    menuContent.insertBefore(wrapper, menuContent.firstChild);
    wrapper.querySelector("[data-human-goals]").addEventListener("click", function () {
      menuModal.classList.remove("show");
      openGoals();
    });
  }

  function sync(options) {
    const state = getState();
    if (!state) return null;
    ensureOutcomeState(state);
    return evaluate(state, options || {});
  }

  function scheduleSync(options) {
    if (syncScheduled) return;
    syncScheduled = true;
    window.setTimeout(function () {
      syncScheduled = false;
      sync(options || {});
      ensureMenuButton();
    }, 0);
  }

  function installHooks() {
    ensureGoalsModal();

    const victoryModal = document.getElementById("victoryModal");
    if (victoryModal) {
      new MutationObserver(function () {
        if (victoryModal.classList.contains("show")) {
          scheduleSync({ announce: true, showGoalsOnBlockedVictory: true });
        }
      }).observe(victoryModal, { attributes: true, attributeFilter: ["class"] });
    }

    const menuModal = document.getElementById("menuModal");
    const menuContent = document.getElementById("menuContent");
    if (menuModal) {
      new MutationObserver(ensureMenuButton).observe(menuModal, { attributes: true, attributeFilter: ["class"] });
    }
    if (menuContent) {
      new MutationObserver(ensureMenuButton).observe(menuContent, { childList: true });
    }

    const turnValue = document.getElementById("turnValue");
    if (turnValue) {
      new MutationObserver(function () {
        scheduleSync({ announce: true, showGoalsOnBlockedVictory: true });
      }).observe(turnValue, { childList: true, characterData: true, subtree: true });
    }

    document.addEventListener("click", function () {
      scheduleSync({ announce: false, showGoalsOnBlockedVictory: true });
      window.setTimeout(function () {
        scheduleSync({ announce: true, showGoalsOnBlockedVictory: true });
      }, 220);
    }, true);

    scheduleSync({ announce: false, showGoalsOnBlockedVictory: false });
  }

  window.EpohiHumansOutcomes = {
    version: OUTCOME_VERSION,
    ensureOutcomeState: ensureOutcomeState,
    livingCities: livingCities,
    livingSettlers: livingSettlers,
    estimateBaseIncome: estimateBaseIncome,
    knownHostiles: knownHostiles,
    statehoodProgress: statehoodProgress,
    militaryProgress: militaryProgress,
    promoteSuccessorCapital: promoteSuccessorCapital,
    evaluate: evaluate,
    openGoals: openGoals,
    sync: sync
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installHooks, { once: true });
  } else {
    installHooks();
  }
})();
