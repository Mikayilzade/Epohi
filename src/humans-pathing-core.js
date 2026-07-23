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
    const def = UNIT_DEFS[unit.type] || { name: unit.type || "Ð®Ð½Ð¸Ñ‚" };
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
    gs.history.unshift("Ð¥Ð¾Ð´ " + (gs.turn || 1) + ": " + text);
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

  function revealAround(gs, x, y,radius) {
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
          value.campReward({ resources: gs.resources, civilizationId: null, name: "ÐÑ€Ð´ÐµÐ½Ð°" }, unit, located.x, located.y);
        } else {
          gs.map[located.y][located.x].camp = null;
          gs.resources.gold = (gs.resources.gold || 0) + 25;
        }
        unit.travelOrder = null;
        notify("Ð›Ð°Ð³ÐµÑ€ÑŒ ÖB÷BãFFBûBÛB×Bôˆ¤ì(€€€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€€€ô(€€€€€Õ¹¥Ð¹¡À€´ô‘…µ…”¡	I	I%8¹É…¥‘•ÉÑÑ…¬ñð€ÈÀ°‘•™•¹Í•Y…±Õ”¡Õ¹¥Ð¤¤ì(€€€€€¥˜€¡Õ¹¥Ð¹¡À€ðô€À¤ì(€€€€€€€Ì¹Õ¹¥ÑÌ€ô€¡Ì¹Õ¹¥ÑÌñðmt¤¹™¥±Ñ•È¡™Õ¹Ñ¥½¸€¡¥Ñ•´¤ìÉ•ÑÕÉ¸¥Ñ•´¹¥€„ôôÕ¹¥Ð¹¥ìô¤ì(€€€€€€€¹½Ñ¥™ä¡Õ¹¥Ñ9…µ”¡Õ¹¥Ð¤€¬€ˆƒBÿBûBÏBãBÌˆ¤ì(€€€€€ô(€€€€€±½œ¡Ì°€‰É½ÕÑ”µ½µ‰…Ðˆ°Õ¹¥Ñ9…µ”¡Õ¹¥Ð¤€¬€ˆƒBÃFBÃBëBûBËBÃBìƒBïBÃBÏB×FF0èƒŠ"Hˆ€¬‘•…±Ð€¬€ˆƒBÿFBûFB÷BûFFBà¸ˆ°ìàè±½…Ñ•¹à°äè±½…Ñ•¹äô°Õ¹¥Ð¹¥¤ì(€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€ô((€€€±½…Ñ•¹Ñ…É•Ð¹¡À€´ô‘•…±Ðì(€€€¥˜€¡±½…Ñ•¹Ñ…É•Ð¹¡À€ðô€À¤ì(€€€€€¥˜€¡±½…Ñ•¹­¥¹€ôôô€‰‰…É‰…É¥…¸ˆ¤ì(€€€€€€€Ì¹‰…É‰…É¥…¹Ì€ô€¡Ì¹‰…É‰…É¥…¹Ìñðmt¤¹™¥±Ñ•È¡™Õ¹Ñ¥½¸€¡¥Ñ•´¤ìÉ•ÑÕÉ¸¥Ñ•´¹¥€„ôô±½…Ñ•¹Ñ…É•Ð¹¥ìô¤ì(€€€€€ô•±Í”¥˜€¡±½…Ñ•¹¥Ø¤ì(€€€€€€€±½…Ñ•¹¥Ø¹Õ¹¥ÑÌ€ô€¡±½…Ñ•¹¥Ø¹Õ¹¥ÑÌñðmt¤¹™¥±Ñ•È¡™Õ¹Ñ¥½¸€¡¥Ñ•´¤ìÉ•ÑÕÉ¸¥Ñ•´¹¥€„ôô±½…Ñ•¹Ñ…É•Ð¹¥ìô¤ì(€€€€€ô(€€€€€Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È€ô¹Õ±°ì(€€€€€±½œ¡Ì°€‰É½ÕÑ”µ½µ‰…ÐµÝ¥¸ˆ°Õ¹¥Ñ9…µ”¡Õ¹¥Ð¤€¬€ˆƒFB÷BãFFBûBÛBãBìƒBÿFBûFBãBËB÷BãBëBÀ¸ˆ°ìàè±½…Ñ•¹à°äè±½…Ñ•¹äô°Õ¹¥Ð¹¥¤ì(€€€€€¹½Ñ¥™ä ‹BFBûFBãBËB÷BãBèƒFB÷BãFFBûBÛB×Bôˆ¤ì(€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€ô((€€€½¹ÍÐ½Õ¹Ñ•È€ô±½…Ñ•¹­¥¹€ôôô€‰‰…É‰…É¥…¸ˆ€ü€¡	I	I%8¹É…¥‘•ÉÑÑ…¬ñð€ÈÀ¤€è…ÑÑ…­Y…±Õ”¡±½…Ñ•¹Ñ…É•Ð¤ì(€€€Õ¹¥Ð¹¡À€´ô‘…µ…”¡½Õ¹Ñ•È°‘•™•¹Í•Y…±Õ”¡Õ¹¥Ð¤¤ì(€€€¥˜€¡Õ¹¥Ð¹¡À€ðô€À¤ì(€€€€€Ì¹Õ¹¥ÑÌ€ô€¡Ì¹Õ¹¥ÑÌñðmt¤¹™¥±Ñ•È¡™Õ¹Ñ¥½¸€¡¥Ñ•´¤ìÉ•ÑÕÉ¸¥Ñ•´¹¥€„ôôÕ¹¥Ð¹¥ìô¤ì(€€€€€¹½Ñ¥™ä¡Õ¹¥Ñ9…µ”¡Õ¹¥Ð¤€¬€ˆƒBÿBûBÏBãBÄˆ¤ì(€€€ô(€€€±½œ¡Ì°€‰É½ÕÑ”µ½µ‰…Ðˆ°Õ¹¥Ñ9…µ”¡Õ¹¥Ð¤€¬€ˆƒBËFFFBÿBãBìƒBÈƒBÇBûBäèƒB÷BÃB÷B×FB×B÷Bø€ˆ€¬‘•…±Ð€¬€ˆƒFFBûB÷BÀ¸ˆ°ìàè±½…Ñ•¹à°äè±½…Ñ•¹äô°Õ¹¥Ð¹¥¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô((€™Õ¹Ñ¥½¸½µÁ±•Ñ•=É‘•È¡Ì°Õ¹¥Ð°Ñ•áÐ¤ì(€€€Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È€ô¹Õ±°ì(€€€¥˜€¡Ñ•áÐ¤±½œ¡Ì°€‰É½ÕÑ”µ½µÁ±•Ñ•ˆ°Ñ•áÐ°ìàèÕ¹¥Ð¹à°äèÕ¹¥Ð¹äô°Õ¹¥Ð¹¥¤ì(€ô((€™Õ¹Ñ¥½¸ÁÉ½•ÍÍU¹¥Ð¡Ì°Õ¹¥Ð°½ÁÑ¥½¹Ì¤ì(€€€¥˜€ …Õ¹¥Ð¹ÑÉ…Ù•±=É‘•ÈñðÕ¹¥Ð¹ÑÉ…Ù•±=É‘•È¹ÍÑ…ÑÕÌ€ôôô€‰…Ý…¥Ñ¥¹œµ¡½¥”ˆñðÕ¹¥Ð¹¡À€ðô€ÀñðÕ¹¥Ð¹µ½Ù•Ì€ðô€ÀñðÕ¹¥Ð¹…Ñ•¤É•ÑÕÉ¸™…±Í”ì(€€€±•Ð¡…¹•€ô™…±Í”ì(€€€±•ÐÕ…É€ô€Àì(€€€Ý¡¥±”€¡Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È€˜˜Õ¹¥Ð¹µ½Ù•Ì€ø€À€˜˜€…Õ¹¥Ð¹…Ñ•€˜˜Õ…É€ð€ÄÈ¤ì(€€€€€Õ…É€¬ô€Äì(€€€€€½¹ÍÐ½É‘•È€ôÕ¹¥Ð¹ÑÉ…Ù•±=É‘•Èì(€€€€€½¹ÍÐÉ½ÕÑ”€ôÁ…Ñ¡½É=É‘•È¡Ì°Õ¹¥Ð°½É‘•È¤ì(€€€€€½¹ÍÐÑ…É•Ð€ôÉ½ÕÑ”¹Ñ…É•Ðì(€€€€€¥˜€ …Ñ…É•Ð¤ì(€€€€€€€½µÁ±•Ñ•=É‘•È¡Ì°Õ¹¥Ð°Õ¹¥Ñ9…µ”¡Õ¹¥Ð¤€¬€ˆƒBÿFB×BëFBÃFBãBìƒBÿFFF0èƒFB×BïF0ƒBÇBûBïF3F#BÔƒB÷BÔƒFFF'B×FFBËFB×F¸ˆ¤ì(€€€€€€€¹½Ñ¥™ä ‹B›B×BïF0ƒBóBÃFF#FFFBÀƒBãFFB×BßBïBÀˆ¤ì(€€€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€ô(€€€½É‘•È¹à€ôÑ…É•Ð¹àì(€€€½É‘•È¹ä€ôÑ…É•Ð¹äì(€€€½É‘•È¹Á…Ñ €ôÉ½ÕÑ”¹Á…Ñ ñðmtì(€€€½É‘•È¹ÍÑ…ÑÕÌ€ô€‰…Ñ¥Ù”ˆì(€€€½É‘•È¹É•…Í½¸€ô¹Õ±°ì((€€€¥˜€¡½É‘•È¹ÑåÁ”€ôôô€‰…ÑÑ…¬ˆ€˜˜¥Í‘©…•¹Ð¡Õ¹¥Ð¹à°Õ¹¥Ð¹ä°Ñ…É•Ð¹à°Ñ…É•Ð¹ä¤¤ì(€€€€€É•ÑÕÉ¸É•Í½±Ù•ÑÑ…¬¡Ì°Õ¹¥Ð°Ñ…É•Ð¤ñð¡…¹•ì(€€€ô(€€€¥˜€¡½É‘•È¹ÑåÁ”€ôôô€‰Á½¤ˆ€˜˜Õ¹¥Ð¹à€ôôôÑ…É•Ð¹à€˜˜Õ¹¥Ð¹ä€ôôôÑ…É•Ð¹ä¤ì(€€€€€½É‘•È¹ÍÑ…ÑÕÌ€ô€‰…Ý…¥Ñ¥¹œµ¡½¥”ˆì(€€€€€Õ¹¥Ð¹µ½Ù•Ì€ô€Àì(€€€€€Õ¹¥Ð¹…Ñ•€ôÑÉÕ”ì(€€€€€•¹Ñ•É½µ‰…Ð¡Ñ…É•Ð¹à°Ñ…É•Ð¹ä¤ì(€€€€€¥˜€¡Á½¥ÉÉ¥Ù…±!…¹‘±•È¤Á½¥ÉÉ¥Ù…±!…¹‘±•È¡Ì°Õ¹¥Ð°Ñ…É•Ð¤ì(€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€ô(€€€¥˜€¡½É‘•È¹ÑåÁ”€ôôô€‰µ½Ù”ˆ€˜˜Õ¹¥Ð¹à€ôôôÑ…É•Ð¹à€˜˜Õ¹¥Ð¹ä€ôôôÑ…É•Ð¹ä¤ì(€€€€€½µÁ±•Ñ•=É‘•È¡Ì°Õ¹¥Ð°Õ¹¥Ñ9…µ”¡Õ¹¥Ð¤€¬€ˆƒBÿFBãBÇF/BìƒBÈƒB÷BÃBßB÷BÃFB×B÷B÷FF8ƒFBûFBëF¸ˆ¤ì(€€€€€É•ÑÕÉ¸ÑÉÕ”ì(€€€ô(€€€¥˜€ …É½ÕÑ”¹Á…Ñ ñð€…É½ÕÑ”¹Á…Ñ ¹±•¹Ñ ¤ì(€€€€€½É‘•È¹ÍÑ…ÑÕÌ€ô€‰Ý…¥Ñ¥¹œˆì(€€€€€½É‘•È¹É•…Í½¸€ô€‹BÿFFF0ƒBËFB×BóB×B÷B÷BøƒBÿB×FB×BëFF/Fˆì(€€€€€É•ÑÕÉ¸¡…¹•ì(€€€ô(€€€¥˜€ …µ½Ù•=¹”¡Ì°Õ¹¥Ð°É½ÕÑ”¹Á…Ñ¡lÁt¤¤ì(€€€€€½É‘•È¹ÍÑ…ÑÕÌ€ô€‰Ý…¥Ñ¥¹œˆì(€€€€€½É‘•È¹É•…Í½¸€ô€‹BóBÃFF#FFFƒBãBßBóB×B÷BãBïFF<ìƒBÇFBÓB×FƒBÿB×FB×FFBãFBÃBôˆì(€€€€€É•ÑÕÉ¸¡…¹•ì(€€€ô(€€€¡…¹•€ôÑÉÕ”ì(€ô(€€€¥˜€¡¡…¹•€˜˜½ÁÑ¥½¹Ì€˜˜½ÁÑ¥½¹Ì¹É•¹‘•È€„ôô™…±Í”¤ì(€€€½¹ÍÐÙ…±Õ”€ô‘•‰Õœ ¤ì(€€€¥˜€¡Ù…±Õ”€˜˜ÑåÁ•½˜Ù…±Õ”¹É•¹‘•È€ôôô€‰™Õ¹Ñ¥½¸ˆ¤Ù…±Õ”¹É•¹‘•È ¤ì(€ô(€É•ÑÕÉ¸¡…¹•ì)ô((€™Õ¹Ñ¥½¸ÁÉ½•ÍÍ=É‘•ÉÌ¡Ì°½ÁÑ¥½¹Ì¤ì(€€€•¹ÍÕÉ•MÑ…Ñ”¡Ì¤ì(€€€±•Ð¡…¹•€ô™…±Í”ì(€€€€¡Ì¹Õ¹¥ÑÌñðmt¤¹Í±¥” ¤¹™½É… ¡™Õ¹Ñ¥½¸€¡Õ¹¥Ð¤ì(€€€¥˜€¡Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È¤¡…¹•€ôÁÉ½•ÍÍU¹¥Ð¡Ì°Õ¹¥Ð°ìÉ•¹‘•Èè™…±Í”ô¤ñð¡…¹•ì(€ô¤ì(€¥˜€¡¡…¹•€˜˜€ …½ÁÑ¥½¹Ìñð½ÁÑ¥½¹Ì¹É•¹‘•È€„ôô™…±Í”¤¤ì(€½¹ÍÐÙ…±Õ”€ô‘•‰Õœ ¤ì(¥˜€¡Ù…±Õ”€˜˜ÑåÁ•½˜Ù…±Õ”¹É•¹‘•È€ôôô€‰™Õ¹Ñ¥½¸ˆ¤Ù…±Õ”¹É•¹‘•È ¤ì)ô(É•ÑÕÉ¸¡…¹•ì)ô((€™Õ¹Ñ¥½¸Ñ…É•ÑÉ½µQ¥±”¡Ì°à°ä¤ì(€€€½¹ÍÐÑ¥±”€ôÌ¹µ…Ámåt€˜˜Ì¹µ…Ámåumátì(€€€¥˜€ …Ñ¥±”¤É•ÑÕÉ¸¹Õ±°ì(€€€½¹ÍÐÉ¥Ù…°€ôÉ¥Ù…±U¹¥ÑÐ¡Ì°à°ä¤ì(€€€½¹ÍÐ‰…É‰…É¥…¸€ô‰…É‰…É¥…¹Ð¡Ì°à°ä¤ì(€€€½¹ÍÐ…µÀ€ô…µÁÐ¡Ì°à°ä¤ì(€€€¥˜€¡…µÀ¤É•ÑÕÉ¸ìÑåÁ”è€‰…ÑÑ…¬ˆ°Ñ…É•Ñ-¥¹è€‰…µÀˆ°Ñ…É•Ñ%è…µÀ¹…µÁ%ñð¹Õ±°°àèà°äèäôì(€€€¥˜€¡‰…É‰…É¥…¸¤É•ÑÕÉ¸ìÑåÁ”è€‰…ÑÑ…¬ˆ°Ñ…É•Ñ-¥¹è€‰‰…É‰…É¥…¸ˆ°Ñ…É•Ñ%è‰…É‰…É¥…¸¹¥°àèà°äèäôì(€€€¥˜€¡É¥Ù…°¤É•ÑÕÉ¸ìÑåÁ”è€‰…ÑÑ…¬ˆ°Ñ…É•Ñ-¥¹è€‰É¥Ù…°ˆ°Ñ…É•Ñ%èÉ¥Ù…°¹Õ¹¥Ð¹¥°¥Ù¥±¥é…Ñ¥½¹%èÉ¥Ù…°¹¥Ø¹¥Ù¥±¥é…Ñ¥½¹%°àèà°äèä°¥ØèÉ¥Ù…°¹¥Øôì(€€€¥˜€¡Ñ¥±”¹Á½¤€˜˜€…Ñ¥±”¹Á½¤¹ÕÍ•¤É•ÑÕÉ¸ìÑåÁ”è€‰Á½¤ˆ°Ñ…É•Ñ-¥¹è€‰Á½¤ˆ°Ñ…É•Ñ%èÑ¥±”¹Á½¤¹ÑåÁ”°àèà°äèäôì(€€€É•ÑÕÉ¸ìÑåÁ”è€‰µ½Ù”ˆ°Ñ…É•Ñ-¥¹è€‰Ñ¥±”ˆ°Ñ…É•Ñ%è¹Õ±°°àèà°äèäôì(€ô((€™Õ¹Ñ¥½¸…ÍÍ¥¹QÉ…Ù•±=É‘•È¡Õ¹¥Ñ%°‘•ÍÑ¥¹…Ñ¥½¸¤ì(€€€½¹ÍÐÌ€ô•¹ÍÕÉ•MÑ…Ñ”¡ÕÉÉ•¹ÑMÑ…Ñ” ¤¤ì(€€€½¹ÍÐÕ¹¥Ð€ôÌ€˜˜€¡Ì¹Õ¹¥ÑÌñðmt¤¹™¥¹¡™Õ¹Ñ¥½¸€¡¥Ñ•´¤ìÉ•ÑÕÉ¸MÑÉ¥¹œ¡¥Ñ•´¹¥¤€ôôôMÑÉ¥¹œ¡Õ¹¥Ñ%¤ìô¤ì(€€€¥˜€ …Õ¹¥Ðñð€…‘•ÍÑ¥¹…Ñ¥½¸¤É•ÑÕÉ¸™…±Í”ì(€€€¥˜€¡‘•ÍÑ¥¹…Ñ¥½¸¹ÑåÁ”€ôôô€‰…ÑÑ…¬ˆ€˜˜‘•ÍÑ¥¹…Ñ¥½¸¹Ñ…É•Ñ-¥¹€ôôô€‰É¥Ù…°ˆ€˜˜‘•ÍÑ¥¹…Ñ¥½¸¹¥Ø€˜˜‘•ÍÑ¥¹…Ñ¥½¸¹¥Ø¹É•±…Ñ¥½¸€„ôô€‰Ý…Èˆ¤ì(€€€€€¥˜€ …Ý¥¹‘½Ü¹½¹™¥É´ ‹B{BÇF+F?BËBãFF0ƒBËBûBçB÷FƒBÏBûFFBÓBÃFFFBËFƒ
¬ˆ€¬‘•ÍÑ¥¹…Ñ¥½¸¹¥Ø¹¹…µ”€¬€‹
ìƒBàƒB÷BÃFBÃFF0ƒBÃFBÃBëFüˆ¤¤É•ÑÕÉ¸™…±Í”ì(€€€€€‘•ÍÑ¥¹…Ñ¥½¸¹¥Ø¹É•±…Ñ¥½¸€ô€‰Ý…Èˆì(€€€ô(€€€½¹ÍÐ½É‘•È€ôì(€€€Ù•ÉÍ¥½¸èYIM%=8°(€€€ÑåÁ”è‘•ÍÑ¥¹…Ñ¥½¸¹ÑåÁ”°(€€€Ñ…É•Ñ-¥¹è‘•ÍÑ¥¹…Ñ¥½¸¹Ñ…É•Ñ-¥¹°(€€€Ñ…É•Ñ%è‘•ÍÑ¥¹…Ñ¥½¸¹Ñ…É•Ñ%ñð¹Õ±°°(€€€¥Ù¥±¥é…Ñ¥½¹%è‘•ÍÑ¥¹…Ñ¥½¸¹¥Ù¥±¥é…Ñ¥½¹%ñð¹Õ±°°(€€€àè‘•ÍÑ¥¹…Ñ¥½¸¹à°(€€äè‘•ÍÑ¥¹…Ñ¥½¸¹ä°(€€€ÍÑ…ÑÕÌè€‰…Ñ¥Ù”ˆ°(€€É•…Í½¸è¹Õ±°°(€€€Á…Ñ èmt°(€€¥ÍÍÕ•‘QÕÉ¸èÌ¹ÑÕÉ¸ñð€Ä(€€€ôì(€€€Õ¹¥Ð¹½É‘•È€ô¹Õ±°ì(€€€Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È€ô½É‘•Èì(€€€½¹ÍÐÉ½ÕÑ”€ôÁ…Ñ¡½É=É‘•È¡Ì°Õ¹¥Ð°½É‘•È¤ì(€€€¥˜€ …É½ÕÑ”¹Ñ…É•Ð¤ì(€Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È€ô¹Õ±°ì(¹½Ñ¥™ä ‹B›B×BïF0ƒFBÛBÔƒB÷B×BÓBûFFFBÿB÷BÀˆ¤ì)É•ÑÕÉ¸™…±Í”ì(€ô(€¥˜€¡É½ÕÑ”¹Á…Ñ €ôôô¹Õ±°¤ì(½É‘•È¹ÍÑ…ÑÕÌ€ô€‰Ý…¥Ñ¥¹œˆì)½É‘•È¹É•…Í½¸€ô€‹FB×BçFBÃFƒB÷B×FƒBÓBûFFFBÿB÷BûBÏBøƒBÿFFBàˆì)¹½Ñ¥™ä ‹BFFF0ƒBÿBûBëBÀƒBÿB×FB×BëFF/FƒŠPƒBÿFBãBëBÃBÜƒFBûFFBÃB÷FGBôˆ¤ì(€ô•±Í”ì(½É‘•È¹Á…Ñ €ôÉ½ÕÑ”¹Á…Ñ ì)ÁÉ½•ÍÍU¹¥Ð¡Ì°Õ¹¥Ð°ìÉ•¹‘•Èè™…±Í”ô¤ì)½¹ÍÐÙ…±Õ”€ô‘•‰Õœ ¤ì)¥˜€¡Ù…±Õ”€˜˜ÑåÁ•½˜Ù…±Õ”¹É•¹‘•È€ôôô€‰™Õ¹Ñ¥½¸ˆ¤Ù…±Õ”¹É•¹‘•È ¤ì)¥˜€¡Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È¤ì(€½¹ÍÐÉ•µ…¥¹¥¹œ€ôÁ…Ñ¡½É=É‘•È¡Ì°Õ¹¥Ð°Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È¤¹Á…Ñ ì(Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È¹Á…Ñ €ôÉ•µ…¥¹¥¹œñðmtì)ô)¹½Ñ¥™ä¡½É‘•È¹ÑåÁ”€ôôô€‰…ÑÑ…¬ˆ€ü€‹BsBÃFF#FFFƒBÃFBÃBëBàƒB÷BÃBßB÷BÃFB×Bôˆ€è€¡½É‘•È¹ÑåÁ”€ôôô€‰Á½¤ˆ€ü€‹B{FFF?BÐƒB÷BÃBÿFBÃBËBïB×BôƒBèƒB÷BÃFBûBÓBëBÔˆ€è€‹BsBÃFF#FFFƒB÷BÃBßB÷BÃFB×Bôˆ¤¤ì(€ô(€€€±½œ¡Ì°€‰É½ÕÑ”µ…ÍÍ¥¹•ˆ°Õ¹¥Ñ9…µ”¡Õ¹¥Ð¤€¬€ˆƒBÿBûBïFFBãBìƒBóBÃFF#FFFƒBèƒBëBïB×FBëBÔ€ˆ€¬‘•ÍÑ¥¹…Ñ¥½¸¹à€¬€ˆ°€ˆ€¬‘•ÍÑ¥¹…Ñ¥½¸¹ä€¬€ˆ¸ˆ°ìàè‘•ÍÑ¥¹…Ñ¥½¸¹à°äè‘•ÍÑ¥¹…Ñ¥½¸¹äô°Õ¹¥Ð¹¥¤ì(É•ÑÕÉ¸ÑÉÕ”ì(€ô((€™Õ¹Ñ¥½¸…¹•±QÉ…Ù•±=É‘•È¡Õ¹¥Ñ%¤ì(€€€½¹ÍÐÌ€ô•¹ÍÕÉ•MÑ…Ñ”¡ÕÉÉ•¹ÑMÑ…Ñ” ¤¤ì(€€€½¹ÍÐÕ¹¥Ð€ôÌ€˜˜€¡Ì¹Õ¹¥ÑÌñðmt¤¹™¥¹¡™Õ¹Ñ¥½¸€¡¥Ñ•´¤ìÉ•ÑÕÉ¸MÑÉ¥¹œ¡¥Ñ•´¹¥¤€ôôôMÑÉ¥¹œ¡Õ¹¥Ñ%¤ìô¤ì(€€€¥˜€ …Õ¹¥Ðñð€…Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È¤É•ÑÕÉ¸™…±Í”ì(€€€Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È€ô¹Õ±°ì(€€€¹½Ñ¥™ä ‹BsBÃFF#FFFƒBûFBóB×B÷FGBôˆ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô((€™Õ¹Ñ¥½¸É•Í½±Ù•A½¥¡½¥”¡Õ¹¥Ñ%°à°ä°¡½¥”¤ì(€€€½¹ÍÐÌ€ô•¹ÍÕÉ•MÑ…Ñ”¡ÕÉÉ•¹ÑMÑ…Ñ” ¤¤ì(€€€½¹ÍÐÕ¹¥Ð€ôÌ€˜˜€¡Ì¹Õ¹¥ÑÌñðmt¤¹™¥¹¡™Õ¹Ñ¥½¸€¡¥Ñ•´¤ìÉ•ÑÕÉ¸MÑÉ¥¹œ¡¥Ñ•´¹¥¤€ôôôMÑÉ¥¹œ¡Õ¹¥Ñ%¤ìô¤ì(€€€½¹ÍÐÑ¥±”€ôÌ€˜˜Ì¹µ…Ámåt€˜˜Ì¹µ…Ámåumátì(€€€¥˜€ …Ìñð€…Õ¹¥Ðñð€…Ñ¥±”ñð€…Ñ¥±”¹Á½¤ñðÑ¥±”¹Á½¤¹ÕÍ•¤É•ÑÕÉ¸™…±Í”ì(€€€½¹ÍÐÑåÁ•%€ôÑ¥±”¹Á½¤¹ÑåÁ”ñð€‰Õ¹­¹½Ý¸ˆì(€€€½¹ÍÐÑåÁ”€ô€¡%9QIMQ}QeAMmÑåÁ•%‘t€˜˜%9QIMQ}QeAMmÑåÁ•%‘t¹¹…µ”¤ñðÑåÁ•%ì(€€€¥˜€¡¡½¥”€ôôô€‰ÍÑÕ‘äˆ¤ì)Ì¹É•Í½ÕÉ•Ì¹Í¥•¹”€ô€¡Ì¹É•Í½ÕÉ•Ì¹Í¥•¹”ñð€À¤€¬€ÄÀì)±½œ¡Ì°€‰Á½¤µÍÑÕ‘¥•ˆ°Õ¹¥Ñ9…µ”¡Õ¹¥Ð¤€¬€ˆƒBãFFBïB×BÓBûBËBÃBìƒBûBÇF+B×BëFƒ
¬ˆ€¬ÑåÁ”€¬€‹
ìƒBàƒBÿBûBïFFBãBì€ÄÀƒB÷BÃFBëBà¸ˆ°ìàèà°äèäô°Õ¹¥Ð¹¥¤ì(€€€ô•±Í”ì)Ì¹É•Í½ÕÉ•Ì¹½±€ô€¡Ì¹É•Í½ÕÉ•Ì¹½±ñð€À¤€¬€ÄÈì)½¹ÍÐ¥Ñä€ô€¡Ì¹¥Ñ¥•Ìñðmt¤¹Í±¥” ¤¹Í½ÉÐ¡™Õ¹Ñ¥½¸€¡„°ˆ¤ì(€É•ÑÕÉ¸¡•‰åÍ¡•Ø¡Õ¹¥Ð¹à°Õ¹¥Ð¹ä°„¹à°„¹ä¤€´¡•‰åÍ¡•Ø¡Õ¹¥Ð¹à°Õ¹¥Ð¹ä°ˆ¹à°ˆ¹ä¤ì)ô¥lÁtì)¥˜€¡¥Ñä¤¥Ñä¹ÁÉ½‘ÕÑ¥½¸€ô€¡¥Ñä¹ÁÉ½‘ÕÑ¥½¸ñð€À¤€¬€ì)±½œ¡Ì°€‰Á½¤µÍ…±Ù…•ˆ°Õ¹¥Ñ9…µ”¡Õ¹¥Ð¤€¬€ˆƒFBÃBßBûBÇFBÃBìƒBûBÇF+B×BëFƒ
¬ˆ€¬ÑåÁ”€¬€‹
ìè€¬ÄÈƒBßBûBïBûFBÀƒBà€¬ØƒBÿFBûBãBßBËBûBÓFFBËBÀƒBÇBïBãBÛBÃBçF#B×BóFƒBÏBûFBûBÓF¸ˆ°ìàèà°äèäô°Õ¹¥Ð¹¥¤ì(€€€ô(€€€Ñ¥±”¹Á½¤¹ÕÍ•€ôÑÉÕ”ì(€€€Õ¹¥Ð¹ÑÉ…Ù•±=É‘•È€ô¹Õ±°ì(€€€½¹ÍÐÙ…±Õ”€ô‘•‰Õœ ¤ì(€€€¥˜€¡Ù…±Õ”€˜˜ÑåÁ•½˜Ù…±Õ”¹É•¹‘•È€ôôô€‰™Õ¹Ñ¥½¸ˆ¤Ù…±Õ”¹É•¹‘•È ¤ì(€€€¹½Ñ¥™ä ‹BwBÃFBûBÓBëBÀƒBãFBÿBûBïF3BßBûBËBÃB÷BÀˆ¤ì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô((€Ý¥¹‘½Ü¹Á½¡¥!Õµ…¹ÍA…Ñ¡¥¹œ€ôì(€€€Ù•ÉÍ¥½¸èYIM%=8°(€€€•¹ÍÕÉ•MÑ…Ñ”è•¹ÍÕÉ•MÑ…Ñ”°(€€€ÕÉÉ•¹ÑMÑ…Ñ”èÕÉÉ•¹ÑMÑ…Ñ”°(€€€™¥¹‘A…Ñ è™¥¹‘A…Ñ °(€€€Á…Ñ¡½É=É‘•ÈèÁ…Ñ¡½É=É‘•È°(€€€±½…Ñ•Q…É•Ðè±½…Ñ•Q…É•Ð°(€€€Ñ…É•ÑÉ½µQ¥±”èÑ…É•ÑÉ½µQ¥±”°(€€€…ÍÍ¥¹QÉ…Ù•±=É‘•Èè…ÍÍ¥¹QÉ…Ù•±=É‘•È°(€€€…¹•±QÉ…Ù•±=É‘•Èè…¹•±QÉ…Ù•±=É‘•È°(€€€ÁÉ½•ÍÍU¹¥ÐèÁÉ½•ÍÍU¹¥Ð°(€€€ÁÉ½•ÍÍ=É‘•ÉÌèÁÉ½•ÍÍ=É‘•ÉÌ°(€€€•ÍÑ¥µ…Ñ•QÕÉ¹Ìè•ÍÑ¥µ…Ñ•QÕÉ¹Ì°(€€€É•Í½±Ù•A½¥¡½¥”èÉ•Í½±Ù•A½¥¡½¥”°(€€€Õ¹¥Ñ9…µ”èÕ¹¥Ñ9…µ”°(€€€Í•ÑA½¥ÉÉ¥Ù…±!…¹‘±•Èè™Õ¹Ñ¥½¸€¡¡…¹‘±•È¤ìÁ½¥ÉÉ¥Ù…±!…¹‘±•È€ô¡…¹‘±•Èìô(€ôì)ô¤ ¤ì