(function () {
  "use strict";

  function emptyYield() {
    return { food: 0, production: 0, gold: 0, science: 0 };
  }

  function addYield(target, source, multiplier) {
    const mult = multiplier == null ? 1 : multiplier;
    ["food", "production", "gold", "science"].forEach(function (key) {
      target[key] += (source && source[key] ? source[key] : 0) * mult;
    });
    return target;
  }

  function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function neighborsOf(x, y, size) {
    const list = [];
    for (let yy = Math.max(0, y - 1); yy <= Math.min(size - 1, y + 1); yy++) {
      for (let xx = Math.max(0, x - 1); xx <= Math.min(size - 1, x + 1); xx++) {
        if (xx !== x || yy !== y) list.push({ x: xx, y: yy });
      }
    }
    return list;
  }

  function passableTile(tile) { return tile && tile.terrain !== "water"; }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function chebyshev(x1, y1, x2, y2) {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
  }

  function isAdjacent(x1, y1, x2, y2) {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return dx <= 1 && dy <= 1 && (dx + dy > 0);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  function formatDate(value) {
    if (!value) return "—";
    try { return new Date(value).toLocaleString("ru-RU", { day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit" }); } catch (e) { return "—"; }
  }

  function formatCost(cost) {
    const parts = [];
    if (cost.production) parts.push("🔨 " + cost.production);
    if (cost.gold) parts.push("🪙 " + cost.gold);
    if (cost.food) parts.push("🍞 " + cost.food);
    if (cost.science) parts.push("🔬 " + cost.science);
    return parts.join(" · ");
  }

  function nonProductionCost(cost) {
    const result = {};
    Object.keys(cost || {}).forEach(function (key) {
      if (key !== "production") result[key] = cost[key];
    });
    return result;
  }

  function growthNeed(population) {
    return 12 + population * 7;
  }

  function yieldText(yieldObj) {
    const parts = [];
    if (yieldObj.food) parts.push("🍞" + yieldObj.food);
    if (yieldObj.production) parts.push("🔨" + yieldObj.production);
    if (yieldObj.gold) parts.push("🪙" + yieldObj.gold);
    if (yieldObj.science) parts.push("🔬" + yieldObj.science);
    return parts.length ? parts.join(" ") : "нет дохода";
  }

  window.EpohiUtils = {
    emptyYield,
    addYield,
    randomChoice,
    neighborsOf,
    passableTile,
    clamp,
    chebyshev,
    isAdjacent,
    escapeHtml,
    formatDate,
    formatCost,
    nonProductionCost,
    growthNeed,
    yieldText
  };
})();
