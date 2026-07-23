(function () {
  "use strict";

  if (!window.EpohiHumansAutonomy) {
    throw new Error("EpohiHumansAutonomy is required before humans-autonomy-fix.js");
  }

  const autonomy = window.EpohiHumansAutonomy;
  const originalProcessOrders = autonomy.processOrders;
  const MAX_EXTRA_STEPS = 8;

  function state() {
    const debug = typeof window.__epohiDebug === "function" ? window.__epohiDebug() : null;
    return debug && debug.state ? debug.state : null;
  }

  function drainScout(stateValue, unit) {
    if (!unit || unit.type !== "scout" || !unit.order || unit.order.type !== "explore") return 0;
    let steps = 0;
    while (
      steps < MAX_EXTRA_STEPS &&
      unit.order &&
      unit.order.type === "explore" &&
      unit.order.status !== "paused" &&
      unit.moves > 0 &&
      !unit.acted &&
      unit.hp > 0
    ) {
      const moved = autonomy.processUnitOrder(stateValue, unit);
      if (!moved) break;
      steps += 1;
    }
    return steps;
  }

  function drainAllScouts(stateValue) {
    let steps = 0;
    (stateValue.units || []).forEach(function (unit) {
      steps += drainScout(stateValue, unit);
    });
    return steps;
  }

  autonomy.processOrders = function (stateValue) {
    const reports = originalProcessOrders(stateValue);
    drainAllScouts(stateValue);
    return reports;
  };

  const endTurnButton = document.getElementById("endTurnBtn");
  if (endTurnButton) {
    endTurnButton.addEventListener("click", function () {
      if (endTurnButton.disabled) return;
      const current = state();
      if (!current) return;
      const moved = drainAllScouts(current);
      if (moved > 0) {
        const debug = window.__epohiDebug();
        if (debug && typeof debug.render === "function") debug.render();
      }
    }, true);
  }

  autonomy.drainScoutMoves = drainScout;
  autonomy.version = 2;
})();
