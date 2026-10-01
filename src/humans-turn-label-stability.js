(function () {
  "use strict";

  const turnValue = document.getElementById("turnValue");
  if (!turnValue || turnValue.__epohiTurnLabelStable) return;

  const descriptor = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
  if (!descriptor || typeof descriptor.get !== "function" || typeof descriptor.set !== "function") return;

  Object.defineProperty(turnValue, "textContent", {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: function () {
      return descriptor.get.call(this);
    },
    set: function (value) {
      const next = value == null ? "" : String(value);
      if (descriptor.get.call(this) === next) return;
      descriptor.set.call(this, next);
    }
  });

  Object.defineProperty(turnValue, "__epohiTurnLabelStable", {
    configurable: false,
    enumerable: false,
    value: true
  });

  window.EpohiTurnLabelStability = {
    version: 1,
    installed: true
  };
})();
