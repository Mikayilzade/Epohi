(function () {
  "use strict";

  if (!window.EpohiData || !window.EpohiUtils || !window.EpohiTerritory) {
    throw new Error("Epohi data, utils and territory modules are required before humans-autonomy.js");
  }

  const { UNIT_DEFS, IMPROVEMENTS } = window.EpohiData;
  const { neighborsOf, passableTile, chebyshev, isAdjacent } = window.EpohiUtils;
  const { cityRadius, inTerritory } = window.EpohiTerritory;

  const ORDER_LABELS = {
    explore: "Исследовать мир",
    guard: "Охранять область",
    develop: "Развивать город"
  };

  let observerScheduled = false;
  let reportButtonMarked = false;

  function getDebug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function getState() {
    const debug = getDebug();
    return debug && debug.state ? debug.state : null;
  }

  function mapSize(state) {
    return state.mapSize || (Array.isArray(state.map) ? state.map.length : 0);
  }

  function ensureAutonomyState(state) {
    if (!state) return null;
    if (!Array.isArray(state.autonomyReports)) state.autonomyReports = [];
    if (!Number.isFinite(state.autonomyReportCounter)) state.autonomyReportCounter = 0;
    (state.units || []).forEach(function (unit) {
      if (unit.order === undefined) unit.order = null;
    });
    return state;
  }

  function unitById(state, unitId) {
    return (state.units || []).find(function (unit) { return unit.id === unitId; }) || null;
  }

  function unitDisplayName(unit) {
    const def = UNIT_DEFS[unit.type] || { name: unit.type || "Юнит" };
    return unit.name || def.name;
  }

  function report(state, unit, text, kind) {
    ensureAutonomyState(state);
    state.autonomyReportCounter += 1;
    const entry = {
      id: "auto-report-" + state.autonomyReportCounter,
      turn: state.turn || 1,
      unitId: unit ? unit.id : null,
      unitName: unit ? unitDisplayName(unit) : null,
      kind: kind || "autonomy",
      text: text
    };
    state.autonomyReports.unshift(entry);
    state.autonomyReports = state.autonomyReports.slice(0, 40);

    state.eventCounter = (state.eventCounter || 0) + 1;
    if (!Array.isArray(state.eventLog)) state.eventLog = [];
    state.eventLog.unshift({
      eventId: "ev" + state.eventCounter,
      turn: state.turn || 1,
      phase: "player",
      actorType: "unit",
      actorId: unit ? unit.id : null,
      eventType: "autonomous-order",
      text: text,
      coordinates: unit ? { x: unit.x, y: unit.y } : null,
      data: { orderType: unit && unit.order ? unit.order.type : null }
    });
    state.eventLog = state.eventLog.slice(0, 180);

    if (!Array.isArray(state.history)) state.history = [];
    state.history.unshift("Ход " + (state.turn || 1) + ": " + text);
    state.history = state.history.slice(0, 60);
    reportButtonMarked = true;
    updateReportButton();
    return entry;
  }

  function revealAround(state, x, y, radius) {
    const size = mapSize(state);
    for (let yy = Math.max(0, y - radius); yy <= Math.min(size - 1, y + radius); yy += 1) {
      for (let xx = Math.max(0, x - radius); xx <= Math.min(size - 1, x + radius); xx += 1) {
        state.map[yy][xx].revealed = true;
      }
    }
    const debug = getDebug();
    if (debug && typeof debug.updateCampDiscovery === "function") debug.updateCampDiscovery(state);
  }

  function knownTile(state, x, y) {
    return Boolean(state.map[y] && state.map[y][x] && state.map[y][x].revealed);
  }

  function playerCities(state) {
    return Array.isArray(state.cities) && state.cities.length ? state.cities : (state.city ? [state.city] : []);
  }

  function rivalUnitAt(state, x, y) {
    for (const civ of (state.rivals || [])) {
      const unit = (civ.units || []).find(function (item) {
        return item.x === x && item.y === y && item.hp > 0;
      });
      if (unit) return { civ: civ, unit: unit };
    }
    return null;
  }

  function barbarianAt(state, x, y) {
    return (state.barbarians || []).find(function (unit) {
      return unit.x === x && unit.y === y && unit.hp > 0;
    }) || null;
  }

  function campAt(state, x, y) {
    const tile = state.map[y] && state.map[y][x];
    return tile && tile.camp && tile.camp.hp > 0 ? tile.camp : null;
  }

  function ownCityAt(state, x, y) {
    return playerCities(state).find(function (city) {
      return city.x === x && city.y === y && city.hp > 0;
    }) || null;
  }

  function ownUnitAt(state, x, y, excludedId) {
    return (state.units || []).find(function (unit) {
      return unit.id !== excludedId && unit.x === x && unit.y === y && unit.hp > 0;
    }) || null;
  }

  function knownHostiles(state) {
    const result = [];

    (state.barbarians || []).forEach(function (unit) {
      if (unit.hp > 0 && knownTile(state, unit.x, unit.y)) {
        result.push({ kind: "barbarian", x: unit.x, y: unit.y, target: unit });
      }
    });

    (state.rivals || []).forEach(function (civ) {
      if (civ.defeated || civ.relation !== "war") return;
      (civ.units || []).forEach(function (unit) {
        if (unit.hp > 0 && knownTile(state, unit.x, unit.y)) {
          result.push({ kind: "rival", x: unit.x, y: unit.y, target: unit, civ: civ });
        }
      });
    });

    return result;
  }

  function nearbyKnownThreat(state, unit, radius) {
    return knownHostiles(state)
      .filter(function (item) { return chebyshev(unit.x, unit.y, item.x, item.y) <= radius; })
      .sort(function (a, b) {
        return chebyshev(unit.x, unit.y, a.x, a.y) - chebyshev(unit.x, unit.y, b.x, b.y);
      })[0] || null;
  }

  function passableForPlayer(state, unit, x, y, options) {
    const tile = state.map[y] && state.map[y][x];
    if (!tile || !passableTile(tile)) return false;
    if (campAt(state, x, y) || barbarianAt(state, x, y) || rivalUnitAt(state, x, y)) return false;
    if (options && options.requireKnown && !tile.revealed) return false;
    if (options && options.requireTerritory && !inTerritory(state, x, y)) return false;
    return true;
  }

  function moveUnit(state, unit, point) {
    if (!point || unit.moves <= 0 || unit.acted) return false;
    unit.x = point.x;
    unit.y = point.y;
    unit.moves = Math.max(0, unit.moves - 1);
    if (unit.moves <= 0) unit.acted = true;
    revealAround(state, unit.x, unit.y, unit.type === "scout" ? 1 + ((state.permanentBonuses || {}).scoutSight || 0) : 1);
    return true;
  }

  function frontierValue(state, point) {
    let unknown = 0;
    neighborsOf(point.x, point.y, mapSize(state)).forEach(function (neighbor) {
      if (!state.map[neighbor.y][neighbor.x].revealed) unknown += 1;
    });
    return unknown;
  }

  function terrainPreference(tile) {
    if (!tile) return -100;
    if (tile.terrain === "plains") return 8;
    if (tile.terrain === "forest") return 4;
    if (tile.terrain === "hill") return 2;
    if (tile.terrain === "desert") return -1;
    if (tile.terrain === "swamp") return -5;
    if (tile.terrain === "dead") return -8;
    return 0;
  }

  function chooseExploreStep(state, unit) {
    const size = mapSize(state);
    const adjacent = neighborsOf(unit.x, unit.y, size).filter(function (point) {
      return passableForPlayer(state, unit, point.x, point.y, { requireKnown: true });
    });

    const immediate = adjacent
      .map(function (point) {
        return {
          point: point,
          score: frontierValue(state, point) * 20 + terrainPreference(state.map[point.y][point.x])
        };
      })
      .filter(function (item) { return item.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });

    if (immediate.length) return immediate[0].point;

    const queue = [{ x: unit.x, y: unit.y, first: null }];
    const seen = new Set([unit.x + "," + unit.y]);

    while (queue.length) {
      const current = queue.shift();
      const options = neighborsOf(current.x, current.y, size);
      for (const next of options) {
        const key = next.x + "," + next.y;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!passableForPlayer(state, unit, next.x, next.y, { requireKnown: true })) continue;
        const first = current.first || next;
        if (frontierValue(state, next) > 0) return first;
        queue.push({ x: next.x, y: next.y, first: first });
      }
    }

    return null;
  }

  function pauseOrder(state, unit, reason) {
    if (!unit.order) return;
    unit.order.status = "paused";
    unit.order.reason = reason;
    report(state, unit, unitDisplayName(unit) + " остановил приказ: " + reason + ".", "order-paused");
  }

  function processExplore(state, unit) {
    const threat = nearbyKnownThreat(state, unit, 2);
    if (threat) {
      pauseOrder(state, unit, "рядом обнаружена угроза");
      return false;
    }

    const nearbyInterest = neighborsOf(unit.x, unit.y, mapSize(state)).find(function (point) {
      const tile = state.map[point.y][point.x];
      return tile.revealed && tile.poi && !tile.poi.used;
    });
    if (nearbyInterest) {
      pauseOrder(state, unit, "обнаружена точка интереса на соседней клетке");
      return false;
    }

    const next = chooseExploreStep(state, unit);
    if (!next) {
      pauseOrder(state, unit, "не найден безопасный путь к неизведанной земле");
      return false;
    }

    const beforeUnknown = countUnrevealed(state);
    if (!moveUnit(state, unit, next)) return false;
    const discovered = Math.max(0, beforeUnknown - countUnrevealed(state));
    unit.order.steps = (unit.order.steps || 0) + 1;
    if (discovered > 0) {
      report(state, unit, unitDisplayName(unit) + " открыл " + discovered + " новых клеток.", "exploration");
    }
    return true;
  }

  function countUnrevealed(state) {
    let count = 0;
    state.map.forEach(function (row) {
      row.forEach(function (tile) {
        if (!tile.revealed) count += 1;
      });
    });
    return count;
  }

  function defenseBonus(state, x, y, baseDefense) {
    const tile = state.map[y][x];
    const rule=window.EpohiData.TERRAIN[tile.terrain]||{};
    let bonus = (Number(baseDefense)||0)*(Number(rule.defenseModifier)||0)/100;
    if (tile.improvement && !tile.pillaged) bonus += 2;
    if (ownCityAt(state, x, y)) bonus += 5;
    return bonus;
  }

  function damageAmount(base, defense) {
    return Math.max(4, Math.round((base - defense * 0.35) * (0.9 + Math.random() * 0.2)));
  }

  function removeDeadTarget(state, hostile) {
    if (hostile.kind === "barbarian") {
      state.barbarians = (state.barbarians || []).filter(function (item) { return item !== hostile.target; });
      return;
    }
    if (hostile.kind === "rival" && hostile.civ) {
      hostile.civ.units = (hostile.civ.units || []).filter(function (item) { return item !== hostile.target; });
    }
  }

  function killPlayerUnit(state, unit) {
    state.units = (state.units || []).filter(function (item) { return item.id !== unit.id; });
  }

  function attackHostile(state, unit, hostile) {
    const attacker = UNIT_DEFS[unit.type];
    const targetDef = hostile.kind === "rival"
      ? (UNIT_DEFS[hostile.target.type] || { defense: 0, attack: 0 })
      : { defense: window.EpohiData.BARBARIAN.raiderDefense || 10, attack: window.EpohiData.BARBARIAN.raiderAttack || 20 };

    const dealt = damageAmount(attacker.attack || 4, (targetDef.defense || 0) + defenseBonus(state, hostile.x, hostile.y,targetDef.defense||0));
    hostile.target.hp -= dealt;
    unit.moves = 0;
    unit.acted = true;

    if (hostile.target.hp <= 0) {
      removeDeadTarget(state, hostile);
      report(state, unit, unitDisplayName(unit) + " уничтожил угрозу во время охраны.", "guard-combat");
      return true;
    }

    const received = damageAmount(targetDef.attack || 4, (attacker.defense || 0) + defenseBonus(state, unit.x, unit.y,attacker.defense||0));
    unit.hp -= received;
    if (unit.hp <= 0) {
      report(state, unit, unitDisplayName(unit) + " погиб, защищая порученную область.", "guard-loss");
      killPlayerUnit(state, unit);
      return true;
    }

    report(state, unit, unitDisplayName(unit) + " вступил в бой: нанесено " + dealt + ", получено " + received + " урона.", "guard-combat");
    return true;
  }

  function nextKnownStep(state, unit, destination, requireTerritory) {
    const size = mapSize(state);
    const startKey = unit.x + "," + unit.y;
    const queue = [{ x: unit.x, y: unit.y, first: null }];
    const seen = new Set([startKey]);

    while (queue.length) {
      const current = queue.shift();
      for (const next of neighborsOf(current.x, current.y, size)) {
        const key = next.x + "," + next.y;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!passableForPlayer(state, unit, next.x, next.y, {
          requireKnown: true,
          requireTerritory: Boolean(requireTerritory)
        })) continue;
        const first = current.first || next;
        if (next.x === destination.x && next.y === destination.y) return first;
        queue.push({ x: next.x, y: next.y, first: first });
      }
    }
    return null;
  }

  function processGuard(state, unit) {
    const order = unit.order;
    const threat = knownHostiles(state)
      .filter(function (item) {
        return chebyshev(order.x, order.y, item.x, item.y) <= order.radius;
      })
      .sort(function (a, b) {
        return chebyshev(unit.x, unit.y, a.x, a.y) - chebyshev(unit.x, unit.y, b.x, b.y);
      })[0] || null;

    if (threat) {
      if (isAdjacent(unit.x, unit.y, threat.x, threat.y)) return attackHostile(state, unit, threat);
      const step = nextKnownStep(state, unit, threat, false);
      if (step) {
        moveUnit(state, unit, step);
        report(state, unit, unitDisplayName(unit) + " выдвинулся к угрозе в охраняемой области.", "guard-move");
        return true;
      }
      return false;
    }

    if (chebyshev(unit.x, unit.y, order.x, order.y) > 1) {
      const stepHome = nextKnownStep(state, unit, { x: order.x, y: order.y }, false);
      if (stepHome) {
        moveUnit(state, unit, stepHome);
        return true;
      }
    }
    return false;
  }

  function hasTech(state, techId) {
    return !techId || (state.researched || []).includes(techId);
  }

  function improvementForTile(state, tile) {
    return Object.keys(IMPROVEMENTS).find(function (id) {
      const improvement = IMPROVEMENTS[id];
      return id !== "harbor" && improvement.terrain.includes(tile.terrain) && hasTech(state, improvement.tech);
    }) || null;
  }

  function improvementScore(improvement, priority) {
    const yieldValue = improvement.yield || {};
    if (priority === "food") return (yieldValue.food || 0) * 12 + (yieldValue.production || 0) * 3 + (yieldValue.gold || 0);
    if (priority === "production") return (yieldValue.production || 0) * 12 + (yieldValue.food || 0) * 3 + (yieldValue.gold || 0);
    if (priority === "gold") return (yieldValue.gold || 0) * 12 + (yieldValue.production || 0) * 3 + (yieldValue.food || 0);
    return (yieldValue.food || 0) * 5 + (yieldValue.production || 0) * 5 + (yieldValue.gold || 0) * 4 + (yieldValue.science || 0) * 4;
  }

  function tileBelongsToCity(state, city, x, y) {
    const tile = state.map[y][x];
    if (tile.owner === city.id || tile.owner === city.name) return true;
    return chebyshev(city.x, city.y, x, y) <= cityRadius(city);
  }

  function chooseWorkerTarget(state, unit, order) {
    const city = playerCities(state).find(function (item) { return item.id === order.cityId; });
    if (!city) return null;
    const candidates = [];

    state.map.forEach(function (row, y) {
      row.forEach(function (tile, x) {
        if (!tile.revealed || !passableTile(tile) || tile.improvement || tile.poi || tile.camp) return;
        if (!inTerritory(state, x, y) || !tileBelongsToCity(state, city, x, y)) return;
        if (ownCityAt(state, x, y) || barbarianAt(state, x, y) || rivalUnitAt(state, x, y)) return;
        const improvementId = improvementForTile(state, tile);
        if (!improvementId) return;
        const improvement = IMPROVEMENTS[improvementId];
        const distance = chebyshev(unit.x, unit.y, x, y);
        candidates.push({
          x: x,
          y: y,
          improvementId: improvementId,
          score: improvementScore(improvement, order.priority) - distance * 2
        });
      });
    });

    candidates.sort(function (a, b) { return b.score - a.score; });
    return candidates[0] || null;
  }

  function processDevelop(state, unit) {
    const order = unit.order;
    let target = order.target;
    const currentTile = state.map[unit.y][unit.x];

    if (target && (state.map[target.y][target.x].improvement || !improvementForTile(state, state.map[target.y][target.x]))) {
      order.target = null;
      target = null;
    }

    if (!target) {
      target = chooseWorkerTarget(state, unit, order);
      order.target = target;
    }

    if (!target) {
      pauseOrder(state, unit, "нет доступных клеток для выбранного приоритета");
      return false;
    }

    if (unit.x === target.x && unit.y === target.y) {
      const debug = getDebug();
      const before = currentTile.improvement;
      if (debug && typeof debug.buildImprovementWithWorker === "function") {
        debug.buildImprovementWithWorker(unit.id, target.improvementId);
      }
      const after = state.map[unit.y][unit.x].improvement;
      if (after && after !== before) {
        report(state, unit, unitDisplayName(unit) + " построил улучшение «" + IMPROVEMENTS[after].name + "».", "worker-build");
        order.target = null;
        return true;
      }
      pauseOrder(state, unit, "городу не хватает локального производства");
      return false;
    }

    const step = nextKnownStep(state, unit, target, true);
    if (!step) {
      order.target = null;
      pauseOrder(state, unit, "нет безопасного пути к выбранной клетке");
      return false;
    }

    moveUnit(state, unit, step);
    return true;
  }

  function processUnitOrder(state, unit) {
    if (!unit.order || unit.order.status === "paused" || unit.moves <= 0 || unit.acted || unit.hp <= 0) return false;
    if (unit.order.type === "explore" && unit.type === "scout") return processExplore(state, unit);
    if (unit.order.type === "guard" && unit.type !== "worker" && unit.type !== "settler" && unit.type !== "scout") return processGuard(state, unit);
    if (unit.order.type === "develop" && unit.type === "worker") return processDevelop(state, unit);
    pauseOrder(state, unit, "юнит больше не соответствует типу приказа");
    return false;
  }

  function processOrders(state) {
    ensureAutonomyState(state);
    const beforeReports = state.autonomyReports.length;
    (state.units || []).slice().forEach(function (unit) {
      processUnitOrder(state, unit);
    });
    return state.autonomyReports.length - beforeReports;
  }

  function nearestCity(state, unit) {
    return playerCities(state).slice().sort(function (a, b) {
      return chebyshev(unit.x, unit.y, a.x, a.y) - chebyshev(unit.x, unit.y, b.x, b.y);
    })[0] || null;
  }

  function assignOrder(unitId, type, options) {
    const state = ensureAutonomyState(getState());
    const unit = state && unitById(state, unitId);
    if (!unit) return false;

    if (type === "explore" && unit.type !== "scout") return false;
    if (type === "develop" && unit.type !== "worker") return false;
    if (type === "guard" && ["worker", "settler", "scout"].includes(unit.type)) return false;

    if (type === "explore") {
      unit.order = { type: "explore", status: "active", steps: 0 };
    } else if (type === "guard") {
      unit.order = {
        type: "guard",
        status: "active",
        x: options && Number.isFinite(options.x) ? options.x : unit.x,
        y: options && Number.isFinite(options.y) ? options.y : unit.y,
        radius: options && Number.isFinite(options.radius) ? options.radius : 3
      };
    } else if (type === "develop") {
      const city = options && options.cityId
        ? playerCities(state).find(function (item) { return item.id === options.cityId; })
        : nearestCity(state, unit);
      if (!city) return false;
      unit.order = {
        type: "develop",
        status: "active",
        cityId: city.id,
        priority: (options && options.priority) || "balanced",
        target: null
      };
    }

    report(state, unit, unitDisplayName(unit) + " получил приказ «" + ORDER_LABELS[type] + "».", "order-assigned");
    const debug = getDebug();
    if (debug && typeof debug.render === "function") debug.render();
    scheduleRefreshControls();
    return true;
  }

  function cancelOrder(unitId) {
    const state = ensureAutonomyState(getState());
    const unit = state && unitById(state, unitId);
    if (!unit || !unit.order) return false;
    const label = ORDER_LABELS[unit.order.type] || unit.order.type;
    unit.order = null;
    report(state, unit, unitDisplayName(unit) + " отменил приказ «" + label + "».", "order-cancelled");
    const debug = getDebug();
    if (debug && typeof debug.render === "function") debug.render();
    scheduleRefreshControls();
    return true;
  }

  function resumeOrder(unitId) {
    const state = ensureAutonomyState(getState());
    const unit = state && unitById(state, unitId);
    if (!unit || !unit.order) return false;
    unit.order.status = "active";
    unit.order.reason = null;
    report(state, unit, unitDisplayName(unit) + " продолжил выполнение приказа.", "order-resumed");
    const debug = getDebug();
    if (debug && typeof debug.render === "function") debug.render();
    scheduleRefreshControls();
    return true;
  }

  function makeActionButton(label, key, handler, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "context-btn" + (className ? " " + className : "");
    button.dataset.autonomyAction = key;
    button.innerHTML = label;
    button.addEventListener("click", handler);
    return button;
  }

  function orderDescription(unit, state) {
    if (!unit.order) return "";
    const order = unit.order;
    const status = order.status === "paused" ? "приостановлен" : "выполняется";
    let detail = ORDER_LABELS[order.type] || order.type;
    if (order.type === "develop") {
      const city = playerCities(state).find(function (item) { return item.id === order.cityId; });
      detail += city ? " — " + city.name : "";
      detail += " — " + order.priority;
    }
    if (order.type === "guard") detail += " — радиус " + order.radius;
    if (order.reason) detail += " — " + order.reason;
    return "Автоприказ: " + detail + " (" + status + ")";
  }

  function refreshOrderControls() {
    observerScheduled = false;
    const state = ensureAutonomyState(getState());
    const debug = getDebug();
    const actions = document.getElementById("contextActions");
    const text = document.getElementById("contextText");
    const title = document.getElementById("contextTitle");
    if (!state || !debug || !actions || !text || !title) return;

    updateReportButton();

    const unitId = typeof debug.getSelectedUnitId === "function" ? debug.getSelectedUnitId() : null;
    const unit = unitById(state, unitId);
    if (!unit) return;

    const def = UNIT_DEFS[unit.type];
    const showsSelectedUnit = title.textContent.includes(unit.name || "") || title.textContent.includes(def.name);
    if (!showsSelectedUnit) return;

    if (!text.querySelector("[data-autonomy-note]")) {
      const note = document.createElement("div");
      note.dataset.autonomyNote = "true";
      note.style.marginTop = "6px";
      note.style.fontWeight = "700";
      note.textContent = unit.order ? orderDescription(unit, state) : "Автоприказ не назначен.";
      text.appendChild(note);
    }

    if (actions.querySelector("[data-autonomy-action]")) return;

    if (unit.order) {
      if (unit.order.status === "paused") {
        actions.appendChild(makeActionButton("▶️<br>Продолжить", "resume", function () {
          resumeOrder(unit.id);
        }, "alt"));
      }
      actions.appendChild(makeActionButton("✖️<br>Отменить приказ", "cancel", function () {
        cancelOrder(unit.id);
      }, "alt"));
      return;
    }

    if (unit.type === "scout") {
      actions.appendChild(makeActionButton("🧭<br>Авторазведка", "explore", function () {
        assignOrder(unit.id, "explore");
      }, "alt"));
    } else if (unit.type === "worker") {
      actions.appendChild(makeActionButton("🔨<br>Развивать город", "develop", function () {
        const entered = window.prompt("Приоритет: balanced, food, production или gold", "balanced");
        if (!entered) return;
        const priority = ["balanced", "food", "production", "gold"].includes(entered.trim()) ? entered.trim() : "balanced";
        assignOrder(unit.id, "develop", { priority: priority });
      }, "alt"));
    } else if (!["settler"].includes(unit.type)) {
      actions.appendChild(makeActionButton("🛡️<br>Охранять здесь", "guard", function () {
        assignOrder(unit.id, "guard", { x: unit.x, y: unit.y, radius: 3 });
      }, "alt"));
    }
  }

  function scheduleRefreshControls() {
    if (observerScheduled) return;
    observerScheduled = true;
    window.requestAnimationFrame(refreshOrderControls);
  }

  function updateReportButton() {
    const controls = document.querySelector(".map-controls");
    if (!controls) return;
    let button = document.getElementById("autonomyReportBtn");
    if (!button) {
      button = document.createElement("button");
      button.id = "autonomyReportBtn";
      button.type = "button";
      button.className = "map-control-btn";
      button.setAttribute("aria-label", "Открыть отчёт автономных приказов");
      button.textContent = "📜";
      button.addEventListener("click", function () {
        const state = ensureAutonomyState(getState());
        const reports = state ? state.autonomyReports.slice(0, 12) : [];
        reportButtonMarked = false;
        button.textContent = "📜";
        if (!reports.length) {
          window.alert("Отчётов автономных приказов пока нет.");
          return;
        }
        window.alert(reports.map(function (entry) {
          return "Ход " + entry.turn + ": " + entry.text;
        }).join("\n\n"));
      });
      controls.appendChild(button);
    }
    button.textContent = reportButtonMarked ? "📜!" : "📜";
  }

  function installUiHooks() {
    const context = document.getElementById("contextPanel");
    if (context) {
      const observer = new MutationObserver(scheduleRefreshControls);
      observer.observe(context, { childList: true, subtree: true, characterData: true });
    }

    const endTurnButton = document.getElementById("endTurnBtn");
    if (endTurnButton) {
      endTurnButton.addEventListener("click", function () {
        const state = ensureAutonomyState(getState());
        if (!state || endTurnButton.disabled) return;
        processOrders(state);
        const debug = getDebug();
        if (debug && typeof debug.render === "function") debug.render();
        window.setTimeout(scheduleRefreshControls, 180);
      }, true);
    }

    scheduleRefreshControls();
  }

  window.EpohiHumansAutonomy = {
    version: 1,
    ensureAutonomyState: ensureAutonomyState,
    assignOrder: assignOrder,
    cancelOrder: cancelOrder,
    resumeOrder: resumeOrder,
    processOrders: processOrders,
    processUnitOrder: processUnitOrder,
    chooseExploreStep: chooseExploreStep,
    chooseWorkerTarget: chooseWorkerTarget,
    knownHostiles: knownHostiles,
    orderDescription: orderDescription
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installUiHooks, { once: true });
  } else {
    installUiHooks();
  }
})();
