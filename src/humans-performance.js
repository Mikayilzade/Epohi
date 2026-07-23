(function () {
  "use strict";

  const NativeMutationObserver = window.MutationObserver;
  const stats = {
    observers: 0,
    nativeCallbacks: 0,
    deliveredCallbacks: 0,
    coalescedRecords: 0
  };

  if (NativeMutationObserver && !window.__epohiCoalescedObservers) {
    function CoalescedMutationObserver(callback) {
      let records = [];
      let frame = 0;
      const wrapper = this;
      const native = new NativeMutationObserver(function (batch) {
        stats.nativeCallbacks += 1;
        stats.coalescedRecords += batch.length;
        records.push.apply(records, batch);
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          frame = 0;
          const delivery = records;
          records = [];
          stats.deliveredCallbacks += 1;
          callback(delivery, wrapper);
        });
      });

      stats.observers += 1;
      this.observe = function (target, options) { native.observe(target, options); };
      this.disconnect = function () {
        native.disconnect();
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        records = [];
      };
      this.takeRecords = function () {
        return records.splice(0).concat(native.takeRecords());
      };
    }

    CoalescedMutationObserver.prototype = NativeMutationObserver.prototype;
    window.MutationObserver = CoalescedMutationObserver;
    window.__epohiCoalescedObservers = true;
  }

  window.EpohiPerformance = {
    version: 1,
    mode: "coalesced-observers",
    stats: stats,
    snapshot: function () {
      return Object.assign({}, stats);
    }
  };
})();
