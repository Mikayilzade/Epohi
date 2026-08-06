(function () {
  "use strict";

  const VERSION = 1;
  const DEFAULT_FOCUS = "production";
  const TYPES = {
    food: { icon: "🍞", label: "еда", people: "земледельцы" },
    production: { icon: "🔨", label: "производство", people: "ремесленники" },
    gold: { icon: "🪙", label: "золото", people: "торговцы" },
    science: { icon: "🔬", label: "наука", people: "писцы" }
  };
  const TYPE_KEYS = Object.keys(TYPES);

  let uiSyncQueued = false;
  let uiSyncRunning = false;
  let observer = null;

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function currentState() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function playerCities(gs) {
    if (!gs) return [];
    if (Array.isArray(gs.cities) && gs.cities.length) return gs.cities;
    return gs.city ? [gs.city] : [];
  }

  function allCityEntries(gs) {
    const entries = playerCities(gs).map(function (city) {
      return { city: city, resources: gs.resources, player: true, owner: null };
    });
    (gs.rivals || []).forEach(function (civ) {
      (civ.cities || []).forEach(function (city) {
        entries.push({ city: city, resources: civ.resources, player: false, owner: civ });
      });
    });
    return entries;
  }

  function safeInt(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  }

  function emptyWorkforce() {
    return { food: 0, production: 0, gold: 0, science: 0 };
  }

  function workforceTotal(workforce) {
    return TYPE_KEYS.reduce(function (sum, key) {
      return sum + safeInt(workforce && workforce[key]);
    }, 0);
  }

  function validFocus(value) {
    return Object.prototype.hasOwnProperty.call(TYPES, value) ? value : DEFAULT_FOCUS;
  }

  function removeExcess(workforce, amount, preferred) {
    const order = [preferred].concat(TYPE_KEYS.filter(function (key) { return key !== preferred; }).reverse());
    let left = amount;
    order.forEach(function (key) {
      if (left <= 0) return;
      const taken = Math.min(left, safeInt(workforce[key]));
      workforce[key] -= taken;
      left -= taken;
    });
  }

  function ensureCity(city) {
    if (!city) return { added: 0, removed: 0, focus: DEFAULT_FOCUS };
    city.growthFocus = validFocus(city.growthFocus);
    const workforce = city.workforce && typeof city.workforce === "object"
      ? city.workforce
      : emptyWorkforce();
    TYPE_KEYS.forEach(function (key) { workforce[key] = safeInt(workforce[key]); });
    city.workforce = workforce;

    const target = Math.max(0, safeInt(city.population) - 1);
    const assigned = workforceTotal(workforce);
    let added = 0;
    let removed = 0;
    if (assigned < target) {
      added = target - assigned;
      workforce[city.growthFocus] += added;
    } else if (assigned > target) {
      removed = assigned - target;
      removeExcess(workforce, removed, city.growthFocus);
    }
    city.workforceKnownPopulation = safeInt(city.population) || 1;
    return { added: added, removed: removed, focus: city.growthFocus };
  }

  function addEvent(gs, city, focus, count) {
    if (!gs || !city || !count) return;
    const type = TYPES[focus];
    const text = city.name + ": новая община направлена в «" + type.people + "» — +" + count + " " + type.label + " за ход.";
    gs.eventCounter = (gs.eventCounter || 0) + 1;
    if (!Array.isArray(gs.eventLog)) gs.eventLog = [];
    gs.eventLog.unshift({
      eventId: "workforce-" + gs.eventCounter,
      turn: gs.turn || 1,
      phase: "player",
      actorType: "player",
      actorId: "player",
      eventType: "population-workforce-assigned",
      text: text,
      coordinates: { x: city.x, y: city.y },
      data: { cityId: city.id, focus: focus, count: count }
    });
    gs.eventLog = gs.eventLog.slice(0, 240);
    if (!Array.isArray(gs.history)) gs.history = [];
    gs.history.unshift("Ход " + (gs.turn || 1) + ": " + text);
    gs.history = gs.history.slice(0, 100);
  }

  function toast(text, duration) {
    if (typeof document === "undefined") return;
    const node = document.getElementById("toast");
    if (!node) return;
    node.textContent = text;
    node.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(function () {
      node.classList.remove("show");
    }, duration || 3200);
  }

  function reconcileState(gs, options) {
    if (!gs) return null;
    options = options || {};
    const firstMigration = gs.populationWorkforceVersion !== VERSION;
    const changed = [];
    allCityEntries(gs).forEach(function (entry) {
      const hadKnownPopulation = Number.isFinite(Number(entry.city.workforceKnownPopulation));
      const beforePopulation = hadKnownPopulation
        ? safeInt(entry.city.workforceKnownPopulation)
        : (safeInt(entry.city.population) || 1);
      const result = ensureCity(entry.city);
      const populationNow = safeInt(entry.city.population) || 1;
      const actualGrowth = hadKnownPopulation && populationNow > beforePopulation
        ? populationNow - beforePopulation
        : 0;
      if (!firstMigration && entry.player && actualGrowth > 0 && options.announce !== false) {
        addEvent(gs, entry.city, result.focus, actualGrowth);
        changed.push({ city: entry.city, focus: result.focus, count: actualGrowth });
      }
      entry.city.workforceKnownPopulation = populationNow;
    });
    gs.populationWorkforceVersion = VERSION;
    if (firstMigration && !Number.isFinite(gs.populationWorkforcePreparedTurn)) {
      gs.populationWorkforcePreparedTurn = (gs.turn || 1) - 1;
    }
    if (changed.length && options.toast !== false) {
      const item = changed[0];
      const type = TYPES[item.focus];
      toast("👥 " + item.city.name + ": +" + item.count + " " + type.label + " за ход.");
    }
    return { migrated: firstMigration, changed: changed };
  }

  function specializationYield(city) {
    const result = emptyWorkforce();
    if (city && Object.prototype.hasOwnProperty.call(TYPES, city.specialization)) {
      result[city.specialization] = 2;
    }
    return result;
  }

  function adjustedIncome(gs, city) {
    const value = debug();
    ensureCity(city);
    let base = { food: 0, production: 0, gold: 0, science: 0 };
    if (value && typeof value.cityIncome === "function") {
      const calculated = value.cityIncome(city) || base;
      TYPE_KEYS.forEach(function (key) { base[key] = Number(calculated[key]) || 0; });
    }
    const workforce = city.workforce || emptyWorkforce();
    const specialization = specializationYield(city);
    base.food = Math.max(0, base.food - Math.floor(safeInt(city.population) / 2)) + workforce.food + specialization.food;
    base.production += workforce.production + specialization.production;
    base.gold += workforce.gold + specialization.gold;
    base.science += workforce.science + specialization.science;
    return base;
  }

  function applyCityWorkforce(entry) {
    const city = entry.city;
    const resources = entry.resources || {};
    ensureCity(city);
    const workforce = city.workforce;

    // app.js still grants floor(population / 2) food. Remove that legacy
    // population bonus before the normal end-turn income is processed.
    city.food = (Number(city.food) || 0) - Math.floor(safeInt(city.population) / 2) + workforce.food;

    if (city.queue && Number.isFinite(Number(city.queue.progress))) {
      city.queue.progress = Number(city.queue.progress) + workforce.production;
    } else {
      city.production = (Number(city.production) || 0) + workforce.production;
    }
    resources.gold = (Number(resources.gold) || 0) + workforce.gold;
    resources.science = (Number(resources.science) || 0) + workforce.science;
  }

  function prepareTurn(gs) {
    if (!gs) return false;
    reconcileState(gs, { announce: false, toast: false });
    const turn = safeInt(gs.turn) || 1;
    if (gs.populationWorkforcePreparedTurn === turn) return false;
    allCityEntries(gs).forEach(applyCityWorkforce);
    gs.populationWorkforcePreparedTurn = turn;
    return true;
  }

  function activePlayerCity(gs) {
    const cities = playerCities(gs);
    const value = debug();
    const selectedId = value && typeof value.getSelectedCityId === "function" ? value.getSelectedCityId() : null;
    const byId = cities.find(function (city) { return String(city.id) === String(selectedId); });
    if (byId) return byId;
    if (typeof document !== "undefined") {
      const title = document.getElementById("cityModalTitle");
      const byName = title && cities.find(function (city) { return city.name === title.textContent.trim(); });
      if (byName) return byName;
    }
    return cities[0] || null;
  }

  function formatWorkforce(workforce) {
    return TYPE_KEYS.map(function (key) {
      return TYPES[key].icon + "+" + safeInt(workforce[key]);
    }).join(" · ");
  }

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function renderCityPanel(gs) {
    const content = document.getElementById("cityContent");
    const city = activePlayerCity(gs);
    if (!content || !city || !content.children.length) return;
    ensureCity(city);

    let panel = content.querySelector("[data-population-workforce-panel]");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "population-workforce-panel";
      panel.dataset.populationWorkforcePanel = "1";
      const firstProgressLabel = content.querySelector(".progress-label");
      if (firstProgressLabel) firstProgressLabel.insertAdjacentElement("afterend", panel);
      else content.insertBefore(panel, content.firstChild);
    }

    const workforce = city.workforce;
    const target = Math.max(0, safeInt(city.population) - 1);
    const specialization = specializationYield(city);
    const specializationKey = TYPE_KEYS.find(function (key) { return specialization[key] > 0; });
    const focusButtons = TYPE_KEYS.map(function (key) {
      const active = city.growthFocus === key;
      return '<button type="button" class="workforce-focus-btn' + (active ? ' active' : '') + '" data-workforce-focus="' + key + '">' +
        TYPES[key].icon + '<span>' + TYPES[key].people + '</span><small>+1 ' + TYPES[key].label + '</small></button>';
    }).join("");
    const specializationText = specializationKey
      ? '<div class="workforce-specialization">Специализация отдельно: ' + TYPES[specializationKey].icon + '+2 за ход.</div>'
      : '<div class="workforce-specialization muted">Специализация откроется при населении 3 и считается отдельно.</div>';
    const signature = [city.id, city.population, city.growthFocus, formatWorkforce(workforce), city.specialization || "none"].join("|");
    if (panel.dataset.signature !== signature) {
      panel.dataset.signature = signature;
      panel.innerHTML =
        '<div class="workforce-head"><strong>👥 Население работает</strong><span>' + workforceTotal(workforce) + '/' + target + ' общин</span></div>' +
        '<p>Постоянный вклад жителей: <strong>' + formatWorkforce(workforce) + ' за ход</strong>.</p>' +
        specializationText +
        '<div class="workforce-next"><span>Следующая община:</span><strong>' + TYPES[city.growthFocus].icon + ' ' + TYPES[city.growthFocus].people + '</strong></div>' +
        '<div class="workforce-focus-grid">' + focusButtons + '</div>' +
        '<small class="workforce-note">Первая единица населения поддерживает сам город. Каждая следующая даёт +1 выбранного ресурса. Базовый доход клеток и зданий не перераспределяется.</small>';
    }

    const income = adjustedIncome(gs, city);
    const growthLabel = content.querySelector(".progress-label");
    if (growthLabel && growthLabel.lastElementChild) {
      setText(growthLabel.lastElementChild, "+" + income.food + " за ход · 👥 +" + workforce.food);
    }
    const queueHead = content.querySelector(".queue-box .queue-head span");
    if (queueHead) setText(queueHead, "+" + income.production + " 🔨 за ход");
    const queueTurns = content.querySelector(".queue-box .progress-label span:last-child");
    if (queueTurns && city.queue) {
      const remaining = Math.max(0, Number(city.queue.cost) - Number(city.queue.progress));
      setText(queueTurns, "примерно " + Math.max(1, Math.ceil(remaining / Math.max(1, income.production))) + " ход.");
    }
  }

  function empireIncome(gs) {
    const result = emptyWorkforce();
    playerCities(gs).forEach(function (city) {
      const income = adjustedIncome(gs, city);
      TYPE_KEYS.forEach(function (key) { result[key] += income[key]; });
    });
    (gs.settlements || []).forEach(function () {
      result.food += 1;
      result.production += 1;
      result.gold += 1;
    });
    return result;
  }

  function renderTopIncome(gs) {
    const scope = document.getElementById("resourceScope");
    if (!scope) return;
    const scopeText = scope.textContent.trim();
    const city = playerCities(gs).find(function (item) { return item.name === scopeText; });
    const income = city ? adjustedIncome(gs, city) : empireIncome(gs);
    const activeTrade = (gs.tradeRoutes || []).filter(function (route) {
      return route.status === "active" && route.remainingTurns > 0;
    }).reduce(function (sum, route) { return sum + (Number(route.goldPerTurn) || 0); }, 0);
    const nodes = {
      food: document.getElementById("foodIncome"),
      production: document.getElementById("prodIncome"),
      gold: document.getElementById("goldIncome"),
      science: document.getElementById("scienceIncome")
    };
    TYPE_KEYS.forEach(function (key) {
      if (!nodes[key]) return;
      setText(nodes[key], "+" + income[key] + " за ход");
    });
    if (nodes.gold && activeTrade) setText(nodes.gold, "+" + income.gold + " за ход · торговля +" + activeTrade);
  }

  function patchWiki() {
    const content = document.getElementById("wikiContent");
    if (!content || !content.children.length || content.querySelector("[data-workforce-wiki]")) return;
    const section = document.createElement("div");
    section.dataset.workforceWiki = "1";
    section.innerHTML =
      '<div class="section-title">Население и рабочая сила</div>' +
      '<div class="wiki-callout"><strong>Население — это общины, а не отдельные люди.</strong> Первая единица поддерживает базовую жизнь города. Каждая следующая община постоянно даёт +1 еды, производства, золота или науки — направление следующего роста выбирается в окне города. Рост означает сочетание естественного прироста и переселения. Специализация города действует отдельно.</div>';
    content.insertBefore(section, content.firstChild);
  }

  function syncUi() {
    if (uiSyncRunning || typeof document === "undefined") return;
    uiSyncRunning = true;
    try {
      const gs = currentState();
      if (!gs) return;
      reconcileState(gs, { announce: true, toast: true });
      renderCityPanel(gs);
      renderTopIncome(gs);
      patchWiki();
    } finally {
      uiSyncRunning = false;
    }
  }

  function scheduleUiSync() {
    if (uiSyncQueued) return;
    uiSyncQueued = true;
    const run = function () {
      uiSyncQueued = false;
      syncUi();
    };
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(run);
    else window.setTimeout(run, 0);
  }

  function installStyles() {
    if (document.getElementById("populationWorkforceStyles")) return;
    const style = document.createElement("style");
    style.id = "populationWorkforceStyles";
    style.textContent = [
      ".population-workforce-panel{margin:12px 0;padding:14px;border:1px solid rgba(101,119,79,.28);border-radius:18px;background:rgba(247,239,208,.72);box-shadow:0 8px 20px rgba(42,54,38,.08)}",
      ".workforce-head,.workforce-next{display:flex;align-items:center;justify-content:space-between;gap:10px}",
      ".workforce-head span{font-size:.82rem;opacity:.72}",
      ".population-workforce-panel p{margin:8px 0;line-height:1.35}",
      ".workforce-specialization{margin:7px 0;padding:7px 9px;border-radius:10px;background:rgba(86,129,75,.12);font-size:.86rem}",
      ".workforce-specialization.muted{opacity:.72}",
      ".workforce-next{margin:10px 0 8px}",
      ".workforce-focus-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}",
      ".workforce-focus-btn{min-width:0;min-height:62px;padding:8px;border:1px solid rgba(94,91,61,.24);border-radius:13px;background:rgba(255,255,255,.42);font:inherit;font-weight:700;color:inherit;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:7px;text-align:left;align-items:center}",
      ".workforce-focus-btn>span{overflow:hidden;text-overflow:ellipsis}",
      ".workforce-focus-btn>small{grid-column:2;font-weight:500;opacity:.72}",
      ".workforce-focus-btn.active{background:rgba(75,132,71,.24);border-color:rgba(57,112,55,.68);box-shadow:inset 0 0 0 1px rgba(57,112,55,.22)}",
      ".workforce-note{display:block;margin-top:10px;line-height:1.35;opacity:.72}",
      "@media(max-width:390px){.workforce-focus-grid{grid-template-columns:1fr}.workforce-focus-btn{min-height:54px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function install() {
    installStyles();
    const endTurn = document.getElementById("endTurnBtn");
    if (endTurn && endTurn.dataset.workforceHook !== "1") {
      endTurn.dataset.workforceHook = "1";
      endTurn.addEventListener("click", function () {
        const value = debug();
        const gs = value && value.state;
        if (!gs || gs.victory || gs.defeat || (value.isTurnProcessing && value.isTurnProcessing())) return;
        prepareTurn(gs);
      }, true);
    }

    document.addEventListener("click", function (event) {
      const button = event.target.closest && event.target.closest("[data-workforce-focus]");
      if (!button) return;
      const gs = currentState();
      const city = activePlayerCity(gs);
      const focus = validFocus(button.dataset.workforceFocus);
      if (!city) return;
      city.growthFocus = focus;
      toast("Следующая община: " + TYPES[focus].people + " (" + TYPES[focus].icon + "+1 за ход).", 2600);
      scheduleUiSync();
    });

    if (window.MutationObserver && document.body) {
      observer = new MutationObserver(scheduleUiSync);
      ["gameApp", "cityContent", "wikiContent", "turnValue", "resourceScope"].forEach(function (id) {
        const node = document.getElementById(id);
        if (!node) return;
        const options = { childList: true, subtree: true, characterData: true };
        if (id === "gameApp") { options.attributes = true; options.attributeFilter = ["class"]; }
        observer.observe(node, options);
      });
    }
    scheduleUiSync();
  }

  window.EpohiPopulationWorkforce = {
    version: VERSION,
    types: TYPES,
    ensureCity: ensureCity,
    reconcileState: reconcileState,
    adjustedIncome: adjustedIncome,
    prepareTurn: prepareTurn,
    workforceTotal: workforceTotal
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
    else install();
  }
})();
