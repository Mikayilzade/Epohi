(function () {
  "use strict";

  const data = window.EpohiData;
  const { CITY_MIN_DISTANCE, PLAYER_CITY_RULES } = data;
  const { chebyshev, neighborsOf, passableTile } = window.EpohiUtils;
  const { cityRadius } = window.EpohiTerritory;

  function playerCities(state) {
    return Array.isArray(state.cities) && state.cities.length ? state.cities
      : (state.city ? [state.city] : []);
  }

  function blockReason(state, unit) {
    if (!unit || unit.type !== "settler") return "выбран не поселенец";
    if (unit.acted) return "юнит уже действовал";
    const cities = playerCities(state);
    const capacity = Number(state.cityCapacity) || PLAYER_CITY_RULES.defaultCapacity;
    if (cities.length >= capacity)
      return "административная ёмкость исчерпана (" + cities.length + "/" + capacity + ")";
    const tile = state.map[unit.y] && state.map[unit.y][unit.x];
    if (!tile || !tile.revealed) return "клетка не разведана";
    if (!passableTile(tile)) return "неподходящая местность";
    const occupiedByPlayer = state.units.some(function (other) {
      return other.id !== unit.id && other.x === unit.x && other.y === unit.y;
    });
    const occupiedByRival = (state.rivals || []).some(function (civ) {
      return (civ.units || []).some(function (other) {
        return other.hp > 0 && other.x === unit.x && other.y === unit.y;
      }) || (civ.cities || []).some(function (city) {
        return city.hp > 0 && city.x === unit.x && city.y === unit.y;
      });
    });
    const occupiedByBarbarian = (state.barbarians || []).some(function (other) {
      return other.hp > 0 && other.x === unit.x && other.y === unit.y;
    });
    if (occupiedByPlayer || occupiedByRival || occupiedByBarbarian
      || (tile.camp && tile.camp.hp > 0) || tile.poi) return "клетка занята";
    const rivals = [].concat(...(state.rivals || []).map(function (civ) { return civ.cities || []; }));
    if (rivals.some(function (city) {
      return chebyshev(unit.x, unit.y, city.x, city.y) <= cityRadius(city);
    })) return "слишком близко к другому городу";
    if (cities.concat(rivals).some(function (city) {
      return chebyshev(unit.x, unit.y, city.x, city.y) < CITY_MIN_DISTANCE;
    })) return "слишком близко к другому городу";
    let potential = 0;
    neighborsOf(unit.x, unit.y, state.mapSize || state.map.length)
      .concat([{ x:unit.x, y:unit.y }]).forEach(function (point) {
        const tileYield = window.EpohiEconomy.getTileYield(
          state.map[point.y][point.x], data.TERRAIN, data.IMPROVEMENTS, data.FEATURES);
        potential += tileYield.food + tileYield.production;
      });
    if (potential < PLAYER_CITY_RULES.minimumFoundingYield) return "низкий потенциал клетки";
    return "";
  }

  function foundCity(state, unitId, name, options) {
    const unit = state.units.find(function (candidate) { return candidate.id === unitId; });
    const reason = blockReason(state, unit);
    if (reason) return { reason };
    const city = {
      id:"player-city" + options.now(), name:name.trim(), x:unit.x, y:unit.y,
      population:1, food:0, production:0, buildings:[], queue:null,
      hp:PLAYER_CITY_RULES.foundingHealth, maxHp:PLAYER_CITY_RULES.foundingHealth,
      capital:false, youngUntil:state.turn + PLAYER_CITY_RULES.youngTurns
    };
    state.cities.push(city);
    if (options.ensureCity) options.ensureCity(city);
    options.revealAround(state, city.x, city.y, 1);
    neighborsOf(city.x, city.y, state.mapSize || state.map.length)
      .concat([{ x:city.x, y:city.y }]).forEach(function (point) {
        const tile = state.map[point.y][point.x];
        if (!tile.owner) tile.owner = city.id;
      });
    state.units = state.units.filter(function (candidate) { return candidate.id !== unit.id; });
    options.logEvent(state, "city-founded", "Основан город " + city.name + ".",
      { x:city.x, y:city.y }, { actorType:"player", actorId:"player" });
    return { city };
  }

  window.EpohiPlayerSettlements = { blockReason, foundCity };
})();
