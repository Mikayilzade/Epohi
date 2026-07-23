(function () {
  "use strict";

  if (!window.EpohiData || !window.EpohiUtils) {
    throw new Error("EpohiData and EpohiUtils are required before humans-pathing-core.js");
  }

  const { UNIT_DEFS, BARBARIAN, INTEREST_TYPES } = window.EpohiData;
  const { neighborsOf, passableTile, chebyshev, isAdjacent } = window.EpohiUtils;
  const VERSION = 1;
  let toastTimer = 0;
  let poiArrivalHandler = null;

  function debug() {
    return typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
  }

  function currentState() {
    const value = debug();
    return value && value.state ? value.state : null;
  }

  function unitName(unit) {
    const def = UNIT_DEFS[unit.type] || { name: unit.type || "Юнит" };
    return unit.name || def.name;
  }

  function notify(text, duration) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add("show");
    toastTimer = window.setTimeout(function () { toast.classList.remove("show"); }, duration || 2600);
  }

  function log(gs, eventType, text, coordinates, actorId) {
    gs.eventCounter = (gs.eventCounter || 0) + 1;
    if (!Array.isArray(gs.eventLog)) gs.eventLog = [];
    gs.eventLog.unshift({
      eventId: "ev" + gs.eventCounter,
      turn: gs.turn || 1,
      phase: "player",
      actorType: "unit",
      actorId: actorId || null,
      eventType: eventType,
      text: text,
      coordinates: coordinates || null,
      data: {}
    });
    gs.eventLog = gs.eventLog.slice(0, 180);
    if (!Array.isArray(gs.history)) gs.history = [];
    gs.history.unshift("Ход " + (gs.turn || 1) + ": " + text);
    gs.history = gs.history.slice(0, 60);
  }

  function ensureState(gs) {
    if (!gs) return null;
    (gs.units || []).forEach(function (unit) {
      if (unit.travelOrder === undefined) unit.travelOrder = null;
    });
    return gs;
  }

  function ownUnitAt(gs, x, y, excludedId) {
    return (gs.units || []).find(function (unit) {
      return unit.id !== excludedId && unit.hp > 0 && unit.x === x && unit.y === y;
    }) || null;
  }

  function barbarianAt(gs, x, y) {
    return (gs.barbarians || []).find(function (unit) {
      return unit.hp > 0 && unit.x === x && unit.y === y;
    }) || null;
  }

  function rivalUnitAt(gs, x, y) {
    for (const civ of (gs.rivals || [])) {
      const unit = (civ.units || []).find(function (item) {
        return item.hp > 0 && item.x === x && item.y === y;
      });
      if (unit) return { civ: civ, unit: unit };
    }
    return null;
  }

  function campAt(gs, x, y) {
    const tile = gs.map[y] && gs.map[y][x];
    return tile && tile.camp && tile.camp.hp > 0 ? tile.camp : null;
  }

  function isBlocked(gs, unit, x, y) {
    const tile = gs.map[y] && gs.map[y][x];
    if (!tile || !passableTile(tile)) return true;
    if (!tile.revealed && !gs.openMapMode) return true;
    if (ownUnitAt(gs, x, y, unit.id)) return true;
    return Boolean(barbarianAt(gs, x, y) || rivalUnitAt(gs, x, y) || campAt(gs, x, y));
  }

  function pointKey(x, y) { return x + "," + y; }

  function reconstruct(parent, endKey) {
    const result = [];
    let cursor = endKey;
    while (parent.has(cursor)) {
      const entry = parent.get(cursor);
      result.push(entry.point);
      cursor = entry.from;
    }
    return result.reverse();
  }

  function findPath(gs, unit, goal, options) {
    const size = gs.mapSize || gs.map.length;
    const isGoal = options && options.isGoal
      ? options.isGoal
      : function (point) { return point.x === goal.x && point.y === goal.y; };
    if (isGoal({ x: unit.x, y: unit.y })) return [];

    const queue = [{ x: unit.x, y: unit.y }];
    const seen = new Set([pointKey(unit.x, unit.y)]);
    const parent = new Map();
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      const candidates = neighborsOf(current.x, current.y, size).slice().sort(function (a, b) {
        return chebyshev(a.x, a.y, goal.x, goal.y) - chebyshev(b.x, b.y, goal.x, goal.y);
      });
      for (const next of candidates) {
        const nextKey = pointKey(next.x, next.y);
        if (seen.has(nextKey)) continue;
        seen.add(nextKey);
        if (isBlocked(gs, unit, next.x, next.y)) continue;
        parent.set(nextKey, { from: pointKey(current.x, current.y), point: { x: next.x, y: next.y } });
        if (isGoal(next)) return reconstruct(parent, nextKey);
        queue.push(next);
      }
    }
    return null;
  }

  function locateTarget(gs, order) {
    if (!order) return null;
    if (order.targetKind === "camp") {
      for (let y = 0; y < gs.map.length; y += 1) {
        for (let x = 0; x < gs.map[y].length; x += 1) {
          const camp = campAt(gs, x, y);
          if (camp && (!order.targetId || camp.campId === order.targetId)) {
            return { kind: "camp", target: camp, x: x, y: y };
          }
        }
      }
      return null;
    }
    if (order.targetKind === "barbarian") {
      const target = (gs.barbarians || []).find(function (item) {
        return item.id === order.targetId && item.hp > 0;
      });
      return target ? { kind: "barbarian", target: target, x: target.x, y: target.y } : null;
    }
    if (order.targetKind === "rival") {
      for (const civ of (gs.rivals || [])) {
        const target = (civ.units || []).find(function (item) {
          return item.id === order.targetId && item.hp > 0;
        });
        if (target) return { kind: "rival", target: target, civ: civ, x: target.x, y: target.y };
      }
      return null;
    }
    if (order.targetKind === "poi") {
      const tile = gs.map[order.y] && gs.map[order.y][order.x];
      return tile && tile.poi && !tile.poi.used
        ? { kind: "poi", target: tile.poi, tile: tile, x: order.x, y: order.y }
        : null;
    }
    return { kind: "move", x: order.x, y: order.y };
  }

  function pathForOrder(gs, unit, order) {
    const target = locateTarget(gs, order);
    if (!target) return { target: null, path: null };
    if (order.type === "attack") {
      return {
        target: target,
        path: findPath(gs, unit, target, {
          isGoal: function (point) { return isAdjacent(point.x, point.y, target.x, target.y); }
        })
      };
    }
    return { target: target, path: findPath(gs, unit, target) };
  }

  function revealAround(gs, x, y, radius) {
    const size = gs.mapSize || gs.map.length;
    for (let yy = Math.max(0, y - radius); yy <= Math.min(size - 1, y + radius); yy += 1) {
      for (let xx = Math.max(0, x - radius); xx <= Math.min(size - 1, x + radius); xx += 1) {
        gs.map[yy][xx].revealed = true;
      }
    }
    const value = debug();
    if (value && typeof value.updateCampDiscovery === "function") value.updateCampDiscovery(gs);
  }

  function moveOne(gs, unit, point) {
    if (!point || unit.moves <= 0 || unit.acted || isBlocked(gs, unit, point.x, point.y)) return false;
    unit.x = point.x;
    unit.y = point.y;
    unit.moves = Math.max(0, unit.moves - 1);
    if (unit.moves <= 0) unit.acted = true;
    const sight = unit.type === "scout" ? 1 + ((gs.permanentBonuses || {}).scoutSight || 0) : 1;
    revealAround(gs, unit.x, unit.y, sight);
    return true;
  }

  function estimateTurns(unit, steps) {
    const maxMoves = Math.max(1, (UNIT_DEFS[unit.type] && UNIT_DEFS[unit.type].maxMoves) || 1);
    return Math.ceil(Math.max(0, steps - Math.max(0, unit.moves || 0)) / maxMoves);
  }

  function centerCombat(x, y) {
    const value = debug();
    if (value && typeof value.centerCameraOnTile === "function") value.centerCameraOnTile(x, y, true);
    const viewport = document.getElementById("mapViewport");
    if (!viewport) return;
    viewport.classList.remove("combat-focus");
    void viewport.offsetWidth;
    viewport.classList.add("combat-focus");
    window.setTimeout(function () { viewport.classList.remove("combat-focus"); }, 520);
  }

  function attackValue(unit) {
    return Math.max(4, (UNIT_DEFS[unit.type] && UNIT_DEFS[unit.type].attack) || 4);
  }

  function defenseValue(unit) {
    return Math.max(0, (UNIT_DEFS[unit.type] && UNIT_DEFS[unit.type].defense) || 0);
  }

  function damage(attack, defense) {
    return Math.max(4, Math.round(attack - defense * 0.32));
  }

  function resolveAttack(gs, unit, located) {
    centerCombat(located.x, located.y);
    const enemyDefense = located.kind === "camp" ? 12 :
      (located.kind === "barbarian" ? (BARBARIAN.raiderDefense || 10) : defenseValue(located.target));
    const dealt = damage(attackValue(unit), enemyDefense);
    unit.moves = 0;
    unit.acted = true;

    if (located.kind === "camp") {
      located.target.hp -= dealt;
      if (located.target.hp <= 0) {
        const value = debug();
        if (value && typeof value.campReward === "function") {
          value.campReward({ resources: gs.resources, civilizationId: null, name: "Ардена" }, unit, located.x, located.y);
        } else {
          gs.map[located.y][located.x].camp = null;
          gs.resources.gold = (gs.resources.gold || 0) + 25;
        }
        unit.travelOrder = null;
        notify("Лагерь уничтожен");
        return true;
      }
      unit.hp -= damage(BARBARIAN.raiderAttack || 20, defenseValue(unit));
      if (unit.hp <= 0) {
        gs.units = (gs.units || []).filter(function (item) { return item.id !== unit.id; });
        notify(unitName(unit) + " погиб");
      }
      log(gs, "route-combat", unitName(unit) + " атаковал лагерь: −" + dealt + " прочности.", { x: located.x, y: located.y }, unit.id);
      return true;
    }

    located.target.hp -= dealt;
    if (located.target.hp <= 0) {
      if (located.kind === "barbarian") {
        gs.barbarians = (gs.barbarians || []).filter(function (item) { return item.id !== located.target.id; });
      } else if (located.civ) {
        located.civ.units = (located.civ.units || []).filter(function (item) { return item.id !== located.target.id; });
      }
      unit.travelOrder = null;
      log(gs, "route-combat-win", unitName(unit) + " уничтожил противника.", { x: located.x, y: located.y }, unit.id);
      notify("Противник уничтожен");
      return true;
    }

    const counter = located.kind === "barbarian" ? (BARBARIAN.raiderAttack || 20) : attackValue(located.target);
    unit.hp -= damage(counter, defenseValue(unit));
    if (unit.hp <= 0) {
      gs.units = (gs.units || []).filter(function (item) { return item.id !== unit.id; });
      notify(unitName(unit) + " погиб");
    }
    log(gs, "route-combat", unitName(unit) + " вступил в бой: нанесено " + dealt + " урона.", { x: located.x, y: located.y }, unit.id);
    return true;
  }

  function completeOrder(gs, unit, text) {
    unit.travelOrder = null;
    if (text) log(gs, "route-completed", text, { x: unit.x, y: unit.y }, unit.id);
  }

  function processUnit(gs, unit, options) {
    if (!unit.travelOrder || unit.travelOrder.status === "awaiting-choice" || unit.hp <= 0 || unit.moves <= 0 || unit.acted) return false;
    let changed = false;
    let guard = 0;
    while (unit.travelOrder && unit.moves > 0 && !unit.acted && guard < 12) {
      guard += 1;
      const order = unit.travelOrder;
      const route = pathForOrder(gs, unit, order);
      const target = route.target;
      if (!target) {
        completeOrder(gs, unit, unitName(unit) + " прекратил путь: цель больше не существует.");
        notify("Цель маршрута исчезла");
        return true;
      }
      order.x = target.x;
      order.y = target.y;
      order.path = route.path || [];
      order.status = "active";
      order.reason = null;

      if (order.type === "attack" && isAdjacent(unit.x, unit.y, target.x, target.y)) {
        return resolveAttack(gs, unit, target) || changed;
      }
      if (order.type === "poi" && unit.x === target.x && unit.y === target.y) {
        order.status = "awaiting-choice";
        unit.moves = 0;
        unit.acted = true;
        centerCombat(target.x, target.y);
        if (poiArrivalHandler) poiArrivalHandler(gs, unit, target);
        return true;
      }
      if (order.type === "move" && unit.x === target.x && unit.y === target.y) {
        completeOrder(gs, unit, unitName(unit) + " прибыл в назначенную точку.");
        return true;
      }
      if (!route.path || !route.path.length) {
        order.status = "waiting";
        order.reason = "путь временно перекрыт";
        return changed;
      }
      if (!moveOne(gs, unit, route.path[0])) {
        order.status = "waiting";
        order.reason = "маршрут изменился; будет пересчитан";
        return changed;
      }
      changed = true;
    }
    if (changed && options && options.render !== false) {
      const value = debug();
      if (value && typeof value.render === "function") value.render();
    }
    return changed;
  }

  function processOrders(gs, options) {
    ensureState(gs);
    let changed = false;
    (gs.units || []).slice().forEach(function (unit) {
      if (unit.travelOrder) changed = processUnit(gs, unit, { render: false }) || changed;
    });
    if (changed && (!options || options.render !== false)) {
      const value = debug();
      if (value && typeof value.render === "function") value.render();
    }
    return changed;
  }

  function targetFromTile(gs, x, y) {
    const tile = gs.map[y] && gs.map[y][x];
    if (!tile) return null;
    const rival = rivalUnitAt(gs, x, y);
    const barbarian = barbarianAt(gs, x, y);
    const camp = campAt(gs, x, y);
    if (camp) return { type: "attack", targetKind: "camp", targetId: camp.campId || null, x: x, y: y };
    if (barbarian) return { type: "attack", targetKind: "barbarian", targetId: barbarian.id, x: x, y: y };
    if (rival) return { type: "attack", targetKind: "rival", targetId: rival.unit.id, civilizationId: rival.civ.civilizationId, x: x, y: y, civ: rival.civ };
    if (tile.poi && !tile.poi.used) return { type: "poi", targetKind: "poi", targetId: tile.poi.type, x: x, y: y };
    return { type: "move", targetKind: "tile", targetId: null, x: x, y: y };
  }

  function assignTravelOrder(unitId, destination) {
    const gs = ensureState(currentState());
    const unit = gs && (gs.units || []).find(function (item) { return item.id === unitId; });
    if (!unit || !destination) return false;
    if (destination.type === "attack" && destination.targetKind === "rival" && destination.civ && destination.civ.relation !== "war") {
      if (!window.confirm("Объявить войну государству «" + destination.civ.name + "» и начать атаку?")) return false;
      destination.civ.relation = "war";
    }
    const order = {
      version: VERSION,
      type: destination.type,
      targetKind: destination.targetKind,
      targetId: destination.targetId || null,
      civilizationId: destination.civilizationId || null,
      x: destination.x,
      y: destination.y,
      status: "active",
      reason: null,
      path: [],
      issuedTurn: gs.turn || 1
    };
    unit.order = null;
    unit.travelOrder = order;
    const route = pathForOrder(gs, unit, order);
    if (!route.target) {
      unit.travelOrder = null;
      notify("Цель уже недоступна");
      return false;
    }
    if (route.path === null) {
      order.status = "waiting";
      order.reason = "сейчас нет доступного пути";
      notify("Путь пока перекрыт — приказ сохранён");
    } else {
      order.path = route.path;
      processUnit(gs, unit, { render: false });
      const value = debug();
      if (value && typeof value.render === "function") value.render();
      if (unit.travelOrder) {
        const remaining = pathForOrder(gs, unit, unit.travelOrder).path;
        unit.travelOrder.path = remaining || [];
      }
      notify(order.type === "attack" ? "Маршрут атаки назначен" : (order.type === "poi" ? "Отряд направлен к находке" : "Маршрут назначен"));
    }
    log(gs, "route-assigned", unitName(unit) + " получил маршрут к клетке " + destination.x + ", " + destination.y + ".", { x: destination.x, y: destination.y }, unit.id);
    return true;
  }

  function cancelTravelOrder(unitId) {
    const gs = ensureState(currentState());
    const unit = gs && (gs.units || []).find(function (item) { return item.id === unitId; });
    if (!unit || !unit.travelOrder) return false;
    unit.travelOrder = null;
    notify("Маршрут отменён");
    return true;
  }

  function resolvePoiChoice(unitId, x, y, choice) {
    const gs = ensureState(currentState());
    const unit = gs && (gs.units || []).find(function (item) { return item.id === unitId; });
    const tile = gs && gs.map[y] && gs.map[y][x];
    if (!gs || !unit || !tile || !tile.poi || tile.poi.used) return false;
    const typeId = tile.poi.type || "unknown";
    const type = (INTEREST_TYPES[typeId] && INTEREST_TYPES[typeId].name) || typeId;
    if (choice === "study") {
      gs.resources.science = (gs.resources.science || 0) + 10;
      log(gs, "poi-studied", unitName(unit) + " исследовал объект «" + type + "» и получил 10 науки.", { x: x, y: y }, unit.id);
    } else {
      gs.resources.gold = (gs.resources.gold || 0) + 12;
      const city = (gs.cities || []).slice().sort(function (a, b) {
        return chebyshev(unit.x, unit.y, a.x, a.y) - chebyshev(unit.x, unit.y, b.x, b.y);
      })[0];
      if (city) city.production = (city.production || 0) + 6;
      log(gs, "poi-salvaged", unitName(unit) + " разобрал объект «" + type + "»: +12 золота и +6 производства ближайшему городу.", { x: x, y: y }, unit.id);
    }
    tile.poi.used = true;
    unit.travelOrder = null;
    const value = debug();
    if (value && typeof value.render === "function") value.render();
    notify("Находка использована");
    return true;
  }

  window.EpohiHumansPathing = {
    version: VERSION,
    ensureState: ensureState,
    currentState: currentState,
    findPath: findPath,
    pathForOrder: pathForOrder,
    locateTarget: locateTarget,
    targetFromTile: targetFromTile,
    assignTravelOrder: assignTravelOrder,
    cancelTravelOrder: cancelTravelOrder,
    processUnit: processUnit,
    processOrders: processOrders,
    estimateTurns: estimateTurns,
    resolvePoiChoice: resolvePoiChoice,
    unitName: unitName,
    setPoiArrivalHandler: function (handler) { poiArrivalHandler = handler; }
  };
})();
