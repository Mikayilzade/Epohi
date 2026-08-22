(function () {
  "use strict";

  const startedAt = Date.now();

  function installObserverSafety() {
    if (window.__epohiCoherenceObserverSafetyInstalled) return;
    const NativeObserver = window.MutationObserver;
    if (typeof NativeObserver !== "function") return;

    const nativeObserve = NativeObserver.prototype.observe;
    const nativeDisconnect = NativeObserver.prototype.disconnect;
    const nativeTakeRecords = NativeObserver.prototype.takeRecords;
    const nativeRaf = window.requestAnimationFrame.bind(window);
    const nativeSetTimeout = window.setTimeout.bind(window);
    const observerStates = [];
    let safetyDepth = 0;

    const stats = window.__epohiObserverSafetyStats = window.__epohiObserverSafetyStats || {
      observers: 0,
      callbacks: 0,
      records: 0,
      maxBatch: 0,
      protectedTasks: 0,
      suppressedHeavy: 0,
      narrowedHeavy: 0
    };
    ["protectedTasks", "suppressedHeavy", "narrowedHeavy"].forEach(function (key) {
      if (!Number.isFinite(stats[key])) stats[key] = 0;
    });

    function appendPending(observerState, records) {
      if (!records || !records.length) return;
      observerState.pending = observerState.pending.concat(Array.from(records));
      if (observerState.pending.length > 240) observerState.pending = observerState.pending.slice(-240);
    }

    function normalizeObservation(target, options) {
      const input = Object.assign({}, options || {});
      const id = target && target.id || "";

      // Broad render listeners are transitional debt. They are suppressed while their
      // useful work is driven by explicit action / ui-settled invalidation instead.
      if (target === document.body && input.childList && input.subtree) {
        stats.suppressedHeavy += 1;
        return null;
      }
      if (id === "map" && input.childList) {
        stats.suppressedHeavy += 1;
        return null;
      }
      if (id === "screenRoot" && input.childList && input.subtree) {
        stats.suppressedHeavy += 1;
        return null;
      }
      if (id === "contextPanel" && input.childList && input.subtree) {
        stats.suppressedHeavy += 1;
        return null;
      }

      const modalIds = new Set([
        "cityModal", "feedbackTreasuryModal", "strategyDiplomacyModal",
        "stabilityDecisionModal", "stabilityMajorModal", "captureChoiceModal",
        "coherenceProposalModal", "victoryModal", "wikiModal", "menuModal"
      ]);
      if (modalIds.has(id) && input.childList && input.subtree) {
        stats.narrowedHeavy += 1;
        return { attributes: true, attributeFilter: ["class"] };
      }

      return input;
    }

    function pauseObservers() {
      observerStates.forEach(function (observerState) {
        if (observerState.disconnectedByClient || !observerState.native) return;
        appendPending(observerState, nativeTakeRecords.call(observerState.native));
        nativeDisconnect.call(observerState.native);
      });
    }

    function restoreObservers() {
      observerStates.forEach(function (observerState) {
        if (observerState.disconnectedByClient || !observerState.native) return;
        observerState.registrations.forEach(function (entry) {
          nativeObserve.call(observerState.native, entry.target, entry.options);
        });
        if (observerState.pending.length) observerState.scheduleDelivery();
      });
    }

    function runProtectedTask(callback, thisArg, args) {
      const outermost = safetyDepth === 0;
      if (outermost) pauseObservers();
      safetyDepth += 1;
      stats.protectedTasks += 1;
      try {
        return callback.apply(thisArg, args || []);
      } finally {
        safetyDepth -= 1;
        if (outermost) restoreObservers();
      }
    }

    window.requestAnimationFrame = function (callback) {
      if (typeof callback !== "function" || safetyDepth <= 0) return nativeRaf(callback);
      return nativeRaf(function (time) {
        return runProtectedTask(callback, window, [time]);
      });
    };

    window.setTimeout = function (callback, delay) {
      const args = Array.prototype.slice.call(arguments, 2);
      if (typeof callback !== "function" || safetyDepth <= 0) {
        return nativeSetTimeout.apply(window, [callback, delay].concat(args));
      }
      return nativeSetTimeout(function () {
        return runProtectedTask(callback, window, args);
      }, delay);
    };

    function CoalescedMutationObserver(callback) {
      const observerState = {
        native: null,
        frame: 0,
        pending: [],
        registrations: [],
        disconnectedByClient: false,
        scheduleDelivery: null
      };

      function scheduleDelivery() {
        if (observerState.frame || observerState.disconnectedByClient || !observerState.pending.length) return;
        observerState.frame = nativeRaf(function () {
          observerState.frame = 0;
          if (observerState.disconnectedByClient || !observerState.pending.length) {
            observerState.pending = [];
            return;
          }
          const batch = observerState.pending;
          observerState.pending = [];
          stats.callbacks += 1;
          stats.records += batch.length;
          stats.maxBatch = Math.max(stats.maxBatch, batch.length);
          runProtectedTask(callback, observerState.native, [batch, observerState.native]);
        });
      }
      observerState.scheduleDelivery = scheduleDelivery;

      const native = new NativeObserver(function (records) {
        appendPending(observerState, records);
        scheduleDelivery();
      });
      observerState.native = native;
      observerStates.push(observerState);

      native.observe = function (target, options) {
        observerState.disconnectedByClient = false;
        const normalized = normalizeObservation(target, options);
        if (!normalized) return;
        const existing = observerState.registrations.find(function (entry) { return entry.target === target; });
        if (existing) existing.options = normalized;
        else observerState.registrations.push({ target: target, options: normalized });
        if (safetyDepth > 0) return;
        return nativeObserve.call(native, target, normalized);
      };

      native.disconnect = function () {
        observerState.disconnectedByClient = true;
        observerState.registrations = [];
        observerState.pending = [];
        if (observerState.frame) {
          window.cancelAnimationFrame(observerState.frame);
          observerState.frame = 0;
        }
        return nativeDisconnect.call(native);
      };

      native.takeRecords = function () {
        const records = nativeTakeRecords.call(native);
        if (observerState.pending.length) {
          const combined = observerState.pending.concat(Array.from(records || []));
          observerState.pending = [];
          return combined;
        }
        return records;
      };

      stats.observers += 1;
      return native;
    }

    CoalescedMutationObserver.prototype = NativeObserver.prototype;
    Object.setPrototypeOf(CoalescedMutationObserver, NativeObserver);
    window.MutationObserver = CoalescedMutationObserver;
    window.__epohiCoherenceObserverSafetyInstalled = true;
    window.EpohiObserverSafety = {
      version: 5,
      stats: stats,
      runProtected: function (callback) {
        if (typeof callback !== "function") return undefined;
        return runProtectedTask(callback, window, []);
      }
    };
  }

  function installMobileGpuGuard() {
    if (document.getElementById("epohiMobileGpuGuard")) return;
    const style = document.createElement("style");
    style.id = "epohiMobileGpuGuard";
    style.textContent = "@media(max-width:720px){*{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}.flow-event-toast{transition:none!important}}";
    document.head.appendChild(style);
  }

  installObserverSafety();
  installMobileGpuGuard();

  window.EpohiPerformance = {
    version: 6,
    mode: "explicit-invalidation-bridge",
    snapshot: function () {
      const observerStats = window.__epohiObserverSafetyStats || {};
      return {
        mode: "explicit-invalidation-bridge",
        uptimeMs: Date.now() - startedAt,
        waterTiles: document.querySelectorAll("#map .tile.water").length,
        routeBadges: document.querySelectorAll("#map .route-badge").length,
        observerCallbacks: Number(observerStats.callbacks || 0),
        observerRecords: Number(observerStats.records || 0),
        observerProtectedTasks: Number(observerStats.protectedTasks || 0),
        observerSuppressedHeavy: Number(observerStats.suppressedHeavy || 0),
        observerNarrowedHeavy: Number(observerStats.narrowedHeavy || 0)
      };
    }
  };
})();